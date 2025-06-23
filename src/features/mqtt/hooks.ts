import { useEffect, useRef } from 'react';
import { getMqttClient } from './service';

/**
 * Return the singleton MQTT client.  Lazily connects on first call.
 */
export function useMqttClient() {
  // Only create once per component lifecycle.
  const clientRef = useRef(getMqttClient());
  return clientRef.current;
}

/**
 * React hook to subscribe to a topic and automatically clean up.
 * @param topic MQTT topic
 * @param handler callback(topic, payload)
 * @param deps dependency list for handler (default [])
 */
export function useMqttSubscription(
  topic: string,
  handler: (topic: string, payload: Uint8Array) => void,
  deps: any[] = []
) {
  const client = useMqttClient();
  useEffect(() => {
    client.subscribe(topic, { qos: 0 });
    client.on('message', handler);
    return () => {
      client.unsubscribe(topic);
      client.off('message', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, ...deps]);
} 