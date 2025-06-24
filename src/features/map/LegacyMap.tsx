'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useMqttClient } from '@features/mqtt/hooks';
import { useCourseStore } from '@features/course/store';
import { drawCourse as renderCourse } from '@features/map/services/drawCourse';
import { InfoCard } from '@shared/ui/InfoCard';

console.debug('[Map] module loaded');

interface MapProps {
  courseId: string;
  isAdmin?: boolean;
}

// -------- 航线参数（后续可由用户输入或从服务器获取） --------
const WIND_DIRECTION = 40; // 风向角度 (0° 指北，顺时针增加)
const START_LINE_LENGTH_M = 100; // 起航线长度 (米)
const COURSE_DISTANCE_NM = 0.9; // 起航线中心到1标的距离 (海里)
const COURSE_DISTANCE_M = COURSE_DISTANCE_NM * 1852; // 海里转米

const posTopic = (id: string) => `sailing/${id}/pos`;
const routeTopic = (id: string) => `sailing/${id}/route`;

// 动态引入 leaflet-rotate 以扩展 Map API（客户端环境）
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('leaflet-rotate');
  // 旋转 Marker 插件，用于 setRotationAngle
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('leaflet-rotatedmarker');
}

const MapView = ({ courseId, isAdmin = false }: MapProps) => {
  try {
    console.debug('[Map] component initialized, courseId:', courseId, 'isAdmin:', isAdmin);
    const mapRef = useRef<L.Map | null>(null);
    const boatMarkerRef = useRef<L.Marker | null>(null);
    const routeLineRef = useRef<L.FeatureGroup | null>(null);
    const lastPosRef = useRef<L.LatLng | null>(null); // 存储最新定位（信号船）
    const myPosRef = useRef<L.LatLng | null>(null);  // 观察者自身位置
    const mqttClient = useMqttClient();
    const geoWatchIdRef = useRef<number | null>(null);
    const publishIntervalRef = useRef<any>(null);
    const lastPublishRef = useRef<number>(0);
    const myMarkerRef = useRef<L.Marker | null>(null);
    // 方向防抖记录
    const lastHdgRef = useRef<number>(0);
    const lastUpdateRef = useRef<number>(0);

    // 设备方向
    const [heading, setHeading] = useState<number>(0);
    const [settingsVisible, setSettingsVisible] = useState(false);

    // 当前地图 Bearing，0 = 磁北朝上，负 axis = 航线朝上
    const [mapBearing, setMapBearing] = useState<number>(0);

    // ---- 本地持久化: 默认值读取 ----
    const {
      axis: courseAxisNum,
      distanceNm: courseSizeNmNum,
      startLineM: startLineLenMNum,
      setAxis,
      setDistanceNm,
      setStartLineM,
    } = useCourseStore();

    // 本地字符串用于 input 受控
    const [courseAxis, setCourseAxis] = useState<string>(() => String(courseAxisNum));
    const [courseSizeNm, setCourseSizeNm] = useState<string>(() => String(courseSizeNmNum));
    const [startLineLenM, setStartLineLenM] = useState<string>(() => String(startLineLenMNum));

    // 同步 store -> local string when store changes外部更新时
    useEffect(() => setCourseAxis(String(courseAxisNum)), [courseAxisNum]);
    useEffect(() => setCourseSizeNm(String(courseSizeNmNum)), [courseSizeNmNum]);
    useEffect(() => setStartLineLenM(String(startLineLenMNum)), [startLineLenMNum]);

    // ---- GPS 信息（仅观察者端显示） ----
    const [gpsHeadingDeg, setGpsHeadingDeg] = useState<number | null>(null); // 行进方向
    const [gpsSpeedKts, setGpsSpeedKts] = useState<number | null>(null);     // 速度 (节)
    const [gpsOk, setGpsOk] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [gpsTipVisible, setGpsTipVisible] = useState(false);
    const [lastGpsInfo, setLastGpsInfo] = useState<{ lat: number; lng: number; ts: number } | null>(null);
    const lastGpsTsRef = useRef<number>(0);

    const myDirRef = useRef<number>(0);

    // 在现有 hooks 定义后插入 headingRef，用于跨 effect 读取
    const headingRef = useRef<number>(0);

    // 👇 添加航迹方向相关引用
    const lastGpsLatLngRef = useRef<L.LatLng | null>(null); // 保存上一条 GPS 坐标
    const lastBearingRef = useRef<number>(0); // 最近一次有效 bearing (0~360)

    const drawCourse = useCallback(
      (origin: L.LatLng) => {
        if (!mapRef.current) return;
        lastPosRef.current = origin;
        routeLineRef.current = renderCourse(
          mapRef.current,
          origin,
          {
            axis: courseAxisNum,
            distanceNm: courseSizeNmNum,
            startLineM: startLineLenMNum,
          },
          routeLineRef.current
        );
      },
      [courseAxisNum, courseSizeNmNum, startLineLenMNum]
    );

    // 始终朝上（北）的箭头，由插件负责整体旋转
    const createHeadingIcon = () => {
      const size = 28;
      const html = `<div style=\"width:${size}px;height:${size}px;font-size:0;\"><svg viewBox='0 0 100 100' width='${size}' height='${size}' style='display:block'><polygon points='50,10 85,90 50,70 15,90' fill='#0078ff' stroke='#ffffff' stroke-width='6'></polygon></svg></div>`;
      return L.divIcon({ html, className: 'my-boat-icon', iconSize: [size, size], iconAnchor: [size/2, size] });
    };

    useEffect(() => {
      if (mapRef.current) return;

      // 启用 leaflet-rotate 插件（rotate: true）
      const map = L.map('map-root', {
        zoomControl: false,
        rotate: true,
      } as L.MapOptions & { rotate: boolean });
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
        {
          attribution: '©OpenStreetMap, ©CartoDB',
          subdomains: 'abcd',
          maxZoom: 19,
          noWrap: true,
          crossOrigin: true
        }
      ).addTo(map);
      mapRef.current = map;

      // 底部右侧缩放控件
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // 船只图标：红色圆圈
      const boatIcon = L.divIcon({
        className: 'signal-boat-icon',
        html: '<div style="width:18px;height:18px;border-radius:50%;background:#e12d39;box-shadow:0 0 4px rgba(0,0,0,0.25);"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      boatMarkerRef.current = L.marker([0, 0], { icon: boatIcon }).addTo(map);

      // 地理定位处理函数
      const handleLocation = (e: L.LocationEvent) => {
        if (mapRef.current) {
          mapRef.current.setView(e.latlng, 15);
          boatMarkerRef.current?.setLatLng(e.latlng);
          drawCourse(e.latlng); // 定位后绘制航线
        }
      };

      // 如果浏览器支持地理定位，移动到当前位置
      if (navigator.geolocation) {
        map.locate({ setView: false, maxZoom: 15, enableHighAccuracy: true });
        map.on('locationfound', handleLocation);
      }

      // 方向事件处理（带防抖）
      const orientationHandler = (ev: DeviceOrientationEvent) => {
        const raw = (ev as any).webkitCompassHeading != null ? (ev as any).webkitCompassHeading : 360 - (ev.alpha || 0);
        if (Number.isNaN(raw)) return;

        const now = Date.now();
        // 仅当角度变化超过 2° 且距离上次更新时间 >120ms 时才更新，减少抖动
        if (Math.abs(raw - lastHdgRef.current) > 2 && now - lastUpdateRef.current > 120) {
          lastHdgRef.current = raw;
          lastUpdateRef.current = now;
          setHeading(raw);
          headingRef.current = raw;
        }
      };
      window.addEventListener('deviceorientationabsolute', orientationHandler, true);
      window.addEventListener('deviceorientation', orientationHandler, true);

      // 初始保持北朝上
      (map as any).setBearing?.(0);
      map.setView([39.9042, 116.4074], 12);

      return () => {
        map.off('locationfound', handleLocation);
        map.stopLocate();
        if (routeLineRef.current) {
          map.removeLayer(routeLineRef.current);
          routeLineRef.current = null;
        }
        window.removeEventListener('deviceorientationabsolute', orientationHandler, true);
        window.removeEventListener('deviceorientation', orientationHandler, true);
        map.remove();
        mapRef.current = null;
      };
    }, [courseId]);

    useEffect(() => {
      // 建立 MQTT 连接
      console.debug('[Map] setting up MQTT connection...');
      const client = mqttClient;

      const topic = posTopic(courseId);
      console.debug('[Map] subscribing to topic:', topic);

      // 非管理员订阅管理员位置
      client.subscribe(topic, { qos: 0 }, (err) => {
        if (err) console.error('MQTT subscribe error', err);
        else console.debug('[Map] successfully subscribed to:', topic);
      });

      // 等待MQTT连接成功后再启动GPS
      const startGpsWatch = () => {
        console.debug('[Map] MQTT connected, starting GPS watch...');
        if (navigator.geolocation) {
          console.debug('[GPS] start watching position...');
          geoWatchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              console.debug('[GPS] position update:', pos.coords);
              const { latitude, longitude, heading: gpsHeading, speed } = pos.coords as GeolocationCoordinates & { heading: number };
              const latlng = L.latLng(latitude, longitude);

              if (isAdmin) {
                // 管理员更新信号船位置并绘制航线
                lastPosRef.current = latlng;
                boatMarkerRef.current?.setLatLng(latlng);
                if (!routeLineRef.current) drawCourse(latlng);

                // 若目标点超出当前视窗，再平移过去（保持现有缩放级别）
                if (mapRef.current && !mapRef.current.getBounds().pad(-0.2).contains(latlng)) {
                  mapRef.current.panTo(latlng);
                }
              }

              // 计算航迹方向：优先使用浏览器提供的 heading，其次自行计算
              let trackBearing: number | null = null;
              if (gpsHeading != null && !Number.isNaN(gpsHeading)) {
                trackBearing = gpsHeading;
              } else if (lastGpsLatLngRef.current) {
                // 手动计算：利用球面三角公式
                const toRad = (d:number)=>d*Math.PI/180;
                const toDeg = (r:number)=>r*180/Math.PI;
                const φ1 = toRad(lastGpsLatLngRef.current.lat);
                const φ2 = toRad(latitude);
                const Δλ = toRad(longitude - lastGpsLatLngRef.current.lng);
                const y = Math.sin(Δλ) * Math.cos(φ2);
                const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
                trackBearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
              }
              if (trackBearing != null && !Number.isNaN(trackBearing)) {
                lastBearingRef.current = trackBearing;
              }

              // 显示观察者自身小船（带方向）
              if (!isAdmin) {
                const dir = lastBearingRef.current;
                console.debug('[OBS] my boat dir:', dir);
                const DIR_THRESHOLD = 2; // deg
                if (!myMarkerRef.current && mapRef.current) {
                  console.debug('[OBS] creating myMarker');
                  const displayDir = ((mapBearing - dir) % 360 + 360) % 360;
                  myMarkerRef.current = L.marker(latlng, {
                    icon: createHeadingIcon(),
                    rotationAngle: displayDir,
                    rotationOrigin: 'center center',
                    zIndexOffset: 500,
                  } as any).addTo(mapRef.current);
                  myDirRef.current = dir;
                } else if (myMarkerRef.current) {
                  // 只更新位置；方向变化显著时再旋转现有图标，减少闪烁
                  myMarkerRef.current.setLatLng(latlng);
                  if (Math.abs(dir - myDirRef.current) > DIR_THRESHOLD) {
                    const displayDir = ((mapBearing - dir) % 360 + 360) % 360;
                    (myMarkerRef.current as any).setRotationAngle(displayDir);
                    myDirRef.current = dir;
                  }
                }

                // 更新 GPS 信息面板（速度 & 方向）
                if (gpsHeading != null && !Number.isNaN(gpsHeading)) {
                  setGpsHeadingDeg(gpsHeading);
                }
                if (speed != null && !Number.isNaN(speed)) {
                  setGpsSpeedKts(speed * 1.94384); // m/s → knots
                }
                setGpsOk(true);
                lastGpsTsRef.current = Date.now();
                // 记录最后一次 GPS 信息供提示使用
                setLastGpsInfo({ lat: latlng.lat, lng: latlng.lng, ts: Date.now() });

                // 记录自身位置（管理员和观察者均适用）
                myPosRef.current = latlng;
              }

              // 管理员发布位置
              if (isAdmin) {
                console.debug('[ADMIN] processing position update, MQTT connected:', mqttClient?.connected);
                // 保存最新位置供定时器使用
                lastPosRef.current = latlng;

                // 如果 MQTT 已连接且距离上次发送超过 15s，则立即发送一次
                if (mqttClient?.connected && Date.now() - lastPublishRef.current > 15000) {
                  console.debug('[ADMIN] sending immediate publish, last publish was:', new Date(lastPublishRef.current));
                  const payload = {
                    id: 'ADMIN',
                    lat: latlng.lat,
                    lng: latlng.lng,
                    course: {
                      axis: Number(courseAxis),
                      distance_nm: Number(courseSizeNm),
                      start_line_m: Number(startLineLenM),
                    },
                    timestamp: Date.now(),
                  };
                  console.debug('[MQTT] immediate publish', posTopic(courseId), payload);
                  mqttClient.publish(posTopic(courseId), JSON.stringify(payload), { retain: true });
                  lastPublishRef.current = Date.now();
                }

                // 启动 15s 发布定时器（仅一次）
                if (mqttClient?.connected && !publishIntervalRef.current) {
                  console.debug('[ADMIN] starting 15s interval timer');
                  publishIntervalRef.current = setInterval(() => {
                    console.debug('[ADMIN] interval timer triggered, lastPos:', lastPosRef.current, 'MQTT connected:', mqttClient?.connected);
                    if (!lastPosRef.current || !mqttClient?.connected) return;
                    const p = lastPosRef.current;
                    const payload = {
                      id: 'ADMIN',
                      lat: p.lat,
                      lng: p.lng,
                      course: {
                        axis: Number(courseAxis),
                        distance_nm: Number(courseSizeNm),
                        start_line_m: Number(startLineLenM),
                      },
                      timestamp: Date.now(),
                    };
                    console.debug('[MQTT] publish', posTopic(courseId), payload);
                    mqttClient.publish(posTopic(courseId), JSON.stringify(payload), { retain: true });
                    lastPublishRef.current = Date.now();
                  }, 15000);
                }
              }

              // 若已有定位，则立即基于接收到的参数重绘
              if (lastPosRef.current) {
                drawCourse(lastPosRef.current);
              }

              // 在回调末尾维护 lastGpsLatLngRef
              lastGpsLatLngRef.current = latlng;
            },
            (err) => {
              console.error('geo error', err);
              console.debug('[GPS] error code:', err.code, 'message:', err.message);
              console.debug('[GPS] error details:', {
                code: err.code,
                message: err.message,
                PERMISSION_DENIED: 1,
                POSITION_UNAVAILABLE: 2,
                TIMEOUT: 3
              });
              setErrorMsg('无法获取定位权限');
              setGpsOk(false);
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
          );
          console.debug('[GPS] watchPosition started, id:', geoWatchIdRef.current);
        } else {
          console.warn('[GPS] geolocation not supported');
        }
      };

      client.on('connect', startGpsWatch);
      // 若已提前连接，立即调用一次
      if (client.connected) {
        console.debug('[Map] MQTT already connected, start GPS immediately');
        startGpsWatch();
      }

      const messageHandler = (t: string, payload: any) => {
        if (t === topic && !isAdmin) {
          try {
            console.debug('[MQTT] received', t, payload);
            const data = JSON.parse(payload.toString());
            if (typeof data.lat === 'number' && typeof data.lng === 'number') {
              const pos = L.latLng(data.lat, data.lng);
              lastPosRef.current = pos;
              boatMarkerRef.current?.setLatLng(pos);
              // 仅当管理员船位已离开视图边缘时再平移
              if (mapRef.current && !mapRef.current.getBounds().pad(-0.2).contains(pos)) {
                mapRef.current.panTo(pos);
              }
            }
            if (data.course) {
              console.debug('[MQTT] received course', data.course);
              const { axis, distance_nm, start_line_m } = data.course;

              const axisStr = Number(axis).toString();
              const distStr = Number(distance_nm).toString();
              const startStr = Number(start_line_m).toString();

              if (!Number.isNaN(Number(axisStr))) setAxis(Number(axisStr));
              if (!Number.isNaN(Number(distStr))) setDistanceNm(Number(distStr));
              if (!Number.isNaN(Number(startStr))) setStartLineM(Number(startStr));

              // 若已有定位，则立即基于接收到的参数重绘
              if (lastPosRef.current) {
                drawCourse(lastPosRef.current);
              }
            }
          } catch (e) {
            console.warn('Invalid MQTT payload', e);
          }
        }
      };
      client.on('message', messageHandler);

      return () => {
        client.off('connect', startGpsWatch);
        client.off('message', messageHandler);
        client.unsubscribe(topic);
        if (geoWatchIdRef.current != null) {
          console.debug('[GPS] clearing watch, id:', geoWatchIdRef.current);
          navigator.geolocation.clearWatch(geoWatchIdRef.current);
          geoWatchIdRef.current = null;
        }
        if (publishIntervalRef.current) {
          console.debug('[ADMIN] clearing interval timer');
          clearInterval(publishIntervalRef.current);
          publishIntervalRef.current = null;
        }
        if (myMarkerRef.current) {
          mapRef.current?.removeLayer(myMarkerRef.current);
          myMarkerRef.current = null;
        }
      };
    }, [courseId, isAdmin, courseAxis, courseSizeNm, startLineLenM, setAxis, setDistanceNm, setStartLineM]);

  // iOS 方向权限请求
  useEffect(() => {
    const requestOrientPermission = () => {
      const d = window.DeviceOrientationEvent as any;
      if (d && typeof d.requestPermission === 'function') {
        d.requestPermission().catch(() => {/* ignore */});
      }
      document.removeEventListener('click', requestOrientPermission);
    };
    document.addEventListener('click', requestOrientPermission);
    return () => document.removeEventListener('click', requestOrientPermission);
  }, []);

  // ---- course param local string -> store persist when admin edits ----
  useEffect(() => {
    if (!isAdmin) return;
    const a = Number(courseAxis);
    const d = Number(courseSizeNm);
    const s = Number(startLineLenM);
    if (!Number.isNaN(a)) setAxis(a);
    if (!Number.isNaN(d)) setDistanceNm(d);
    if (!Number.isNaN(s)) setStartLineM(s);
  }, [isAdmin, courseAxis, courseSizeNm, startLineLenM, setAxis, setDistanceNm, setStartLineM]);

  // 同步 state 到 map.setBearing（插件方法）
  useEffect(() => {
    if (mapRef.current && typeof (mapRef.current as any).setBearing === 'function') {
      (mapRef.current as any).setBearing(mapBearing, { animate: true });
    }
  }, [mapBearing]);

  // 当航线参数变动时重新绘制航线
  useEffect(() => {
    if (lastPosRef.current) {
      drawCourse(lastPosRef.current);
    }
  }, [courseAxis, courseSizeNm, startLineLenM]);

  // 在组件级别添加一个定时器，若 2.5s 未收到 GPS 数据则标红
  useEffect(() => {
    if (isAdmin) return;
    const id = setInterval(() => {
      if (Date.now() - lastGpsTsRef.current > 2500) {
        setGpsOk(false);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isAdmin]);

  // 添加 effect：当地图旋转时更新箭头方向
  // 当地图 bearing 变化，更新观察者箭头方向
  useEffect(() => {
    if (myMarkerRef.current && myDirRef.current != null) {
      const displayDir = ((mapBearing - myDirRef.current) % 360 + 360) % 360;
      (myMarkerRef.current as any).setRotationAngle(displayDir);
    }
  }, [mapBearing]);

  return (
    <div className="relative w-screen h-screen-safe">
      {/* 实际地图容器 */}
      <div id="map-root" style={{ height: '100%', width: '100%' }} />

      {/* 顶部导航栏 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: '#1f7c8c',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          color: '#fff',
          gap: 12,
          zIndex: 1000,
        }}
      >
        <button
          onClick={() => window.history.back()}
          style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 24 }}
        >
          ←
        </button>
        <div style={{ fontWeight: 'bold', fontSize: 18 }}>{courseId}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>👤</span>1
        </div>
      </div>

      {/* GPS 信息面板（观察者） */}
      {!isAdmin && (
        <div
          style={{
            position: 'absolute',
            top: 64,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 12,
            padding: '8px 12px',
            textAlign: 'center',
            zIndex: 1100,
            minWidth: 100,
            lineHeight: 1.2,
            cursor: 'pointer',
          }}
          onClick={() => setGpsTipVisible((v) => !v)}
        >
          <div style={{ fontSize: 22, fontWeight: 'bold' }}>
            {gpsSpeedKts != null ? gpsSpeedKts.toFixed(1) : '--'}<span style={{ fontSize: 14 }}> kt</span>
          </div>
          <div style={{ fontSize: 12 }}>
            {gpsHeadingDeg != null ? Math.round(gpsHeadingDeg) + '°' : '--'}
          </div>
          {/* GPS 状态指示点 */}
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: gpsOk ? '#28a745' : '#dc3545',
            }}
          />
          {gpsTipVisible && lastGpsInfo && (
            <div
              style={{
                marginTop: 6,
                fontSize: 10,
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
              }}
            >
              {new Date(lastGpsInfo.ts).toLocaleTimeString()}<br />
              {lastGpsInfo.lat.toFixed(5)}, {lastGpsInfo.lng.toFixed(5)}
            </div>
          )}
        </div>
      )}

      {/* 侧边工具栏 */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          right: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          zIndex: 1000,
        }}
      >
        <button
          style={toolBtnStyle}
          title="定位到当前位置 (手动获取)"
          onClick={() => {
            // 手动触发一次 geolocation 获取，兼容息屏后 watch 被暂停的情况
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  console.debug('[GPS] manual fetch', pos.coords);
                  const { latitude, longitude, heading: gpsHeading } = pos.coords as GeolocationCoordinates & { heading: number };
                  const latlng = L.latLng(latitude, longitude);

                  // 地图定位
                  if (mapRef.current) {
                    mapRef.current.setView(latlng, 15);
                  }

                  // 计算航迹方向同样逻辑
                  let manualBearing: number | null = null;
                  if (gpsHeading != null && !Number.isNaN(gpsHeading)) {
                    manualBearing = gpsHeading;
                  } else if (lastGpsLatLngRef.current) {
                    const toRad = (d:number)=>d*Math.PI/180;
                    const toDeg = (r:number)=>r*180/Math.PI;
                    const φ1 = toRad(lastGpsLatLngRef.current.lat);
                    const φ2 = toRad(latitude);
                    const Δλ = toRad(longitude - lastGpsLatLngRef.current.lng);
                    const y = Math.sin(Δλ) * Math.cos(φ2);
                    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
                    manualBearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
                  }
                  if (manualBearing != null && !Number.isNaN(manualBearing)) {
                    lastBearingRef.current = manualBearing;
                  }
                  const dir = lastBearingRef.current;

                  // 更新观察者自己的标记
                  if (!isAdmin) {
                    if (!myMarkerRef.current && mapRef.current) {
                      const displayDir = ((mapBearing - dir) % 360 + 360) % 360;
                      myMarkerRef.current = L.marker(latlng, {
                        icon: createHeadingIcon(),
                        rotationAngle: displayDir,
                        rotationOrigin: 'center center',
                        zIndexOffset: 500,
                      } as any).addTo(mapRef.current);
                      myDirRef.current = dir;
                    } else if (myMarkerRef.current) {
                      myMarkerRef.current.setLatLng(latlng);
                      if (Math.abs(dir - myDirRef.current) > 2) {
                        const displayDir = ((mapBearing - dir) % 360 + 360) % 360;
                        (myMarkerRef.current as any).setRotationAngle(displayDir);
                        myDirRef.current = dir;
                      }
                    }

                    // 更新 GPS 状态指示
                    setGpsOk(true);
                    lastGpsTsRef.current = Date.now();
                    setLastGpsInfo({ lat: latlng.lat, lng: latlng.lng, ts: Date.now() });
                  }

                  // 管理员：同步船位并立即发布
                  if (isAdmin) {
                    lastPosRef.current = latlng;
                    boatMarkerRef.current?.setLatLng(latlng);
                    if (!routeLineRef.current) drawCourse(latlng);

                    if (mqttClient?.connected) {
                      const payload = {
                        id: 'ADMIN',
                        lat: latlng.lat,
                        lng: latlng.lng,
                        course: {
                          axis: Number(courseAxis),
                          distance_nm: Number(courseSizeNm),
                          start_line_m: Number(startLineLenM),
                        },
                        timestamp: Date.now(),
                      };
                      console.debug('[MQTT] manual publish', posTopic(courseId), payload);
                      mqttClient.publish(posTopic(courseId), JSON.stringify(payload), { retain: true });
                      lastPublishRef.current = Date.now();
                    }
                  }

                  // 在 manual fetch 回调末尾更新 lastGpsLatLngRef
                  lastGpsLatLngRef.current = latlng;
                },
                (err) => {
                  console.error('[GPS] manual geo error', err);
                  setErrorMsg('无法获取定位权限');
                },
                { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
              );
            }
          }}
        >
          🚤
        </button>
        <button style={toolBtnStyle}>🗺️</button>
        {isAdmin && (
          <button
            style={toolBtnStyle}
            onClick={() => setSettingsVisible(true)}
          >
            ⚙️
          </button>
        )}
      </div>

      {/* 指南针按钮：点击切换 北朝上 / 航线朝上 */}
      <button
        style={{
          position: 'absolute',
          top: 68,
          left: 12,
          width: 48,
          height: 48,
          borderRadius: 12,
          border: 'none',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          cursor: 'pointer',
        }}
        onClick={() => {
          if (!mapRef.current) return;
          const axisNum = Number(courseAxis) || 0;
          setMapBearing((prev) => (Math.abs(prev) < 1e-2 ? -axisNum : 0));
        }}
      >
        <div
          style={{
            transform: `rotate(${mapBearing}deg)`,
            transition: 'transform 0.3s',
            fontSize: 24,
          }}
        >
          {/* Compass SVG: outer circle静态，内部箭头随 heading 旋转 */}
          <svg width="32" height="32" viewBox="0 0 100 100" style={{ display: 'block' }}>
            {/* 外圈 */}
            <circle cx="50" cy="50" r="45" stroke="#333" strokeWidth="6" fill="#fff" />
            {/* 指针分组 */}
            <g>
              <polygon points="50,18 60,55 50,46 40,55" fill="#ff4500" stroke="#333" strokeWidth="2" />
            </g>
          </svg>
        </div>
      </button>

      {/* 底部信息牌 */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 12,
          zIndex: 1000,
        }}
      >
        <InfoCard title="COURSE AXIS" value={`${courseAxisNum}°M`} />
        <InfoCard title="COURSE SIZE" value={`${courseSizeNmNum}NM`} />
      </div>

      {/* 设置对话框 */}
      {isAdmin && settingsVisible && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 2000,
          }}
          onClick={() => setSettingsVisible(false)}
        >
          {/* 阻止冒泡 */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#fff',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              maxHeight: '75vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>
              航线设置
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
              角度 (°M)
              <input
                type="number"
                value={courseAxis}
                onChange={(e) => setCourseAxis(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 16,
                  border: '1px solid #ccc',
                  borderRadius: 8,
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
              距离 (NM)
              <input
                type="number"
                value={courseSizeNm}
                step="0.1"
                onChange={(e) => setCourseSizeNm(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 16,
                  border: '1px solid #ccc',
                  borderRadius: 8,
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
              起航线长度 (m)
              <input
                type="number"
                value={startLineLenM}
                onChange={(e) => setStartLineLenM(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 16,
                  border: '1px solid #ccc',
                  borderRadius: 8,
                }}
              />
            </label>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setSettingsVisible(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#eee',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 16,
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  setSettingsVisible(false);
                  if (lastPosRef.current) drawCourse(lastPosRef.current);
                  // 立即发布最新航线设置
                  if (isAdmin && mqttClient?.connected) {
                    const p = lastPosRef.current ?? L.latLng(0, 0);
                    const payload = {
                      id: 'ADMIN',
                      lat: p.lat,
                      lng: p.lng,
                      course: {
                        axis: Number(courseAxis),
                        distance_nm: Number(courseSizeNm),
                        start_line_m: Number(startLineLenM),
                      },
                      timestamp: Date.now(),
                    };
                    console.debug('[MQTT] publish course update', posTopic(courseId), payload);
                    mqttClient.publish(posTopic(courseId), JSON.stringify(payload), { retain: true });
                  }
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#ff7f0e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 16,
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

        {/* 错误提示条 */}
        {errorMsg && (
          <div
            style={{
              position: 'absolute',
              top: 56,
              left: 0,
              right: 0,
              background: 'rgba(200,0,0,0.9)',
              color: '#fff',
              padding: '6px 12px',
              textAlign: 'center',
              zIndex: 1200,
            }}
          >
            {errorMsg}
          </div>
        )}
    </div>
  );
  } catch (err) {
    console.error('[Map] render error:', err);
    return <div>Error loading map</div>;
  }
}

const toolBtnStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 12,
  border: 'none',
  background: '#fff',
  fontSize: 24,
  cursor: 'pointer',
  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
};

export default MapView; 