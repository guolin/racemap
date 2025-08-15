'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface SimpleLoadingProps {
  onLoadingComplete?: () => void;
  duration?: number;
}

export default function SimpleLoading({ 
  onLoadingComplete, 
  duration = 800 
}: SimpleLoadingProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onLoadingComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="mb-6">
        <Image 
          src="/logo.png" 
          alt="logo" 
          width={96}
          height={96}
          className="animate-pulse"
          priority
        />
      </div>

      {/* 加载动画 */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
} 