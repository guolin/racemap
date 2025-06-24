import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMqttClient } from '@features/mqtt/hooks';

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
 * - 管理员：每 30s retain 发布一次位置 + 航线参数
 * - 观察者：订阅管理员位置，回调 onRecvPos & onRecvCourse
 */
export function useMqttPosSync({ courseId, isAdmin, getLatestPos, getCourseParams, onRecvPos, onRecvCourse }: Options) {
  const client = useMqttClient();
  const publishTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPayloadRef = useRef<string | null>(null);
  const getLatestPosRef = useRef(getLatestPos);
  const getCourseParamsRef = useRef(getCourseParams);
  const onRecvPosRef = useRef(onRecvPos);
  const onRecvCourseRef = useRef(onRecvCourse);

  getLatestPosRef.current = getLatestPos;
  getCourseParamsRef.current = getCourseParams;
  onRecvPosRef.current = onRecvPos;
  onRecvCourseRef.current = onRecvCourse;

  useEffect(() => {
    if (!client) return;  // 等待客户端就绪
    
    const topic = posTopic(courseId);
    console.debug('[MQTT] Setting up pos sync for course:', courseId, 'isAdmin:', isAdmin);

    if (!isAdmin) {
      // 观察者订阅位置
      const handler = (t: string, payload: Uint8Array) => {
        if (t !== topic) return;
        try {
          const data = JSON.parse(new TextDecoder().decode(payload));
          if (data.lat && data.lng) onRecvPosRef.current?.(L.latLng(data.lat, data.lng));
          if (data.course) onRecvCourseRef.current?.(data.course);
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
    }

    // 管理员发布定时器
    const tryPublish = () => {
      if (!client.connected) {
        console.debug('[MQTT] Skip publishing, client not connected');
        return;
      }
      const pos = getLatestPosRef.current();
      if (!pos) {
        console.debug('[MQTT] Skip publishing, no position available');
        return;
      }
      const { axis, distance_nm, start_line_m } = getCourseParamsRef.current();
      const common = {
        id: 'ADMIN',
        lat: pos.lat,
        lng: pos.lng,
        course: { axis: Number(axis), distance_nm: Number(distance_nm), start_line_m: Number(start_line_m) },
      };
      const dedupKey = JSON.stringify(common);

      // 去重：如果位置 / 航线参数均未变化，则不再发送
      if (dedupKey === lastPayloadRef.current) {
        console.debug('[MQTT] Skip publishing, no changes');
        return;
      }

      try {
        const payloadStr = JSON.stringify({ ...common, timestamp: Date.now() });
        client.publish(topic, payloadStr, { retain: true, qos: 1 }, (err) => {
          if (err) {
            console.error('[MQTT] Failed to publish:', err);
            return;
          }
          console.debug('[MQTT] Published position update');
          lastPayloadRef.current = dedupKey;
        });
      } catch (e) {
        console.error('[MQTT] Error preparing payload:', e);
      }
    };

    // 连接成功立即发布，并开启 30s 轮询
    const onConnect = () => {
      console.debug('[MQTT] Connected, scheduling initial publish');
      setTimeout(tryPublish, 1000); // 延迟1秒后发布，确保连接稳定
      if (!publishTimerRef.current) {
        console.debug('[MQTT] Setting up publish timer');
        publishTimerRef.current = setInterval(tryPublish, 30000);
      }
    };
    client.on('connect', onConnect);
    if (client.connected) onConnect();

    return () => {
      console.debug('[MQTT] Cleaning up pos sync');
      client.off('connect', onConnect);
      if (publishTimerRef.current) {
        clearInterval(publishTimerRef.current);
        publishTimerRef.current = null;
      }
    };
  }, [courseId, isAdmin, client]);
} 