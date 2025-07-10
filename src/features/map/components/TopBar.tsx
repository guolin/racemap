'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useT } from 'src/locale';

interface Props {
  /** 页面标题，通常为房间码或课程 ID */
  title: string;
  /** 返回按钮点击回调；默认调用 window.history.back() */
  onBack?: () => void;
  /** 在线人数显示，默认 1 */
  onlineCount?: number;
}

/**
 * 地图页面顶部导航栏。
 * - 左侧：返回按钮
 * - 中间：标题（房间码）
 * - 右侧：在线人数
 */
const TopBar: React.FC<Props> = ({ title, onBack, onlineCount = 1 }) => {
  const router = useRouter();
  const t = useT();
  const handleBack = onBack ?? (() => router.push('/'));
  return (
    <div className="absolute top-0 left-0 right-0 h-14 bg-accent-200 text-bg-100 flex items-center px-3 gap-3 z-[1000]">
      <button
        onClick={handleBack}
        className="p-1 text-bg-100 hover:opacity-80"
        aria-label={t('common.home')}
      >
        {/* House icon */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width:24, height:24 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75v9.75A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 19.5V9.75z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 21V12h4.5v9" />
        </svg>
      </button>
      <div className="font-bold text-lg">{title}</div>
      <div className="ml-auto flex items-center gap-1">
        <span>👤</span>
        {onlineCount}
      </div>
    </div>
  );
};

export default TopBar; 