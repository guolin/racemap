'use client';
import React from 'react';

interface Props {
  /** 是否管理员，决定是否显示 ⚙️ 按钮 */
  isAdmin: boolean;
  /** 点击🚤按钮执行：手动获取并定位当前位置 */
  onLocate?: () => void;
  /** 点击🗺️按钮执行：预留（如切换地图图层），可选 */
  onMap?: () => void;
  /** 点击⚙️按钮执行：打开设置面板（仅管理员） */
  onSettings?: () => void;
}

const btnStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 12,
  border: 'none',
  background: '#fff',
  fontSize: 24,
  cursor: 'pointer',
  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
};

const SideToolbar: React.FC<Props> = ({ isAdmin, onLocate, onMap, onSettings }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 100,
        right: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 1000,
      }}
    >
      <button style={btnStyle} title="定位到当前位置" onClick={onLocate}>🚤</button>
      <button style={btnStyle} onClick={onMap}>🗺️</button>
      {isAdmin && (
        <button style={btnStyle} onClick={onSettings}>⚙️</button>
      )}
    </div>
  );
};

export default SideToolbar; 