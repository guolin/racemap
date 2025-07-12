'use client';
// 引入 leaflet 旋转插件（仅客户端）
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('leaflet-rotate');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('leaflet-rotatedmarker');
}

import { useRef, useState, useEffect } from 'react';
import L from 'leaflet';
import { useLeafletMap } from '@features/map/hooks/useLeaflet';
import { useDeviceOrientation } from '@features/map/hooks/useDeviceOrientation';
import { useGpsWatch } from '@features/map/hooks/useGpsWatch';
import { useMqttPosSync } from '@features/mqtt/hooks/useMqttPosSync';
import { useCourseDraw } from '@features/map/hooks/useCourseDraw';
import { useCourseStore } from '@features/course/store';
import { useViewportHeight } from '@features/map/hooks/useViewportHeight';
import TopBar from './components/TopBar';
import OnlineCount from './components/OnlineCount';
import SideToolbar from '@features/map/components/SideToolbar';
import SettingsSheet from '@features/map/components/SettingsSheet';
import ErrorBanner from '@features/map/components/ErrorBanner';
import { GpsPanel } from '@features/map/components/GpsPanel';
import CompassButton from '@features/map/components/CompassButton';
import { InfoCard } from '@shared/ui/InfoCard';
import { CoordinatesDialog } from '@features/map/components/CoordinatesDialog';
import { useObserverPosPublish } from '@features/mqtt/hooks/useObserverPosPublish';
import { useObserversPos, ObserverPos } from '@features/mqtt/hooks/useObserversPos';
import { ObserversLayer } from '@features/map/components/ObserversLayer';
import CourseSettingsDrawer from '@features/map/components/CourseSettingsDrawer';
import BottomInfoCards from '@features/map/components/BottomInfoCards';

interface Props {
  courseId: string;
  isAdmin?: boolean;
}

export default function RaceMap({ courseId, isAdmin = false }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mapRef = useLeafletMap('map-root');
  
  // 使用动态视口高度
  const viewportHeight = useViewportHeight();

  // ---- Course params ----
  const {
    axis: courseAxisNum,
    distanceNm: courseSizeNm,
    startLineM: startLineLenMNum,
    setAxis,
    setDistanceNm,
    setStartLineM,
  } = useCourseStore();
  // 仅用于 compass toggle: 直接取 store 值
  const courseAxis = courseAxisNum;

  // ---- Hooks ----
  useDeviceOrientation(); // currently unused but can be hooked to mapBearing if needed
  const gps = useGpsWatch({});
  // signal船（origin）坐标（从 MQTT 获取）
  const [origin, setOrigin] = useState<L.LatLng | null>(null);
  const { redraw } = useCourseDraw(mapRef);

  // mqtt sync
  const lastPosRef = useRef<L.LatLng | null>(null);
  if (gps.latLng) lastPosRef.current = gps.latLng;
  const type = useCourseStore((s)=>s.type);
  const params = useCourseStore((s)=>s.params);
  const setType = useCourseStore((s)=>s.setType);
  const setParams = useCourseStore((s)=>s.setParams);

  const publishNow = useMqttPosSync({
    courseId,
    isAdmin,
    getLatestPos: () => lastPosRef.current,
    getCourseData: () => ({ type, params }),
    onRecvPos: (p) => {
      if (!isAdmin) {
        setOrigin(p);
        redraw(p);
      }
    },
    onRecvCourse: (c) => {
      setType(c.type);
      setParams(c.params);
    }
  });

  // ---- Map bearing ----
  const [mapBearing, setMapBearing] = useState(0);
  useEffect(() => {
    if (mapRef.current && (mapRef.current as any).setBearing) {
      (mapRef.current as any).setBearing(mapBearing, { animate: true });
    }
  }, [mapBearing]);

  // ---- Observer marker ----
  const myMarkerRef = useRef<L.Marker | null>(null);
  const lastDirRef = useRef(0);
  useEffect(() => {
    if (isAdmin) return;
    if (!gps.latLng || !mapRef.current) return;
    const dir = gps.headingDeg ?? lastDirRef.current;
    if (dir != null && !Number.isNaN(dir)) lastDirRef.current = dir;
    if (!myMarkerRef.current) {
      const size = 28;
      // 调整 viewBox 和箭头位置，使箭头尖端在 y=0
      const iconHtml = `<div style=\"width:${size}px;height:${size}px;font-size:0;\"><svg viewBox='0 0 100 80' width='${size}' height='${size}' style='display:block'><polygon points='50,0 85,80 50,60 15,80' fill='#0078ff' stroke='#ffffff' stroke-width='6'></polygon></svg></div>`;
      myMarkerRef.current = L.marker(gps.latLng, {
        icon: L.divIcon({ 
          html: iconHtml, 
          className: 'observer-icon', 
          iconSize: [size, size], 
          iconAnchor: [size/2, 0], // 锚点在箭头尖端 (y=0)
        }),
        rotationAngle: lastDirRef.current + mapBearing,
        rotationOrigin: 'top center', // 旋转中心也在箭头尖端
        zIndexOffset: 500,
      } as any).addTo(mapRef.current);
    } else {
      myMarkerRef.current.setLatLng(gps.latLng);
      (myMarkerRef.current as any).setRotationAngle(lastDirRef.current + mapBearing); // 这里也改为加号
    }
  }, [gps.latLng, gps.headingDeg, mapBearing, isAdmin]);

  // ---- auto center ----
  const centeredRef = useRef(false);
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (gps.latLng) {
      // 有本地 GPS，优先居中到本地位置
      if (!centeredRef.current) {
        map.setView(gps.latLng, 15);
        centeredRef.current = true;
      } else if (!isAdmin && !map.getBounds().pad(-0.2).contains(gps.latLng)) {
        map.panTo(gps.latLng);
      }
    } else if (origin && !centeredRef.current) {
      // 尚无 GPS，但拿到了 signal船坐标
      map.setView(origin, 15);
      centeredRef.current = true;
    }
  }, [gps.latLng, origin, isAdmin]);

  // tooltip state for observer panel
  const [gpsTipVisible, setGpsTipVisible] = useState(false);
  const [lastGpsInfo, setLastGpsInfo] = useState<{ lat: number; lng: number; ts: number } | null>(null);

  useEffect(() => {
    if (gps.latLng) {
      setLastGpsInfo({ lat: gps.latLng.lat, lng: gps.latLng.lng, ts: Date.now() });
    }
  }, [gps.latLng]);

  // ---- Settings ----
  const [settingsVisible, setSettingsVisible] = useState(false);
  const closeSettings = () => {
    setSettingsVisible(false);
    // redraw based on latest params if origin exists
    if (origin) redraw(origin);
    if (publishNow) publishNow();
  };

  // ---- Coordinates Info ----
  const [coordinatesDialogVisible, setCoordinatesDialogVisible] = useState(false);
  
  // admin: 当 gps 更新时，更新 origin 并重绘航线
  useEffect(() => {
    if (isAdmin && gps.latLng) {
      setOrigin(gps.latLng);
      redraw(gps.latLng);
    }
  }, [isAdmin, gps.latLng, redraw]);

  // ---- Observer position sync ----
  const observerIdRef = useRef<string>('');
  if (observerIdRef.current === '') {
    const key = 'observerId';
    const saved = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    observerIdRef.current = saved ?? Math.random().toString(36).slice(2, 8).toUpperCase();
    if (!saved && typeof window !== 'undefined') localStorage.setItem(key, observerIdRef.current);
  }

  // Publish my position if NOT admin
  if (!isAdmin) {
    useObserverPosPublish({
      raceId: courseId,
      observerId: observerIdRef.current,
      getLatestPos: () => (gps.latLng ? { lat: gps.latLng.lat, lng: gps.latLng.lng, heading: gps.headingDeg } : null),
    });
  }

  // Subscribe to all observers
  const observersAll = useObserversPos({ 
    raceId: courseId, 
    observerId: observerIdRef.current 
  });
  const observers = observersAll.filter(o => o.id !== observerIdRef.current);
  
  // 计算在线人数：observersAll已经包含所有观察者（包括自己）
  const onlineCount = observersAll.length;
  
  // 当管理员修改航线参数时，立即广播更新
  useEffect(() => {
    if (isAdmin && publishNow) publishNow();
  }, [isAdmin, type, params, publishNow]);

  // ---- UI ----
  const handleDrawerSave = () => {
    if (origin) redraw(origin);
    if (publishNow) publishNow();
  };

  return (
    <div 
      className="relative w-screen" 
      style={{ height: viewportHeight > 0 ? viewportHeight : '100vh' }}
    >
      <div id="map-root" className="w-full h-full" />
      <TopBar 
        center={courseId} 
        right={<OnlineCount count={onlineCount} />} 
      />
      <ObserversLayer observers={observers} map={mapRef.current} />
      {!isAdmin && (
        <div style={{ position: 'absolute', top: 64, left: '50%', transform: 'translateX(-50%)', zIndex: 1100 }}>
          <GpsPanel speedKts={gps.speedKts} bearingDeg={gps.headingDeg} gpsOk={gps.ok} onClick={() => setGpsTipVisible(v=>!v)} />
          {gpsTipVisible && lastGpsInfo && (
            <div style={{ marginTop: 4, fontSize: 10, lineHeight: 1.3, textAlign: 'center', background:'rgba(255,255,255,0.9)', padding:'4px 6px', borderRadius:4 }}>
              {new Date(lastGpsInfo.ts).toLocaleTimeString()}<br />
              {lastGpsInfo.lat.toFixed(5)}, {lastGpsInfo.lng.toFixed(5)}
            </div>
          )}
        </div>
      )}
      <SideToolbar 
        isAdmin={isAdmin} 
        onLocate={() => { 
          if (gps.latLng && mapRef.current) {
            // 平滑地移动到用户位置，但保持当前缩放级别
            mapRef.current.panTo(gps.latLng, { animate: true });
          }
        }} 
        onSettings={() => {
          if (isAdmin) {
            setDrawerOpen(true);
          } else {
            setSettingsVisible(true);
          }
        }} 
        onInfo={() => setCoordinatesDialogVisible(true)} 
      />
      <CourseSettingsDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        onSave={handleDrawerSave}
      />
      <SettingsSheet isVisible={isAdmin && settingsVisible} onClose={closeSettings} />
      <CoordinatesDialog 
        isVisible={coordinatesDialogVisible}
        onClose={() => setCoordinatesDialogVisible(false)}
        origin={origin}
        courseType={type}
        courseParams={params}
      />
      <ErrorBanner message={gps.errorMsg} />
      <CompassButton bearing={mapBearing} onToggle={() => { const axisNum = courseAxis||0; setMapBearing(prev=>Math.abs(prev)<1e-2?-axisNum:0); }} />
      <BottomInfoCards courseAxis={courseAxisNum} courseSizeNm={courseSizeNm} />
    </div>
  );
}