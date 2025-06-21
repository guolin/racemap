import mqtt, { MqttClient, IClientOptions } from 'mqtt';

let client: MqttClient | null = null;

/**
 * 获取（或初始化）全局 MQTT 客户端实例。
 * - 浏览器端使用 WebSocket (`wss`) 协议连接。
 * - 连接参数通过 `NEXT_PUBLIC_` 前缀的环境变量配置。
 */
export function getMqttClient(): MqttClient {
  if (client && client.connected) return client;

  const host = process.env.NEXT_PUBLIC_MQTT_HOST || 'broker.emqx.io';
  const port = process.env.NEXT_PUBLIC_MQTT_PORT || '8084';
  const protocol = process.env.NEXT_PUBLIC_MQTT_PROTOCOL || 'wss';
  const path = process.env.NEXT_PUBLIC_MQTT_PATH || '/mqtt';

  const url = `${protocol}://${host}:${port}${path}`;

  const options: IClientOptions = {
    reconnectPeriod: 2000,
    connectTimeout: 5000,
    clientId: `rc_${Math.random().toString(16).slice(2, 10)}`,
    username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
    password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
  };

  client = mqtt.connect(url, options);
  const c = client; // non-null alias
  // 基础日志输出
  c.on('connect', () => {
    console.info('[MQTT] connected ->', url);

    // wrap publish for debug
    const originalPublish = c.publish.bind(c);
    c.publish = ((topic: string, message: any, opts?: any, cb?: any) => {
      console.debug('[MQTT] publish()', topic, message);
      return originalPublish(topic, message, opts as any, cb);
    }) as any;
  });
  c.on('reconnect', () => console.warn('[MQTT] reconnecting...'));
  c.on('error', (err) => console.error('[MQTT] error', err));
  c.on('close', () => console.warn('[MQTT] disconnected'));

  return c;
} 