import { useEffect, useMemo, useState } from 'react';
import type { MqttClient } from 'mqtt';

export interface NetworkStatus {
  status: 'online' | 'offline' | 'mqtt_error' | 'stale';
  message: string;
  isHealthy: boolean;
}

export function useNetworkStatus(mqttClient?: MqttClient): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [mqttConnected, setMqttConnected] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // 浏览器网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    return;
  }, []);

  // MQTT 连接与消息事件
  useEffect(() => {
    if (!mqttClient) return;

    const handleConnect = () => {
      setMqttConnected(true);
      setLastSyncTime(Date.now());
    };
    const handleOffline = () => setMqttConnected(false);
    const handleMessage = () => setLastSyncTime(Date.now());

    mqttClient.on('connect', handleConnect);
    mqttClient.on('reconnect', handleConnect);
    mqttClient.on('offline', handleOffline);
    mqttClient.on('close', handleOffline);
    mqttClient.on('error', handleOffline);
    mqttClient.on('message', handleMessage);

    if (mqttClient.connected) handleConnect();

    return () => {
      mqttClient.off('connect', handleConnect);
      mqttClient.off('reconnect', handleConnect);
      mqttClient.off('offline', handleOffline);
      mqttClient.off('close', handleOffline);
      mqttClient.off('error', handleOffline);
      mqttClient.off('message', handleMessage);
    };
  }, [mqttClient]);

  return useMemo<NetworkStatus>(() => {
    if (!isOnline) return { status: 'offline', message: '网络已断开', isHealthy: false };
    if (!mqttConnected) return { status: 'mqtt_error', message: 'MQTT连接中...', isHealthy: false };
    if (lastSyncTime && Date.now() - lastSyncTime > 30_000) {
      return { status: 'stale', message: '数据可能过期', isHealthy: false };
    }
    return { status: 'online', message: '实时同步中', isHealthy: true };
  }, [isOnline, mqttConnected, lastSyncTime]);
} 