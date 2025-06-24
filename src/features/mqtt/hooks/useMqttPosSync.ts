import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { getMqttClient } from '@features/mqtt/service';

interface Options {
  courseId: string;
  isAdmin: boolean;
  /** 最新信号船位置，用于管理员发布 */
  getLatestPos: () => L.LatLng | null;
  /** 航线参数字符串，用于发布：axis, distance_nm, start_line_m */
  getCourseParams: () => { axis: string; distance_nm: string; start_line_m: string };
  /** 收到管理员位置后回调（观察者端） */
  onRecvPos?: (pos: L.LatLng) => void;
  /** 收到航线参数后回调 */
  onRecvCourse?: (p: { axis: number; distance_nm: number; start_line_m: number }) => void;
}

const posTopic = (id: string) => `sailing/${id}/pos`;

/**
 * 封装 MQTT 连接 / 船位订阅 / 管理员定时发布。
 * - 管理员：每 15s retain 发布一次位置 + 航线参数
 * - 观察者：订阅管理员位置，回调 onRecvPos & onRecvCourse
 */
export function useMqttPosSync({ courseId, isAdmin, getLatestPos, getCourseParams, onRecvPos, onRecvCourse }: Options) {
  const clientRef = useRef(getMqttClient());
  const publishTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPublishRef = useRef(0);

  useEffect(() => {
    const client = clientRef.current;
    const topic = posTopic(courseId);

    if (!isAdmin) {
      // 观察者订阅位置
      const handler = (t: string, payload: Uint8Array) => {
        if (t !== topic) return;
        try {
          const data = JSON.parse(new TextDecoder().decode(payload));
          if (data.lat && data.lng) onRecvPos?.(L.latLng(data.lat, data.lng));
          if (data.course) onRecvCourse?.(data.course);
        } catch (e) {
          console.warn('Invalid MQTT payload', e);
        }
      };
      client.subscribe(topic, { qos: 0 });
      client.on('message', handler);
      return () => {
        client.off('message', handler);
        client.unsubscribe(topic);
      };
    } else {
      // 管理员发布定时器
      const tryPublish = () => {
        if (!client.connected) return;
        const pos = getLatestPos();
        if (!pos) return;
        const { axis, distance_nm, start_line_m } = getCourseParams();
        const payload = {
          id: 'ADMIN',
          lat: pos.lat,
          lng: pos.lng,
          course: { axis: Number(axis), distance_nm: Number(distance_nm), start_line_m: Number(start_line_m) },
          timestamp: Date.now(),
        };
        client.publish(topic, JSON.stringify(payload), { retain: true });
        lastPublishRef.current = Date.now();
      };

      // 连接成功立即发布，并开启 15s 轮询
      const onConnect = () => {
        tryPublish();
        if (!publishTimerRef.current) publishTimerRef.current = setInterval(tryPublish, 15000);
      };
      client.on('connect', onConnect);
      if (client.connected) onConnect();

      return () => {
        client.off('connect', onConnect);
        if (publishTimerRef.current) {
          clearInterval(publishTimerRef.current);
          publishTimerRef.current = null;
        }
      };
    }
  }, [courseId, isAdmin, getLatestPos, getCourseParams, onRecvPos, onRecvCourse]);
} 