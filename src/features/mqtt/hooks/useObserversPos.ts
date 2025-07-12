import { useEffect, useRef, useState } from 'react';
import { useMqttClient } from '../hooks';

export interface ObserverPos {
  id: string;
  lat: number;
  lng: number;
  heading: number | null;
  ts: number;
}

interface Options {
  raceId: string;
  observerId?: string; // 如果提供observerId，会过滤掉自己的消息
}

/**
 * 订阅所有观察者位置消息
 * 如果提供observerId，会过滤掉自己的消息
 * 维护最近60s内活跃的观察者位置列表
 */
export function useObserversPos({ raceId, observerId }: Options) {
  const client = useMqttClient();
  const [observers, setObservers] = useState<Record<string, ObserverPos>>({});
  const observersRef = useRef(observers);

  // 确保 observersRef.current 始终是最新的
  observersRef.current = observers;

  useEffect(() => {
    if (!client) return;

    const topicFilter = `race/${raceId}/location/#`;

    const onMsg = (topic: string, payload: Uint8Array) => {
      if (!topic.startsWith(`race/${raceId}/location/observer/`)) {
        return; // 排除 admin 和其他非观察者消息
      }

      const id = topic.split('/').at(-1)!;

      // 如果是自己的消息，跳过
      if (observerId && id === observerId) {
        return;
      }

      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        
        if (typeof data.lat !== 'number' || typeof data.lng !== 'number') {
          return;
        }

        const now = Date.now();
        const newObserver: ObserverPos = {
          id,
          lat: data.lat,
          lng: data.lng,
          heading: data.heading ?? null,
          ts: data.ts ?? now,
        };

        setObservers(prev => {
          // 清理超过60s的观察者
          const cleaned: Record<string, ObserverPos> = {};
          Object.values(prev).forEach(o => {
            if (now - o.ts < 60_000) {
              cleaned[o.id] = o;
            }
          });

          // 添加/更新当前观察者
          cleaned[id] = newObserver;

          return cleaned;
        });
      } catch (e) {
        console.error('[useObserversPos] Error parsing payload:', e);
      }
    };

    client.subscribe(topicFilter, { qos: 0 });
    client.on('message', onMsg);

    return () => {
      client.unsubscribe(topicFilter);
      client.off('message', onMsg);
    };
  }, [client, raceId, observerId]);

  const result = Object.values(observers);
  return result;
} 