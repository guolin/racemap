'use client';
import React from 'react';

interface Props {
  bearing: number; // 当前地图 bearing
  onToggle: () => void; // 点击切换 北朝上/航线朝上
  top?: number; // 距顶部距离 px (可选)
}

const CompassButton: React.FC<Props> = ({ bearing, onToggle, top = 68 }) => {
  return (
    <button
      className="absolute left-3 w-12 h-12 rounded-xl border-0 bg-card text-foreground flex items-center justify-center z-[1000] cursor-pointer shadow-md hover:bg-muted-hover transition-colors"
      style={{ top }}
      onClick={onToggle}
    >
      <div
        className="transition-transform duration-300 text-2xl"
        style={{ transform: `rotate(${bearing}deg)` }}
      >
        <svg width="32" height="32" viewBox="0 0 100 100" className="block">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="transparent" />
          <polygon points="50,18 60,55 50,46 40,55" fill="hsl(var(--chart-course))" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </button>
  );
};

export default CompassButton; 