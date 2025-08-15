import { useEffect, useRef } from 'react';
import { getMqttClient } from './service';

/**
 * Return the singleton MQTT client.  Lazily connects on first call.
 */
export function useMqttClient() {
  const clientRef = useRef<ReturnType<typeof getMqttClient> | null>(null);
  
  if (!clientRef.current) {
    console.debug('[MQTT] First time getting client in component');
    clientRef.current = getMqttClient();
  }
  
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
  handler: (_topic: string, _payload: Uint8Array) => void,
  deps: any[] = []
) {
  const client = useMqttClient();
  useEffect(() => {
    console.debug('[MQTT] Subscribing to topic:', topic);
    client.subscribe(topic, { qos: 0 });
    client.on('message', handler);
    return () => {
      console.debug('[MQTT] Unsubscribing from topic:', topic);
      client.unsubscribe(topic);
      client.off('message', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, ...deps]);
} 