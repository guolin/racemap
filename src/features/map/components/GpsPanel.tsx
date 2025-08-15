import React from 'react';

interface Props {
  speedKts: number | null;
  bearingDeg: number | null;
  gpsOk: boolean;
  onClick?: () => void;
  showStatusDot?: boolean; // 是否显示状态圆点（默认不显示，避免与全局指示器重复）
}

export const GpsPanel: React.FC<Props> = ({ speedKts, bearingDeg, gpsOk, onClick, showStatusDot = false }) => {
  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer rounded-lg bg-white/80 backdrop-blur px-3 py-2 text-center leading-none min-w-[100px]"
    >
      <div className="text-xl font-bold">
        {speedKts != null ? speedKts.toFixed(1) : '--'}
        <span className="text-sm"> kt</span>
      </div>
      <div className="text-xs">{bearingDeg != null ? Math.round(bearingDeg) + '°' : '--'}</div>
      {showStatusDot && (
        <span
          className={`absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full ${gpsOk ? 'bg-green-600' : 'bg-red-600'}`}
        />
      )}
    </div>
  );
}; 