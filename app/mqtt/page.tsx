'use client';

import { useEffect, useState, useRef } from 'react';
import TopBar from '../../src/features/map/components/TopBar';
import { getMqttClient } from '@features/mqtt/service';
import { Button } from '@components/components/ui/button';

const posTopic = (id: string) => `sailing/${id}/pos`;
const routeTopic = (id: string) => `sailing/${id}/route`;

interface LogEntry {
  ts?: number;
  type: 'send' | 'recv' | 'sys';
  topic?: string;
  payload?: string;
  msg: string;
}

export default function MqttDebugPage() {
  const [raceId, setRaceId] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const clientRef = useRef<any>(null);
  const subscribedRef = useRef(false);

  // 初始化 MQTT
  useEffect(() => {
    const c = getMqttClient();
    clientRef.current = c;

    const handleConnect = () => {
      pushLog({ type: 'sys', msg: '[connect]' });
    };
    const handleMessage = (topic: string, payload: Uint8Array) => {
      pushLog({ type: 'recv', topic, payload: new TextDecoder().decode(payload), msg: '' });
    };

    c.on('connect', handleConnect);
    c.on('message', handleMessage);

    return () => {
      c.off('connect', handleConnect);
      c.off('message', handleMessage);
    };
  }, []);

  const pushLog = (e: LogEntry) => {
    setLogs((prev) => {
      const next = [...prev, { ...e, ts: Date.now() }];
      return next.slice(-300);
    });
  };

  const handleSubscribe = () => {
    if (!clientRef.current || !raceId || raceId.length !== 6) return;
    if (subscribedRef.current) return;
    const topics = [posTopic(raceId), routeTopic(raceId)];
    topics.forEach((t) => {
      clientRef.current.subscribe(t, { qos: 0 }, (err: any) => {
        if (err) pushLog({ type: 'sys', msg: `[sub err] ${t}` });
        else pushLog({ type: 'sys', msg: `[sub ok] ${t}` });
      });
    });
    subscribedRef.current = true;
  };

  return (
    <>
      <TopBar center="MQTT 调试" />
      <div style={{ padding: 16, marginTop: 56 }}>
        <h2>MQTT 调试</h2>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={raceId}
            maxLength={6}
            placeholder="Race ID (6位)"
            onChange={(e) => setRaceId(e.target.value.trim())}
            style={{ padding: 8, fontSize: 16, width: 160 }}
          />
          <Button
            onClick={handleSubscribe}
            className="ml-3"
          >
            订阅
          </Button>
        </div>

        <div style={{ border: '1px solid #ddd', height: '70vh', overflowY: 'auto', fontFamily: 'monospace', fontSize: 12, padding: 8 }}>
          {logs.map((l, idx) => (
            <div key={idx} style={{ color: l.type === 'recv' ? '#000' : '#666' }}>
              {new Date(l.ts ?? Date.now()).toLocaleTimeString()} {l.type.toUpperCase()} {l.topic ? '[' + l.topic + ']' : ''} {l.payload || l.msg}
            </div>
          ))}
        </div>
      </div>
    </>
  );
} 