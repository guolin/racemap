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
    reconnectPeriod: 2000,  // 恢复到2秒
    connectTimeout: 5000,   // 恢复到5秒
    keepalive: 60,
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
    if (reconnectCount > 5) {
      console.error('[MQTT] too many reconnection attempts, closing connection');
      c.end(true);
      client = null;
    }
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

  const topic = `race/${raceId}/location/observer/${observerId}`;
  const payload = JSON.stringify({ ...pos, ts: Date.now() });

  c.publish(topic, payload, {
    qos: 0,
    retain: true,
    properties: {
      // MQTT v5 – expire retained message after 5 minutes (300 s)
      messageExpiryInterval: 300,
    },
  });
} 