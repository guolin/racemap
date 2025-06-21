'use client';
import Link from 'next/link';

export default function ManageListPage() {
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
      <h2>管理比赛 (开发中)</h2>
      <p>此页面将列出已创建/管理过的比赛。</p>
      <Link href="/">
        <button style={{ padding: '12px 24px', border: 'none', background: '#ff7f0e', color: '#fff', borderRadius: 8 }}>
          返回首页
        </button>
      </Link>
    </main>
  );
} 