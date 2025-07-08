import { useEffect, useRef, useState } from 'react';
import { useMqttClient } from '@features/mqtt/hooks';

export interface ObserverPos {
  id: string;
  lat: number;
  lng: number;
  heading: number | null;
  ts: number;
}

/**
 * 订阅 race/{id}/location/#，维护最近 60s 内活跃的观察者位置列表。
 */
export function useObserversPos(raceId: string) {
  const client = useMqttClient();
  const [observers, setObservers] = useState<Record<string, ObserverPos>>({});
  const observersRef = useRef(observers);
  observersRef.current = observers;

  useEffect(() => {
    if (!client) return;
    const topicFilter = `race/${raceId}/location/#`;

    const onMsg = (t: string, payload: Uint8Array, packet: any) => {
      if (!t.startsWith(`race/${raceId}/location/observer/`)) return; // 排除 admin
      const id = t.split('/').at(-1)!;
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (typeof data.lat !== 'number' || typeof data.lng !== 'number') return;
        setObservers(prev => ({
          ...prev,
          [id]: {
            id,
            lat: data.lat,
            lng: data.lng,
            heading: data.heading ?? null,
            ts: data.ts ?? Date.now(),
          },
        }));
      } catch {
        /* ignore */
      }
    };

    client.subscribe(topicFilter, { qos: 0 });
    client.on('message', onMsg);
    return () => {
      client.unsubscribe(topicFilter);
      client.off('message', onMsg);
    };
  }, [client, raceId]);

  // 每秒清理离线
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setObservers(prev => {
        const next: Record<string, ObserverPos> = {};
        Object.values(prev).forEach(o => {
          if (now - o.ts < 60_000) next[o.id] = o;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return Object.values(observersRef.current);
} 