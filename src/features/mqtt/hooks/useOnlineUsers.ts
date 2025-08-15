import { useEffect, useState } from 'react';
import { useMqttClient } from '../hooks';

export interface OnlineUser {
  id: string;
  role: 'admin' | 'observer';
  lat: number;
  lng: number;
  heading?: number;
  course?: { type: string; params: any };
  ts: number;
}

export function useOnlineUsers(raceId: string, currentUserId: string) {
  const client = useMqttClient();
  const [users, setUsers] = useState<Record<string, OnlineUser>>({});

  useEffect(() => {
    if (!client) return;

    // 兼容性处理：同时订阅新旧主题格式
    const newTopicFilter = `race/${raceId}/presence/+`;
    const oldAdminTopic = `race/${raceId}/location/admin`;
    const oldObserverTopicFilter = `race/${raceId}/location/observer/+`;

    const onMsg = (topic: string, payload: Uint8Array) => {
      try {
        let userId: string;
        let data: any;

        // 解析新格式：race/{raceId}/presence/{userId}
        if (topic.startsWith(`race/${raceId}/presence/`)) {
          userId = topic.split('/').pop()!;
          data = JSON.parse(new TextDecoder().decode(payload));
        }
        // 兼容旧格式：race/{raceId}/location/admin
        else if (topic === oldAdminTopic) {
          userId = 'ADMIN';
          const oldData = JSON.parse(new TextDecoder().decode(payload));
          data = {
            id: 'ADMIN',
            role: 'admin',
            lat: oldData.lat,
            lng: oldData.lng,
            course: oldData.course,
            ts: oldData.ts || Date.now()
          };
        }
        // 兼容旧格式：race/{raceId}/location/observer/{observerId}
        else if (topic.startsWith(`race/${raceId}/location/observer/`)) {
          userId = topic.split('/').pop()!;
          const oldData = JSON.parse(new TextDecoder().decode(payload));
          data = {
            id: userId,
            role: 'observer',
            lat: oldData.lat,
            lng: oldData.lng,
            heading: oldData.heading,
            ts: oldData.ts || Date.now()
          };
        } else {
          return; // 忽略其他主题
        }

        // 验证数据完整性
        if (typeof data.lat !== 'number' || typeof data.lng !== 'number') {
          console.warn('[useOnlineUsers] Invalid position data:', data);
          return;
        }

        setUsers(prev => {
          const now = Date.now();
          // 统一60秒过期清理
          const cleaned: Record<string, OnlineUser> = {};
          Object.entries(prev).forEach(([id, user]) => {
            if (now - user.ts < 60_000) {
              cleaned[id] = user;
            }
          });

          // 添加/更新用户（包括自己）
          cleaned[userId] = {
            id: data.id,
            role: data.role,
            lat: data.lat,
            lng: data.lng,
            heading: data.heading,
            course: data.course,
            ts: data.ts
          };

          return cleaned;
        });

        // 调试日志：对比新旧逻辑
        console.debug('[useOnlineUsers] Updated user:', userId, 'role:', data.role, 'total users:', Object.keys(users).length + 1);
      } catch (e) {
        console.error('[useOnlineUsers] Parse error:', e, 'topic:', topic);
      }
    };

    // 订阅所有相关主题
    client.subscribe(newTopicFilter, { qos: 0 });
    client.subscribe(oldAdminTopic, { qos: 0 });
    client.subscribe(oldObserverTopicFilter, { qos: 0 });
    client.on('message', onMsg);

    return () => {
      client.unsubscribe(newTopicFilter);
      client.unsubscribe(oldAdminTopic);
      client.unsubscribe(oldObserverTopicFilter);
      client.off('message', onMsg);
    };
  }, [client, raceId]);

  const allUsers = Object.values(users);
  return {
    allUsers,
    onlineCount: allUsers.length,
    otherUsers: allUsers.filter(u => u.id !== currentUserId),
    admin: allUsers.find(u => u.role === 'admin'),
    observers: allUsers.filter(u => u.role === 'observer')
  };
} 