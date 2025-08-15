'use client';
import React, { useEffect, useState, useRef, ChangeEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useT } from 'src/locale';
import L from 'leaflet';
import { useCourseStore } from '@features/course/store';
import { registry, allCoursePlugins, CourseTypeId } from '@features/course/plugins/registry';
import { useLang } from 'src/locale';
import { Button } from '@components/components/ui/button';
import { Input } from '@components/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/components/ui/select';
import TopBar from './TopBar';

// Ensure leaflet rotate plugin available
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('leaflet-rotate');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('leaflet-rotatedmarker');
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

// 工具函数：将 params 转为 string map
function toStringMap(obj: Record<string, any>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const k in obj) {
    result[k] = obj[k] != null ? String(obj[k]) : '';
  }
  return result;
}
// 工具函数：根据 schema 类型安全转换 draft
function parseDraftBySchema(draft: Record<string, string>, schema: any): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in schema) {
    const type = schema[key].type;
    const val = draft[key];
    if (type === 'number') {
      const n = Number(val);
      result[key] = isNaN(n) ? schema[key].default ?? 0 : n;
    } else if (type === 'boolean') {
      result[key] = val === 'true';
    } else {
      result[key] = val ?? '';
    }
  }
  return result;
}

export default function CourseSettingsDrawer({ isOpen, onClose, onSave }: Props) {
  const t = useT();
  const params = useCourseStore((s) => s.params);
  const setParams = useCourseStore((s) => s.setParams);
  const type = useCourseStore((s) => s.type);
  const plugin = registry[type];
  const [visible, setVisible] = useState(isOpen);
  const [animClass, setAnimClass] = useState(isOpen ? 'translate-x-0' : 'translate-x-full');
  const drawerRef = useRef<HTMLDivElement>(null);

  // 本地草稿分支，全部 string
  const [draft, setDraft] = useState(() => toStringMap(params));
  useEffect(() => {
    if (isOpen) setDraft(toStringMap(params));
  }, [isOpen, params]);

  // sync open state
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => setAnimClass('translate-x-0'));
    } else {
      setAnimClass('translate-x-full');
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const closeWithAnim = () => {
    setAnimClass('translate-x-full');
    setTimeout(onClose, 300);
  };

  // 保存：将draft按schema转为准确类型再写入主分支
  const handleSave = () => {
    setParams(parseDraftBySchema(draft, plugin.paramSchema));
    setTimeout(() => {
      onSave();
      closeWithAnim();
    }, 0);
  };

  // 取消：直接关闭，不保存
  const handleCancel = () => {
    closeWithAnim();
  };

  if (!visible) return null;

  return (
    <div
      ref={drawerRef}
      className={`fixed inset-0 z-[2000] bg-white flex flex-col transform transition-transform duration-300 ${animClass}`}
    >
      {/* Top Bar */}
      <TopBar
        left={
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            aria-label={t('common.save')}
            className="text-foreground hover:bg-muted-hover flex items-center gap-1 px-2 py-1 text-base font-medium"
          >
            <ArrowLeft size={20} />
            <span className="ml-1">{t('common.save')}</span>
          </Button>
        }
        center={t('common.course_settings')}
        right={
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            aria-label={t('common.cancel')}
            className="font-medium text-gray-500 border-gray-300 px-3 py-1"
          >
            {t('common.cancel')}
          </Button>
        }
      />
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col md:flex-row gap-4 relative pt-14">
        {/* Preview */}
        <div className="w-full max-w-[600px] m-2 mx-auto aspect-[4/3] bg-[#f9f9f9] border border-neutral-200 flex items-center justify-center">
          <PreviewMap params={parseDraftBySchema(draft, plugin.paramSchema)} />
        </div>
        {/* Form */}
        <div className="flex-1 md:w-1/2">
          <CourseSettingsForm draft={draft} setDraft={setDraft} />
        </div>
      </div>
    </div>
  );
}

function CourseSettingsForm({ draft, setDraft }: { draft: Record<string, string>; setDraft: (_d: Record<string, string>) => void }) {
  const t = useT();
  const lang = useLang();
  const type = useCourseStore((s) => s.type);
  const setType = useCourseStore((s) => s.setType);
  const plugin = registry[type];

  // 移除自定义样式，使用UI组件的默认样式

  const onNumChange = (k: string) => (e: ChangeEvent<HTMLInputElement>) => {
    setDraft({ ...draft, [k]: e.target.value });
  };

  const onNumBlur = (k: string) => () => {
    const raw = draft[k];
    const n = Number(raw);
    const decimals = (plugin.paramSchema as any)[k]?.decimals;
    if (isNaN(n)) {
      setDraft({ ...draft, [k]: '' });
    } else if (typeof decimals === 'number') {
      setDraft({ ...draft, [k]: n.toFixed(decimals) });
    } else {
      setDraft({ ...draft, [k]: String(Math.round(n)) });
    }
  };

  const adjust = (k: string, delta: number) => {
    const cur = Number(draft[k] ?? 0);
    const step = (plugin.paramSchema as any)[k]?.step ?? 1;
    const decimals = (plugin.paramSchema as any)[k]?.decimals;
    let val = cur + delta * step;
    if (typeof decimals === 'number') {
      setDraft({ ...draft, [k]: val.toFixed(decimals) });
    } else {
      setDraft({ ...draft, [k]: String(Math.round(val)) });
    }
  };



  return (
    <div className="flex flex-col gap-6">
      {/* Type selector */}
      <label className="flex flex-col gap-2 text-sm">
        {t('common.course_type')}
        <Select value={type} onValueChange={(value) => setType(value as CourseTypeId)}>
          <SelectTrigger>
            <SelectValue placeholder={t('common.select_course_type')} />
          </SelectTrigger>
          <SelectContent className="z-[9999]">
            {allCoursePlugins.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.i18n?.[lang]?.name ?? p.name ?? p.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      {/* Parameters */}
      {plugin.SettingsPanel ? (
        <plugin.SettingsPanel params={draft} setParams={(patch: Partial<typeof draft>) => {
          // 只合并 string 类型
          const filtered: Record<string, string> = {};
          Object.entries(patch).forEach(([k, v]) => {
            if (typeof v === 'string') filtered[k] = v;
          });
          setDraft({ ...draft, ...filtered });
        }} />
      ) : (
        Object.entries(plugin.paramSchema).map(([k, cfg]: any) => {
          // 处理 select 类型
          if (cfg.type === 'select') {
            return (
              <div key={k} className="flex items-center gap-3" style={{ fontSize: 14 }}>
                <span className="flex-1 min-w-[6rem]">{plugin.i18n?.[lang]?.labels[k] ?? cfg.label ?? k}</span>
                <Select
                  value={draft[k] ?? cfg.options?.[0] ?? ''}
                  onValueChange={(val) => setDraft({ ...draft, [k]: val })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    {cfg.options?.map((opt: string) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }
          
          // 处理数字类型（原有逻辑）
          const step = cfg.step ?? 1;
          return (
            <div key={k} className="flex items-center gap-3" style={{ fontSize: 14 }}>
              <span className="flex-1 min-w-[6rem]">{plugin.i18n?.[lang]?.labels[k] ?? cfg.label ?? k}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjust(k, -step)}
                aria-label="decrease"
              >
                −
              </Button>
              <Input
                type="number"
                value={draft[k] ?? ''}
                onChange={onNumChange(k)}
                onBlur={onNumBlur(k)}
                step={step}
                className="w-24 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjust(k, step)}
                aria-label="increase"
              >
                +
              </Button>
            </div>
          );
        })
      )}
    </div>
  );
}

/**
 * 预览小地图，实时根据当前航线参数绘制缩略图。
 */
function PreviewMap({ params }: { params: Record<string, string> }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const groupRef = useRef<L.FeatureGroup | null>(null);

  const type = useCourseStore((s) => s.type);

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, {
      dragging: true,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      attributionControl: false,
      rotate: false,
      rotateControl: false,
    } as any).setView([0, 0], 13);
    // blank background
    (containerRef.current as HTMLElement).style.background = '#e5e7eb'; // Tailwind gray-200
    
    // 添加自动缩放按钮
    const FitBoundsControl = L.Control.extend({
      options: {
        position: 'topleft'
      },
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', 'leaflet-control-zoom-in', container);
        button.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>`;
        button.title = '自动缩放';
        // 调整按钮和SVG样式
        button.style.width = '30px';
        button.style.height = '30px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.padding = '0';
        button.style.margin = '0';
        const svg = button.querySelector('svg');
        if (svg) {
          svg.setAttribute('width', '20');
          svg.setAttribute('height', '20');
          svg.style.display = 'block';
          svg.style.margin = 'auto';
        }
        
        L.DomEvent.on(button, 'click', L.DomEvent.stopPropagation)
          .on(button, 'click', L.DomEvent.preventDefault)
          .on(button, 'click', () => {
            if (groupRef.current && groupRef.current.getBounds && groupRef.current.getBounds().isValid()) {
              mapRef.current?.fitBounds(groupRef.current.getBounds(), { padding: [10, 10] });
            }
          });
        
        return container;
      }
    });
    
    new FitBoundsControl().addTo(mapRef.current);
    
    // 初始化时绘制航线并调整视图
    const plugin = registry[type];
    if (plugin) {
      const origin = L.latLng(0, 0);
      const newGroup = plugin.draw(mapRef.current, origin, params, null);
      groupRef.current = newGroup;
      
      // 自动调整视图让航线充满全屏
      if (newGroup && newGroup.getBounds && newGroup.getBounds().isValid()) {
        mapRef.current.fitBounds(newGroup.getBounds(), { padding: [10, 10] });
      }
    }
  }, []);



  // 自动缩放：只在首次进入和航线切换时
  useEffect(() => {
    if (!mapRef.current || !groupRef.current) return;
    
    // 自动调整视图让航线充满全屏
    if (groupRef.current.getBounds && groupRef.current.getBounds().isValid()) {
      mapRef.current.fitBounds(groupRef.current.getBounds(), { padding: [10, 10] });
    }
  }, [type]); // 只在航线类型变化时触发

  // 重绘：所有参数变化都重绘航线
  useEffect(() => {
    if (!mapRef.current) return;
    const plugin = registry[type];
    if (!plugin) return;

    // dummy origin (0,0)
    const origin = L.latLng(0, 0);

    // remove old group
    if (groupRef.current) {
      mapRef.current.removeLayer(groupRef.current);
    }

    const newGroup = plugin.draw(mapRef.current, origin, params, null);
    groupRef.current = newGroup;
  }, [type, params]); // 航线类型和参数变化都重绘

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
    </div>
  );
} 