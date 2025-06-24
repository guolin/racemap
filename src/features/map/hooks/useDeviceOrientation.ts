import { useEffect, useRef, useState } from 'react';

/**
 * 监听设备方向，返回磁航向（0~360，正北=0，顺时针递增）。
 * 内部做 2° / 120ms 抖动过滤。
 */
export function useDeviceOrientation(): number | null {
  const [heading, setHeading] = useState<number | null>(null);
  const lastHdgRef = useRef(0);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const handler = (ev: DeviceOrientationEvent) => {
      // Safari/iOS 提供 webkitCompassHeading，其他浏览器用 alpha
      const raw = (ev as any).webkitCompassHeading != null ? (ev as any).webkitCompassHeading : 360 - (ev.alpha || 0);
      if (Number.isNaN(raw)) return;
      const now = Date.now();
      if (Math.abs(raw - lastHdgRef.current) > 2 && now - lastUpdateRef.current > 120) {
        lastHdgRef.current = raw;
        lastUpdateRef.current = now;
        setHeading(raw);
      }
    };

    window.addEventListener('deviceorientationabsolute', handler, true);
    window.addEventListener('deviceorientation', handler, true);

    return () => {
      window.removeEventListener('deviceorientationabsolute', handler, true);
      window.removeEventListener('deviceorientation', handler, true);
    };
  }, []);

  return heading;
} 