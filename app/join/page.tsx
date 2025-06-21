'use client';
import Link from 'next/link';

export default function JoinListPage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 16px',
        gap: 20,
      }}
    >
      <h2>加入比赛 (开发中)</h2>
      <p>此页面将展示之前加入过的比赛列表。</p>
      <Link href="/">
        <button style={{ padding: '12px 24px', border: 'none', background: '#1f7c8c', color: '#fff', borderRadius: 8 }}>返回首页</button>
      </Link>
    </main>
  );
} 