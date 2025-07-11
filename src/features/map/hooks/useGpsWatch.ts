import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

export interface GpsState {
  latLng: L.LatLng | null;
  speedKts: number | null;
  headingDeg: number | null; // 航迹方向（优先 GPS heading，其次自行计算）
  ok: boolean; // 最近 2.5s 是否收到定位
  errorMsg: string | null;
}

interface Options {
  /** 观察者模式：若 true 只做展示；管理员端逻辑请自行处理 */
  observerOnly?: boolean;
  /** 自定义 throttle 时间 (ms)，默认 1000 */
  throttleTime?: number;
  /** 回调：每次收到定位 */
  onUpdate?: (s: GpsState) => void;
}

/**
 * 简易 GPS watch hook，封装 navigator.geolocation.watchPosition
 * - 按 throttleTime (默认 1s) 进行节流
 * - 计算航迹方向：优先使用浏览器 heading，其次上一次坐标计算
 */
export function useGpsWatch({ observerOnly = false, throttleTime = 1000, onUpdate }: Options = {}): GpsState {
  const [state, setState] = useState<GpsState>({ latLng: null, speedKts: null, headingDeg: null, ok: false, errorMsg: null });

  const lastLatLngRef = useRef<L.LatLng | null>(null);
  const lastCbTsRef = useRef(0);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, errorMsg: '浏览器不支持 Geolocation' }));
      return;
    }

    const handler = (pos: GeolocationPosition) => {
      const { latitude, longitude, heading, speed } = pos.coords as GeolocationCoordinates & { heading: number };
      const latlng = L.latLng(latitude, longitude);
      let trackBearing: number | null = null;
      if (heading != null && !Number.isNaN(heading)) {
        trackBearing = heading;
      } else if (lastLatLngRef.current) {
        // 计算两点方位角
        const toRad = (d: number) => (d * Math.PI) / 180;
        const toDeg = (r: number) => (r * 180) / Math.PI;
        const φ1 = toRad(lastLatLngRef.current.lat);
        const φ2 = toRad(latitude);
        const Δλ = toRad(longitude - lastLatLngRef.current.lng);
        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        trackBearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
      }

      const newState: GpsState = {
        latLng: latlng,
        speedKts: speed != null && !Number.isNaN(speed) ? speed * 1.94384 : null,
        headingDeg: trackBearing,
        ok: true,
        errorMsg: null,
      };
      setState(newState);
      onUpdate?.(newState);
      lastLatLngRef.current = latlng;
      lastCbTsRef.current = Date.now();
    };

    const errorHandler = (err: GeolocationPositionError) => {
      setState((s) => ({ ...s, ok: false, errorMsg: `[GPS][${err.code}] ${err.message}` }));
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handler, errorHandler, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    });

    // 轮询检查最近回调
    timerRef.current = setInterval(() => {
      if (Date.now() - lastCbTsRef.current > 2500) {
        setState((s) => ({ ...s, ok: false }));
      }
    }, 1000);

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [observerOnly, throttleTime, onUpdate]);

  return state;
} 