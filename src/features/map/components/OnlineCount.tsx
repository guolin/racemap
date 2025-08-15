import React from 'react';
import { Anchor } from 'lucide-react';

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
      <Anchor size={20} />
      {count}
    </div>
  );
};

export default OnlineCount; 