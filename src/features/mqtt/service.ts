import mqtt, { MqttClient, IClientOptions } from 'mqtt';

let client: MqttClient | null = null;
let reconnectCount = 0;
let connectCount = 0;  // 添加连接计数器

/**
 * Return global singleton MQTT client.  Will (re-)connect if needed.
 */
export function getMqttClient(): MqttClient {
  if (client && client.connected) {
    console.debug('[MQTT] Reusing existing connected client');
    return client;
  }
  if (client) {
    console.debug('[MQTT] Client exists but not connected, state:', client.connected);
    return client;
  }

  console.debug('[MQTT] Creating new client, connect count:', ++connectCount);
  const host = process.env.NEXT_PUBLIC_MQTT_HOST || 'broker.emqx.io';
  const port = process.env.NEXT_PUBLIC_MQTT_PORT || '8084';
  const protocol = process.env.NEXT_PUBLIC_MQTT_PROTOCOL || 'wss';
  const path = process.env.NEXT_PUBLIC_MQTT_PATH || '/mqtt';

  const url = `${protocol}://${host}:${port}${path}`;

  const options: IClientOptions = {
    reconnectPeriod: 8000,   // 8秒重连间隔，避免频繁重连
    connectTimeout: 15000,   // 15秒连接超时
    keepalive: 30,           // 30秒心跳，节省流量
    clean: true,
    clientId: `rc_${Math.random().toString(16).slice(2, 10)}`,
    username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
    password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
    /** 使用 MQTT v5 以支持 messageExpiryInterval 属性 */
    protocolVersion: 5,
  };

  client = mqtt.connect(url, options);
  const c = client;

  c.on('connect', () => {
    console.info('[MQTT] connected ->', url);
    reconnectCount = 0;
  });
  c.on('reconnect', () => {
    console.warn('[MQTT] reconnecting… count:', ++reconnectCount);
    // 移除重连限制，允许无限重连（适合海上环境）
    // if (reconnectCount > 5) {
    //   console.error('[MQTT] too many reconnection attempts, closing connection');
    //   c.end(true);
    //   client = null;
    // }
  });
  c.on('error', err => {
    console.error('[MQTT] error', err);
    if (client === c) {
      c.end(true);
      client = null;
    }
  });
  c.on('close', () => console.warn('[MQTT] disconnected'));

  // Wrap publish for debug
  const originalPublish = c.publish.bind(c);
  c.publish = ((topic: string, message: any, opts?: any, cb?: any) => {
    console.debug('[MQTT] publish()', topic, message);
    return originalPublish(topic, message, opts as any, cb);
  }) as any;

  return c;
}

// ---------------------------------------------------------------------------
// Observer Position Publishing
// ---------------------------------------------------------------------------

export interface ObserverPosition {
  lat: number;
  lng: number;
  heading?: number | null;
}

/**
 * Publish current observer position to MQTT with retain + 5 min TTL.
 * Topic: race/{raceId}/location/observer/{observerId}
 *
 * @param raceId      6-char room code (Base36)
 * @param observerId  unique id of this client
 * @param pos         position data (lat/lng/heading)
 */
export function publishObserverPos(
  raceId: string,
  observerId: string,
  pos: ObserverPosition,
) {
  const c = getMqttClient();
  if (!c || !c.connected) return;

  const now = Date.now();

  // 发布到旧主题格式（兼容性）
  const oldTopic = `race/${raceId}/location/observer/${observerId}`;
  const oldPayload = JSON.stringify({ ...pos, ts: now });
  c.publish(oldTopic, oldPayload, {
    qos: 0,
    retain: true,
    properties: {
      // MQTT v5 – expire retained message after 5 minutes (300 s)
      messageExpiryInterval: 300,
    },
  });

  // 发布到新主题格式（统一presence）
  const newTopic = `race/${raceId}/presence/${observerId}`;
  const newPayload = JSON.stringify({
    id: observerId,
    role: 'observer',
    lat: pos.lat,
    lng: pos.lng,
    heading: pos.heading,
    ts: now
  });
  c.publish(newTopic, newPayload, {
    qos: 0,
    retain: true,
    properties: { messageExpiryInterval: 60 } // 统一60秒过期
  });
} 