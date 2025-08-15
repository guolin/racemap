'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft } from 'lucide-react';
import { useT } from 'src/locale';
import { Button } from '@components/components/ui/button';

interface TopBarProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

const TopBar: React.FC<TopBarProps> = ({ 
  left, 
  center, 
  right, 
  showBackButton = false,
  onBack,
  className = ''
}) => {
  const router = useRouter();
  const t = useT();
  
  const handleBack = onBack ?? (() => window.history.back());
  const handleHome = () => router.push('/');

  const defaultLeft = (
    <>
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          aria-label="返回"
          className="text-foreground hover:bg-muted-hover"
        >
          <ArrowLeft size={24} />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleHome}
        aria-label={t('common.home')}
        className="text-foreground"
      >
        <Home size={24} />
      </Button>
    </>
  );

  return (
    <div className={`fixed top-0 left-0 right-0 h-14 bg-background border-b border-border flex items-center px-3 z-[1000] ${className}`}>
      {/* 左侧区域 */}
      <div className="flex items-center gap-2">{left ?? defaultLeft}</div>
      {/* 中间区域绝对居中 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-lg truncate max-w-[60vw] text-center select-none">
        {center}
      </div>
      {/* 右侧区域始终贴右 */}
      <div className="flex items-center gap-1 ml-auto">{right}</div>
    </div>
  );
};

export default TopBar; 