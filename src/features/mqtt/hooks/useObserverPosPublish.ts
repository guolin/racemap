import { useEffect, useRef, useState } from 'react';
import { publishObserverPos } from '../service';

interface ObserverPosition {
  lat: number;
  lng: number;
  heading?: number | null;
}

interface Options {
  raceId: string;
  observerId: string;
  enabled?: boolean;
  getLatestPos: () => ObserverPosition | null;
}

/**
 * 发布观察者位置到MQTT（使用新的统一presence系统）
 * 添加位置去重逻辑，如果位置没有变化就不发送
 */
export function useObserverPosPublish({ raceId, observerId, enabled = true, getLatestPos }: Options) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentPosRef = useRef<ObserverPosition | null>(null);
  const lastSentTimeRef = useRef<number>(0);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);

  // 检查两个位置是否相同
  const isSamePosition = (pos1: ObserverPosition, pos2: ObserverPosition): boolean => {
    const latDiff = Math.abs(pos1.lat - pos2.lat);
    const lngDiff = Math.abs(pos1.lng - pos2.lng);
    const headingDiff = Math.abs((pos1.heading ?? 0) - (pos2.heading ?? 0));

    // 位置精度：约1米（纬度1度约111km，所以0.00001度约1米）
    const POSITION_THRESHOLD = 0.00001;
    // 航向精度：1度
    const HEADING_THRESHOLD = 1;

    return latDiff < POSITION_THRESHOLD &&
           lngDiff < POSITION_THRESHOLD &&
           headingDiff < HEADING_THRESHOLD;
  };

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    if (!enabled) {
      clearTimer();
      lastSentPosRef.current = null;
      lastSentTimeRef.current = 0;
      setLastSentAt(null);
      return clearTimer;
    }

    const HEARTBEAT_INTERVAL_MS = 25_000;

    const tick = () => {
      const pos = getLatestPos();
      if (!pos) return;

      const { lat, lng, heading } = pos;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const lastSent = lastSentPosRef.current;
      const now = Date.now();
      const heartbeatDue = now - lastSentTimeRef.current >= HEARTBEAT_INTERVAL_MS;
      const moved = !lastSent || !isSamePosition({ lat, lng, heading }, lastSent);

      if (!moved && !heartbeatDue) return;

      const normalizedHeading = typeof heading === 'number' && Number.isFinite(heading) ? heading : null;

      const published = publishObserverPos(raceId, observerId, {
        lat,
        lng,
        heading: normalizedHeading ?? undefined,
      });

      if (published) {
        lastSentPosRef.current = { lat, lng, heading: normalizedHeading };
        lastSentTimeRef.current = now;
        setLastSentAt(now);
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1_000);

    return clearTimer;
  }, [raceId, observerId, enabled, getLatestPos]);

  // 页面关闭时发送空消息清理retained消息
  useEffect(() => {
    const handleBeforeUnload = () => {
      publishObserverPos(raceId, observerId, { lat: 0, lng: 0 });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [raceId, observerId]);

  return lastSentAt;
} 
