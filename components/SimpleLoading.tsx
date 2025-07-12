'use client';
import { useEffect, useState, useRef } from 'react';
import { useLang, useSetLang, detectUserLanguage } from 'src/locale';

interface SimpleLoadingProps {
  onLoadingComplete?: () => void;
  duration?: number;
}

export default function SimpleLoading({ 
  onLoadingComplete, 
  duration = 800 
}: SimpleLoadingProps) {
  const [isVisible, setIsVisible] = useState(true);
  const lang = useLang();
  const setLang = useSetLang();
  const langInitialized = useRef(false);

  useEffect(() => {
    // 只在第一次运行时检测语言偏好
    if (!langInitialized.current) {
      const detectedLang = detectUserLanguage();
      
      // 如果检测到的语言与当前语言不同，则切换语言
      if (detectedLang !== lang) {
        setLang(detectedLang);
      }
      
      langInitialized.current = true;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      onLoadingComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onLoadingComplete, lang, setLang]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="mb-6">
        <img 
          src="/logo.png" 
          alt="logo" 
          className="w-24 h-24 animate-pulse"
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