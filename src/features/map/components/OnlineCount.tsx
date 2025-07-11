import React from 'react';
import { PiAnchorBold } from 'react-icons/pi';

interface OnlineCountProps {
  count: number;
  className?: string;
}

/**
 * 在线人数显示组件
 */
const OnlineCount: React.FC<OnlineCountProps> = ({ count, className = '' }) => {
  return (
    <div className={`flex items-center gap-1 text-base font-medium ${className}`}>
      <PiAnchorBold style={{ width: 20, height: 20 }} />
      {count}
    </div>
  );
};

export default OnlineCount; 