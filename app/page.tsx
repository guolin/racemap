'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getMyRaceId } from '../utils/race';

export default function Home() {
  const router = useRouter();

  const [code, setCode] = useState('');
  const [myId, setMyId] = useState('');

  useEffect(() => {
    setMyId(getMyRaceId());
  }, []);

  const btnStyle: React.CSSProperties = {
    width: '260px',
    padding: '14px 0',
    fontSize: '18px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  };

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '20px',
      }}
    >
      <h1 style={{ fontSize: 24 }}>帆船裁判工具</h1>
      <div
        style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          width: 320,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="输入房间码"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: 18,
            textAlign: 'center',
            borderRadius: 8,
            border: '1px solid #ccc',
          }}
        />
        <button
          style={{ ...btnStyle, width: '100%', background: '#1f7c8c', color: '#fff' }}
          onClick={() => code && router.push(`/race/${code}`)}
        >
          加入比赛
        </button>
        <button
          style={{ ...btnStyle, width: '100%', background: '#ff7f0e', color: '#fff' }}
          onClick={() => myId && router.push(`/race/${myId}`)}
          disabled={!myId}
        >
          {myId ? `进入我的比赛（${myId}）` : '进入我的比赛'}
        </button>
        <button
          style={{ ...btnStyle, width: '100%', background: '#4caf50', color: '#fff' }}
          onClick={() => window.open('/timer', '_blank')}
        >
          Timer 计时器
        </button>
      </div>
    </main>
  );
} 