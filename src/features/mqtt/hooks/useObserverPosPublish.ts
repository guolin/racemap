import { useEffect, useRef } from 'react';
import { publishObserverPos } from '../service';

interface ObserverPosition {
  lat: number;
  lng: number;
  heading?: number | null;
}

interface Options {
  raceId: string;
  observerId: string;
  getLatestPos: () => ObserverPosition | null;
}

/**
 * 发布观察者位置到MQTT
 * 添加位置去重逻辑，如果位置没有变化就不发送
 */
export function useObserverPosPublish({ raceId, observerId, getLatestPos }: Options) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentPosRef = useRef<ObserverPosition | null>(null);

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
    // 发布函数
    const tick = () => {
      const pos = getLatestPos();
      if (pos && pos.lat && pos.lng) {
        const lastSent = lastSentPosRef.current;
        if (lastSent && isSamePosition(pos, lastSent)) {
          // 位置相同，不发送
          return;
        }

        // 位置不同，发送并更新记录
        publishObserverPos(raceId, observerId, pos);
        lastSentPosRef.current = { ...pos };
      }
    };

    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [raceId, observerId, getLatestPos]);

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
} 