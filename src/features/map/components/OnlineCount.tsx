import React from 'react';
import { Anchor } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import { useT } from 'src/locale';

interface OnlineCountProps {
  count: number;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * 在线人数显示组件 - 可点击切换观察者列表
 */
const OnlineCount: React.FC<OnlineCountProps> = ({ count, isActive = false, onClick, className = '' }) => {
  const t = useT();
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`flex items-center gap-1 text-base font-medium hover:bg-muted-hover ${isActive ? 'bg-muted' : ''} ${className}`}
      aria-label={`${t('common.online')} ${count}，${t('observers.toggle')}`}
      title={t('observers.toggle')}
    >
      <Anchor size={20} />
      {count}
    </Button>
  );
};

export default OnlineCount; 