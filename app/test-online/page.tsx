'use client';

import { useState, useEffect } from 'react';
import { useOnlineUsers } from '@features/mqtt/hooks/useOnlineUsers';
import { useMqttClient } from '@features/mqtt/hooks';

export default function TestOnlinePage() {
  const [raceId, setRaceId] = useState('TEST01');
  const [userId, setUserId] = useState('TEST_USER');
  const [isAdmin, setIsAdmin] = useState(false);
  
  const client = useMqttClient();
  const { allUsers, onlineCount, admin, observers } = useOnlineUsers(raceId, userId);

  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog(`Connected to MQTT: ${client?.connected ? 'Yes' : 'No'}`);
  }, [client?.connected]);

  useEffect(() => {
    addLog(`Online count: ${onlineCount}, Users: ${allUsers.length}`);
    if (admin) {
      addLog(`Admin found: ${admin.id} at ${admin.lat.toFixed(5)}, ${admin.lng.toFixed(5)}`);
    }
    if (observers.length > 0) {
      addLog(`Observers: ${observers.map(o => o.id).join(', ')}`);
    }
  }, [onlineCount, allUsers.length, admin, observers]);

  const publishTestMessage = () => {
    if (!client?.connected) {
      addLog('MQTT not connected');
      return;
    }

    const topic = isAdmin 
      ? `race/${raceId}/presence/ADMIN`
      : `race/${raceId}/presence/${userId}`;
    
    const payload = JSON.stringify({
      id: isAdmin ? 'ADMIN' : userId,
      role: isAdmin ? 'admin' : 'observer',
      lat: 22.3193 + Math.random() * 0.001,
      lng: 114.1694 + Math.random() * 0.001,
      heading: Math.random() * 360,
      ts: Date.now()
    });

    client.publish(topic, payload, { retain: true, qos: 1 });
    addLog(`Published test message to ${topic}`);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">在线用户统计测试</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <label className="block">
            Race ID:
            <input 
              type="text" 
              value={raceId} 
              onChange={(e) => setRaceId(e.target.value)}
              className="ml-2 px-2 py-1 border rounded"
            />
          </label>
          <label className="block">
            User ID:
            <input 
              type="text" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)}
              className="ml-2 px-2 py-1 border rounded"
            />
          </label>
          <label className="block">
            <input 
              type="checkbox" 
              checked={isAdmin} 
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="mr-2"
            />
            Is Admin
          </label>
        </div>
        
        <div className="space-y-2">
          <div>MQTT Status: {client?.connected ? '✅ Connected' : '❌ Disconnected'}</div>
          <div>Online Count: {onlineCount}</div>
          <div>Total Users: {allUsers.length}</div>
          <div>Admin: {admin ? '✅ Found' : '❌ Not found'}</div>
          <div>Observers: {observers.length}</div>
        </div>
      </div>

      <div className="mb-4">
        <button 
          onClick={publishTestMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          发布测试消息
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">所有用户</h2>
          <div className="space-y-1">
            {allUsers.map(user => (
              <div key={user.id} className="p-2 bg-gray-100 rounded text-sm">
                <div><strong>{user.id}</strong> ({user.role})</div>
                <div>{user.lat.toFixed(5)}, {user.lng.toFixed(5)}</div>
                <div>Last seen: {new Date(user.ts).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">调试日志</h2>
          <div className="h-64 overflow-y-auto bg-gray-100 p-2 rounded text-xs font-mono">
            {logs.map((log, i) => (
              <div key={i} className="mb-1">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 