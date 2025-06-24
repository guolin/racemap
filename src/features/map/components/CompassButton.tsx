'use client';
import React from 'react';

interface Props {
  bearing: number; // 当前地图 bearing
  onToggle: () => void; // 点击切换 北朝上/航线朝上
}

const CompassButton: React.FC<Props> = ({ bearing, onToggle }) => {
  return (
    <button
      style={{
        position: 'absolute',
        top: 68,
        left: 12,
        width: 48,
        height: 48,
        borderRadius: 12,
        border: 'none',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        cursor: 'pointer',
      }}
      onClick={onToggle}
    >
      <div
        style={{
          transform: `rotate(${bearing}deg)`,
          transition: 'transform 0.3s',
          fontSize: 24,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 100 100" style={{ display: 'block' }}>
          <circle cx="50" cy="50" r="45" stroke="#333" strokeWidth="6" fill="#fff" />
          <polygon points="50,18 60,55 50,46 40,55" fill="#ff4500" stroke="#333" strokeWidth="2" />
        </svg>
      </div>
    </button>
  );
};

export default CompassButton; 