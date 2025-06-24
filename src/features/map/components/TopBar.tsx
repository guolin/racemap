'use client';
import React from 'react';

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
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: '#1f7c8c',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        color: '#fff',
        gap: 12,
        zIndex: 1000,
      }}
    >
      <button
        onClick={onBack ?? (() => window.history.back())}
        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 24 }}
      >
        ←
      </button>
      <div style={{ fontWeight: 'bold', fontSize: 18 }}>{title}</div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>👤</span>
        {onlineCount}
      </div>
    </div>
  );
};

export default TopBar; 