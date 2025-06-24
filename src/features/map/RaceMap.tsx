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
import TopBar from '@features/map/components/TopBar';
import SideToolbar from '@features/map/components/SideToolbar';
import SettingsSheet from '@features/map/components/SettingsSheet';
import ErrorBanner from '@features/map/components/ErrorBanner';
import { GpsPanel } from '@features/map/components/GpsPanel';
import CompassButton from '@features/map/components/CompassButton';
import { InfoCard } from '@shared/ui/InfoCard';

interface Props {
  courseId: string;
  isAdmin?: boolean;
}

export default function RaceMap({ courseId, isAdmin = false }: Props) {
  const mapRef = useLeafletMap('map-root');

  // ---- Course params ----
  const {
    axis: courseAxisNum,
    distanceNm: courseSizeNmNum,
    startLineM: startLineLenMNum,
    setAxis,
    setDistanceNm,
    setStartLineM,
  } = useCourseStore();
  const [courseAxis, setCourseAxis] = useState(String(courseAxisNum));
  const [courseSizeNm, setCourseSizeNm] = useState(String(courseSizeNmNum));
  const [startLineLenM, setStartLineLenM] = useState(String(startLineLenMNum));

  // ---- Hooks ----
  useDeviceOrientation(); // currently unused but can be hooked to mapBearing if needed
  const gps = useGpsWatch({});
  const { redraw } = useCourseDraw(mapRef, {
    axis: Number(courseAxisNum),
    distanceNm: Number(courseSizeNmNum),
    startLineM: Number(startLineLenMNum),
  });

  // mqtt sync
  const lastPosRef = useRef<L.LatLng | null>(null);
  if (gps.latLng) lastPosRef.current = gps.latLng;
  useMqttPosSync({
    courseId,
    isAdmin,
    getLatestPos: () => lastPosRef.current,
    getCourseParams: () => ({ axis: courseAxis, distance_nm: courseSizeNm, start_line_m: startLineLenM }),
    onRecvPos: (p) => !isAdmin && redraw(p),
    onRecvCourse: (p) => {
      setAxis(p.axis); setDistanceNm(p.distance_nm); setStartLineM(p.start_line_m);
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
    const displayDir = ((mapBearing - lastDirRef.current) % 360 + 360) % 360;
    if (!myMarkerRef.current) {
      const size = 28;
      const iconHtml = `<div style=\"width:${size}px;height:${size}px;font-size:0;\"><svg viewBox='0 0 100 100' width='${size}' height='${size}' style='display:block'><polygon points='50,10 85,90 50,70 15,90' fill='#0078ff' stroke='#ffffff' stroke-width='6'></polygon></svg></div>`;
      myMarkerRef.current = L.marker(gps.latLng, {
        icon: L.divIcon({ html: iconHtml, className: 'observer-icon', iconSize: [size, size], iconAnchor: [size/2, size] }),
        rotationAngle: displayDir,
        rotationOrigin: 'center center',
        zIndexOffset: 500,
      } as any).addTo(mapRef.current);
    } else {
      myMarkerRef.current.setLatLng(gps.latLng);
      (myMarkerRef.current as any).setRotationAngle(displayDir);
    }
  }, [gps.latLng, gps.headingDeg, mapBearing, isAdmin]);

  // ---- auto center ----
  const centeredRef = useRef(false);
  useEffect(() => {
    if (!gps.latLng || !mapRef.current) return;
    const map = mapRef.current;
    if (!centeredRef.current) { map.setView(gps.latLng, 15); centeredRef.current = true; }
    else if (!map.getBounds().pad(-0.2).contains(gps.latLng)) map.panTo(gps.latLng);
  }, [gps.latLng]);

  // ---- Settings ----
  const [settingsVisible, setSettingsVisible] = useState(false);
  const saveSettings = () => {
    setSettingsVisible(false);
    const a = Number(courseAxis); const d = Number(courseSizeNm); const s = Number(startLineLenM);
    if (!Number.isNaN(a)) setAxis(a); if (!Number.isNaN(d)) setDistanceNm(d); if (!Number.isNaN(s)) setStartLineM(s);
    if (lastPosRef.current) redraw(lastPosRef.current);
  };

  // admin redraw on gps
  if (isAdmin && gps.latLng) redraw(gps.latLng);

  return (
    <div className="relative w-screen h-screen-safe">
      <div id="map-root" className="w-full h-full" />
      <TopBar title={courseId} onlineCount={1} />
      {!isAdmin && (
        <div style={{ position: 'absolute', top: 64, left: '50%', transform: 'translateX(-50%)', zIndex: 1100 }}>
          <GpsPanel speedKts={gps.speedKts} bearingDeg={gps.headingDeg} gpsOk={gps.ok} />
        </div>
      )}
      <SideToolbar isAdmin={isAdmin} onLocate={() => { if (gps.latLng && mapRef.current) mapRef.current.setView(gps.latLng, 15); }} onMap={() => {}} onSettings={() => setSettingsVisible(true)} />
      <SettingsSheet isVisible={isAdmin && settingsVisible} courseAxis={courseAxis} courseSizeNm={courseSizeNm} startLineLenM={startLineLenM} setCourseAxis={setCourseAxis} setCourseSizeNm={setCourseSizeNm} setStartLineLenM={setStartLineLenM} onCancel={() => setSettingsVisible(false)} onSave={saveSettings} />
      <ErrorBanner message={gps.errorMsg} />
      <CompassButton bearing={mapBearing} onToggle={() => { const axisNum = Number(courseAxis)||0; setMapBearing(prev=>Math.abs(prev)<1e-2?-axisNum:0); }} />
      <div style={{ position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)', display:'flex', gap:12, zIndex:1000 }}>
        <InfoCard title="COURSE AXIS" value={`${courseAxisNum}°M`} />
        <InfoCard title="COURSE SIZE" value={`${courseSizeNmNum}NM`} />
      </div>
    </div>
  );
} 