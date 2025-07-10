'use client';
import React, { useEffect, useState, useRef, ChangeEvent } from 'react';
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

export default function CourseSettingsDrawer({ isOpen, onClose, onSave }: Props) {
  const t = useT();
  const [visible, setVisible] = useState(isOpen);
  const [animClass, setAnimClass] = useState(isOpen ? 'translate-x-0' : 'translate-x-full');
  const drawerRef = useRef<HTMLDivElement>(null);

  // sync open state
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      // next tick slide in
      requestAnimationFrame(() => setAnimClass('translate-x-0'));
    } else {
      // slide out then hide
      setAnimClass('translate-x-full');
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const closeWithAnim = () => {
    setAnimClass('translate-x-full');
    setTimeout(onClose, 300);
  };

  const handleSave = () => {
    // 尝试提交未失焦的输入
    if (typeof document !== 'undefined') {
      (document.activeElement as HTMLElement | null)?.blur?.();
    }
    // 等待本轮 state 同步再调用 onSave
    setTimeout(() => {
      onSave();
      closeWithAnim();
    }, 0);
  };

  if (!visible) return null;

  return (
    <div
      ref={drawerRef}
      className={`fixed inset-0 z-[2000] bg-white flex flex-col transform transition-transform duration-300 ${animClass}`}
    >
      {/* Top Bar */}
      <div className="h-14 flex items-center px-4 shadow-md bg-background border-b border-border">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={closeWithAnim} 
          aria-label="Back" 
          className="mr-4 text-foreground hover:bg-accent"
        >
          ←
        </Button>
        <h1 className="text-lg font-semibold flex-1 text-foreground">{t('common.course_settings')}</h1>
        <Button 
          variant="default"
          onClick={handleSave} 
          aria-label="Save"
          className="font-medium"
        >
          {t('common.save')}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col md:flex-row gap-4 relative">
        {/* Preview */}
        <div className="flex-1 md:w-1/2 h-64 md:h-auto rounded overflow-hidden">
          <PreviewMap />
        </div>
        {/* Form */}
        <div className="flex-1 md:w-1/2">
          <CourseSettingsForm />
        </div>
      </div>
    </div>
  );
}

function CourseSettingsForm() {
  const t = useT();
  const lang = useLang();
  const type = useCourseStore((s) => s.type);
  const params = useCourseStore((s) => s.params);
  const setType = useCourseStore((s) => s.setType);
  const setParams = useCourseStore((s) => s.setParams);

  const [draft, setDraft] = useState<Record<string, string>>({});
  useEffect(() => {
    const obj: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => {
      obj[k] = v != null ? String(v) : '';
    });
    setDraft(obj);
  }, [type]);

  const plugin = registry[type];

  // 移除自定义样式，使用UI组件的默认样式

  const onNumChange = (k: string) => (e: ChangeEvent<HTMLInputElement>) => {
    setDraft((d) => ({ ...d, [k]: e.target.value }));
  };

  const adjust = (k: string, delta: number) => {
    setDraft((d) => {
      const cur = Number(d[k] ?? params[k] ?? 0);
      const step = (plugin.paramSchema as any)[k]?.step ?? 1;
      const val = cur + delta;
      if (!Number.isNaN(val)) setParams({ [k]: val });
      return { ...d, [k]: String(val) };
    });
  };

  const commitField = (k: string) => {
    const raw = draft[k];
    if (raw === '') return;
    const num = Number(raw);
    if (!Number.isNaN(num)) setParams({ [k]: num });
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
        <plugin.SettingsPanel params={params} setParams={setParams} />
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
                value={draft[k] ?? String(params[k] ?? '')}
                onChange={onNumChange(k)}
                onBlur={() => commitField(k)}
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
function PreviewMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const groupRef = useRef<L.FeatureGroup | null>(null);

  const [courseUp, setCourseUp] = useState(false); // false: north-up, true: course-up

  const type = useCourseStore((s) => s.type);
  const params = useCourseStore((s) => s.params);

  const axisNum = Number((params as any)?.axis ?? 0);

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
    (containerRef.current as HTMLElement).style.background = '#f9f9f9';
  }, []);

  // update map bearing when bearing state changes
  useEffect(() => {
    if (mapRef.current && (mapRef.current as any).setBearing) {
      (mapRef.current as any).setBearing(bearing, { animate: true });
      // fit bounds after rotation to keep course visible
      if (groupRef.current && groupRef.current.getBounds().isValid()) {
        mapRef.current.fitBounds(groupRef.current.getBounds(), { padding: [10, 10] });
      }
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

    // fit bounds
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