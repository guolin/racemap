'use client';
import React, { useEffect, useState, useRef, ChangeEvent } from 'react';
import { IoArrowBackOutline } from 'react-icons/io5';
import { useT } from 'src/locale';
import L from 'leaflet';
import CompassButton from '@features/map/components/CompassButton';
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
            className="text-foreground hover:bg-accent flex items-center gap-1 px-2 py-1 text-base font-medium"
          >
            <IoArrowBackOutline style={{ width: 20, height: 20 }} />
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

function CourseSettingsForm({ draft, setDraft }: { draft: Record<string, string>; setDraft: (d: Record<string, string>) => void }) {
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
    let val = cur + delta;
    if (typeof decimals === 'number') {
      setDraft({ ...draft, [k]: val.toFixed(decimals) });
    } else {
      setDraft({ ...draft, [k]: String(Math.round(val)) });
    }
  };

  const commitField = (k: string) => {
    const raw = draft[k];
    if (raw === '') return;
    const num = Number(raw);
    if (!Number.isNaN(num)) setDraft({ ...draft, [k]: String(num) });
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
  const axisNum = Number((params as any)?.axis ?? 0);
  const [courseUp, setCourseUp] = useState(false); // false: north-up, true: course-up
  const bearing = courseUp ? -axisNum : 0;

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, {
      dragging: true,
      zoomControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: true,
      attributionControl: false,
      rotate: true,
      rotateControl: false,
    } as any).setView([0, 0], 13);
    // remove any rotate control dom if injected
    (containerRef.current.parentElement as HTMLElement)
      ?.querySelector('.leaflet-control-rotate')
      ?.remove();
    // initial bearing
    if ((mapRef.current as any).setBearing) {
      (mapRef.current as any).setBearing(bearing);
    }
    // blank background
    (containerRef.current as HTMLElement).style.background = '#e5e7eb'; // Tailwind gray-200
    
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

  // update map bearing when bearing state changes
  useEffect(() => {
    if (mapRef.current && (mapRef.current as any).setBearing) {
      (mapRef.current as any).setBearing(bearing, { animate: true });
    }
  }, [bearing]);

  // redraw when params change
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

    // 自动调整视图让航线充满全屏
    if (newGroup && newGroup.getBounds && newGroup.getBounds().isValid()) {
      mapRef.current.fitBounds(newGroup.getBounds(), { padding: [10, 10] });
    }
  }, [type, params]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <CompassButton
        bearing={bearing}
        top={16}
        onToggle={() => setCourseUp(prev => !prev)}
      />
    </div>
  );
} 