import mqtt, { MqttClient, IClientOptions } from 'mqtt';

let client: MqttClient | null = null;

/**
 * Return global singleton MQTT client.  Will (re-)connect if needed.
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
    connectTimeout: 5_000,
    clientId: `rc_${Math.random().toString(16).slice(2, 10)}`,
    username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
    password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
  };

  client = mqtt.connect(url, options);
  const c = client; // alias non-null

  // Basic debug logging once
  c.on('connect', () => {
    console.info('[MQTT] connected ->', url);
  });
  c.on('reconnect', () => console.warn('[MQTT] reconnecting…'));
  c.on('error', err => console.error('[MQTT] error', err));
  c.on('close', () => console.warn('[MQTT] disconnected'));

  // Wrap publish for debug (once)
  const originalPublish = c.publish.bind(c);
  c.publish = ((topic: string, message: any, opts?: any, cb?: any) => {
    console.debug('[MQTT] publish()', topic, message);
    return originalPublish(topic, message, opts as any, cb);
  }) as any;

  return c;
} 