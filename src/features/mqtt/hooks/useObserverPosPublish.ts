import { useEffect, useRef } from 'react';
import { publishObserverPos, ObserverPosition } from '@features/mqtt/service';
import { getMqttClient } from '@features/mqtt/service';

interface Options {
  raceId: string;
  observerId: string;
  /** 获取最新经纬度以及航向；缺失 lat/lng 时不会发布 */
  getLatestPos: () => ObserverPosition | null;
}

/**
 * 观察者端：每 1 秒发布一次坐标到 MQTT；在页面关闭前发送空消息清理 retained。
 */
export function useObserverPosPublish({ raceId, observerId, getLatestPos }: Options) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 发布函数
    const tick = () => {
      const pos = getLatestPos();
      if (!pos || !pos.lat || !pos.lng) return;
      publishObserverPos(raceId, observerId, pos);
    };

    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [raceId, observerId, getLatestPos]);

  // 清理 retained：页面卸载时发布空 retained 消息
  useEffect(() => {
    const handleBeforeUnload = () => {
      const topic = `race/${raceId}/location/observer/${observerId}`;
      const client = getMqttClient();
      client.publish(topic, '', { qos: 0, retain: true });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [raceId, observerId]);
} 