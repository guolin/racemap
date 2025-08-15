'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import TopBar from '../../src/features/map/components/TopBar';
import { watchPositionThrottled, clearWatch as clearGeoWatch } from '../../utils/geoThrottle';

interface LogEntry {
  timestamp: number;
  lat: number;
  lng: number;
  speedKts: number | null;
  headingDeg: number | null;
  sourceHeading: 'gps' | 'device';
}

// 将 m/s 转换为节
const msToKts = (v: number) => v * 1.94384;

export default function GpsDebugPage() {
  // 所有日志条目
  const [logs, setLogs] = useState<LogEntry[]>([]);
  // 来自设备方向事件的备选航向
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  // 错误信息
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorLogs, setErrorLogs] = useState<string[]>([]);

  // 防抖相关引用
  const lastHdgRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  // 记录 geolocation watch id
  const geoWatchIdRef = useRef<number | null>(null);

  // 是否正在追踪
  const [tracking, setTracking] = useState<boolean>(false);

  // 在状态声明区下方新增引用
  const lastCbTsRef = useRef<number>(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 用户点击后启动追踪
  const handleToggleTracking = () => {
    if (!tracking) {
      // 针对 iOS 主动请求方向权限
      const d = window.DeviceOrientationEvent as any;
      if (d && typeof d.requestPermission === 'function') {
        d.requestPermission().catch(() => {/* ignore */});
      }
    }
    setTracking((prev) => !prev);
  };

  useEffect(() => {
    // 方向事件处理，与 Map 组件一致
    const orientationHandler = (ev: DeviceOrientationEvent) => {
      const raw = (ev as any).webkitCompassHeading != null
        ? (ev as any).webkitCompassHeading
        : 360 - (ev.alpha || 0);
      if (Number.isNaN(raw)) return;
      const now = Date.now();
      if (Math.abs(raw - lastHdgRef.current) > 2 && now - lastUpdateRef.current > 120) {
        lastHdgRef.current = raw;
        lastUpdateRef.current = now;
        setDeviceHeading(raw);
      }
    };

    window.addEventListener('deviceorientationabsolute', orientationHandler, true);
    window.addEventListener('deviceorientation', orientationHandler, true);

    return () => {
      window.removeEventListener('deviceorientationabsolute', orientationHandler, true);
      window.removeEventListener('deviceorientation', orientationHandler, true);
    };
  }, []);

  useEffect(() => {
    if (!tracking) return; // 未开始追踪，不执行

    if (!navigator.geolocation) {
      setErrorMsg('浏览器不支持 Geolocation');
      return;
    }

    const options = { enableHighAccuracy: true, maximumAge: 0, timeout: 2000 } as PositionOptions;

    const startWatch = () => {
      geoWatchIdRef.current = watchPositionThrottled(
        (pos) => {
          const { latitude, longitude, speed, heading } = pos.coords as GeolocationCoordinates & { heading: number };
          const ts = Date.now();
          const finalHeading = heading != null && !Number.isNaN(heading) ? heading : deviceHeading;
          const entry: LogEntry = {
            timestamp: ts,
            lat: latitude,
            lng: longitude,
            speedKts: speed != null && !Number.isNaN(speed) ? msToKts(speed) : null,
            headingDeg: finalHeading != null && !Number.isNaN(finalHeading) ? finalHeading : null,
            sourceHeading: heading != null && !Number.isNaN(heading) ? 'gps' : 'device',
          };

          // 使用函数式更新，保持最多 200 条
          setLogs((prev) => {
            const next = [...prev, entry];
            return next.length > 200 ? next.slice(next.length - 200) : next;
          });
          lastCbTsRef.current = ts;
        },
        (err) => {
          console.error('[GPS] error', err);
          const msg = `[watch][${err.code}] ${err.message}`;
          setErrorMsg(msg);
          setErrorLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);

          // TIMEOUT 自动重试
          if (err.code === 3 && tracking) {
            if (geoWatchIdRef.current != null) {
              clearGeoWatch(geoWatchIdRef.current as number);
              geoWatchIdRef.current = null;
            }
            // 立即重启 watch
            startWatch();
          }
        },
        { ...options, throttleTime: 1000 }
      );
    };

    startWatch();

    return () => {
      if (geoWatchIdRef.current != null) {
        clearGeoWatch(geoWatchIdRef.current as number);
        geoWatchIdRef.current = null;
      }
    };
  }, [deviceHeading, tracking]);

  // iOS 方向权限请求 (点击触发)
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

  // 单次获取当前位置
  const fetchOnce = useCallback(() => {
    if (!navigator.geolocation) {
      const msg = '浏览器不支持 Geolocation';
      setErrorMsg(msg);
      setErrorLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords as GeolocationCoordinates & { heading: number };
        const ts = Date.now();
        const finalHeading = heading != null && !Number.isNaN(heading) ? heading : deviceHeading;
        const entry: LogEntry = {
          timestamp: ts,
          lat: latitude,
          lng: longitude,
          speedKts: speed != null && !Number.isNaN(speed) ? msToKts(speed) : null,
          headingDeg: finalHeading != null && !Number.isNaN(finalHeading) ? finalHeading : null,
          sourceHeading: heading != null && !Number.isNaN(heading) ? 'gps' : 'device',
        };
        setLogs((prev) => [...prev, entry]);
      },
      (err) => {
        const msg = `[单次][${err.code}] ${err.message}`;
        setErrorMsg(msg);
        setErrorLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [deviceHeading]);

  // ---- 轮询定时器：若 1.2s 未收到 watch 回调则主动 getCurrentPosition ----
  useEffect(() => {
    if (!tracking) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    pollIntervalRef.current = setInterval(() => {
      if (Date.now() - lastCbTsRef.current > 1200) {
        fetchOnce();
      }
    }, 1000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [tracking, fetchOnce]);

  return (
    <>
      <TopBar center="GPS 调试" />
      <div style={{ padding: 16, marginTop: 56 }}>
        <h1 style={{ marginBottom: 12 }}>GPS 调试 /logs</h1>

        {errorMsg && (
          <div style={{ color: '#c00', marginBottom: 12 }}>{errorMsg}</div>
        )}

        {/* 开始/停止按钮 */}
        <button
          onClick={handleToggleTracking}
          style={{
            padding: '8px 16px',
            marginBottom: 12,
            border: 'none',
            borderRadius: 8,
            background: tracking ? '#dc3545' : '#28a745',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {tracking ? '停止定位' : '开始定位'}
        </button>

        {/* 单次重新获取按钮 */}
        <button
          onClick={fetchOnce}
          style={{
            padding: '8px 16px',
            marginBottom: 12,
            marginLeft: 12,
            border: 'none',
            borderRadius: 8,
            background: '#0078ff',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          重新获取
        </button>

        {/* 当前最新数据 */}
        {logs.length > 0 && (() => {
          const latest = logs[logs.length - 1]!;
          return (
            <div style={{ marginBottom: 16 }}>
              <strong>最新：</strong>
              {new Date(latest.timestamp).toLocaleTimeString()} |{' '}
              {latest.lat.toFixed(5)}, {latest.lng.toFixed(5)} |{' '}
              {latest.speedKts != null ? latest.speedKts.toFixed(1) + ' kt' : '--'} |{' '}
              {latest.headingDeg != null ? Math.round(latest.headingDeg) + '° (' + latest.sourceHeading + ')' : '--'}
            </div>
          );
        })()}

        {/* 日志列表 */}
        <div
          style={{
            maxHeight: '70vh',
            overflowY: 'auto',
            border: '1px solid #ddd',
            borderRadius: 4,
            fontFamily: 'monospace',
            padding: 8,
            lineHeight: 1.4,
            fontSize: 12,
          }}
        >
          {logs.map((l, idx) => (
            <div key={idx}>
              {new Date(l.timestamp).toLocaleTimeString('en-US', { hour12: false })} | {l.lat.toFixed(6)},{' '}
              {l.lng.toFixed(6)} | {l.speedKts != null ? l.speedKts.toFixed(2) + 'kt' : '--'} |{' '}
              {l.headingDeg != null ? Math.round(l.headingDeg) + '° (' + l.sourceHeading + ')' : '--'}
            </div>
          ))}
        </div>

        {/* 错误列表 */}
        {errorLogs.length > 0 && (
          <div
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              border: '1px solid #f99',
              borderRadius: 4,
              background: '#fff4f4',
              padding: 8,
              marginTop: 12,
              fontSize: 12,
            }}
          >
            {errorLogs.map((e, idx) => (
              <div key={idx} style={{ color: '#c00' }}>{e}</div>
            ))}
          </div>
        )}
      </div>
    </>
  );
} 