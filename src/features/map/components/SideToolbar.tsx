'use client';
import React from 'react';
import { FiAlertCircle, FiSettings } from 'react-icons/fi';
import { TbLocation } from 'react-icons/tb';
import { useT } from 'src/locale';

interface Props {
  /** 是否管理员，决定是否显示 ⚙️ 按钮 */
  isAdmin: boolean;
  /** 点击🚤按钮执行：手动获取并定位当前位置 */
  onLocate?: () => void;
  /** 点击⚙️按钮执行：打开设置面板（仅管理员） */
  onSettings?: () => void;
  /** 点击ℹ️按钮执行：打开坐标信息对话框 */
  onInfo?: () => void;
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

const SideToolbar: React.FC<Props> = ({ isAdmin, onLocate, onSettings, onInfo }) => {
  const t = useT();
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
      <button style={btnStyle} title={t('common.locate_tooltip')} onClick={onLocate}>
        <TbLocation style={{ width: 24, height: 24, display: 'block', margin: '0 auto' }} />
      </button>
      <button style={btnStyle} title={t('common.info_tooltip')} onClick={onInfo}>
        <FiAlertCircle style={{ width: 24, height: 24, display: 'block', margin: '0 auto' }} />
      </button>
      {isAdmin && (
        <button style={btnStyle} onClick={onSettings} title={t('common.settings_tooltip')}>
          <FiSettings style={{ width: 24, height: 24, display: 'block', margin: '0 auto' }} />
        </button>
      )}
    </div>
  );
};

export default SideToolbar; 