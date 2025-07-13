import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMqttClient } from '@features/mqtt/hooks';

interface Options {
  courseId: string;
  isAdmin: boolean;
  /** 最新信号船位置，用于管理员发布 */
  getLatestPos: () => L.LatLng | null;
  /** 获取航线数据，用于发布 */
  getCourseData: () => { type: string; params: Record<string, any> };
  /** 收到管理员位置后回调（观察者端） */
  onRecvPos?: (pos: L.LatLng) => void;
  /** 收到航线数据后回调 */
  onRecvCourse?: (c: { type: string; params: Record<string, any> }) => void;
}

const posTopic = (id: string) => `race/${id}/location/admin`;

/**
 * 封装 MQTT 连接 / 船位订阅 / 管理员定时发布。
 * - 管理员：每 30s retain 发布一次位置 + 航线参数
 * - 观察者：订阅管理员位置，回调 onRecvPos & onRecvCourse
 */
export function useMqttPosSync({ courseId, isAdmin, getLatestPos, getCourseData, onRecvPos, onRecvCourse }: Options) {
  const client = useMqttClient();
  const publishTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPayloadRef = useRef<string | null>(null);
  const lastPosRef = useRef<L.LatLng | null>(null);
  const getLatestPosRef = useRef(getLatestPos);
  const getCourseDataRef = useRef(getCourseData);
  const onRecvPosRef = useRef(onRecvPos);
  const onRecvCourseRef = useRef(onRecvCourse);

  getLatestPosRef.current = getLatestPos;
  getCourseDataRef.current = getCourseData;
  onRecvPosRef.current = onRecvPos;
  onRecvCourseRef.current = onRecvCourse;

  // 检查位置是否发生显著变化（1米阈值）
  const checkPositionChange = () => {
    const currentPos = getLatestPosRef.current();
    if (!currentPos) return false;
    
    const lastPos = lastPosRef.current;
    if (!lastPos) {
      lastPosRef.current = currentPos;
      return true; // 首次位置，需要发布
    }
    
    // 检查位置变化（精度约1米）
    const POSITION_THRESHOLD = 0.00001; // 约1米
    const hasPositionChanged = 
      Math.abs(currentPos.lat - lastPos.lat) > POSITION_THRESHOLD ||
      Math.abs(currentPos.lng - lastPos.lng) > POSITION_THRESHOLD;
    
    if (hasPositionChanged) {
      lastPosRef.current = currentPos;
      return true;
    }
    
    return false;
  };

  // 发布函数
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
    const { type, params } = getCourseDataRef.current();
    const common = {
      id: 'ADMIN',
      lat: pos.lat,
      lng: pos.lng,
      course: { type, params },
    };
    
    // 去重逻辑：同时检查位置和航线参数
    const dedupKey = JSON.stringify({
      lat: pos.lat,
      lng: pos.lng,
      course: { type, params }
    });

    // 去重：如果位置和航线参数均未变化，则不再发送
    if (dedupKey === lastPayloadRef.current) {
      console.debug('[MQTT] Skip publishing, no changes');
      return;
    }

    try {
      const payloadStr = JSON.stringify({ ...common, timestamp: Date.now() });
      client.publish(posTopic(courseId), payloadStr, { retain: true, qos: 1 }, (err) => {
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

    // 连接成功立即发布，并开启每秒检查位置变化
    const onConnect = () => {
      console.debug('[MQTT] Connected, scheduling initial publish');
      setTimeout(tryPublish, 1000); // 延迟1秒后发布，确保连接稳定
      if (!publishTimerRef.current) {
        console.debug('[MQTT] Setting up position change monitor (1s interval)');
        // 每秒检查一次位置变化
        publishTimerRef.current = setInterval(() => {
          // 检查位置是否发生显著变化（1米）
          if (checkPositionChange()) {
            console.debug('[MQTT] Position changed significantly (>1m), publishing update');
            tryPublish();
          }
        }, 1000);
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

  // exposed manual publish function (admin only)
  const publishNow = () => {
    if (!isAdmin) return;
    if (!client) return;
    const pos = getLatestPosRef.current();
    if (!pos) return;
    const { type, params } = getCourseDataRef.current();
    const payloadStr = JSON.stringify({
      id: 'ADMIN',
      lat: pos.lat,
      lng: pos.lng,
      timestamp: Date.now(),
      course: { type, params },
    });
    client.publish(posTopic(courseId), payloadStr, { retain: true, qos: 1 });
    // 更新去重键，保持与tryPublish一致
    lastPayloadRef.current = JSON.stringify({
      lat: pos.lat,
      lng: pos.lng,
      course: { type, params }
    });
  };

  return publishNow;
} 