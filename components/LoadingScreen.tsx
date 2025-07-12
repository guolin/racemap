'use client';
import { useEffect, useState, useRef } from 'react';
import { useLang, useSetLang, detectUserLanguage } from 'src/locale';

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
  minDisplayTime?: number;
  dependencies?: Promise<any>[];
}

export default function LoadingScreen({ 
  onLoadingComplete, 
  minDisplayTime = 1500,
  dependencies = []
}: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');
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

    const startTime = Date.now();
    let progressInterval: NodeJS.Timeout;
    
    const loadingSteps = [
      { progress: 20, text: lang === 'zh' ? '初始化应用...' : 'Initializing...' },
      { progress: 40, text: lang === 'zh' ? '加载地图组件...' : 'Loading map...' },
      { progress: 60, text: lang === 'zh' ? '连接GPS服务...' : 'Connecting GPS...' },
      { progress: 80, text: lang === 'zh' ? '同步数据...' : 'Syncing data...' },
      { progress: 95, text: lang === 'zh' ? '准备就绪...' : 'Ready...' }
    ];

    let currentStep = 0;
    
    // 模拟加载进度
    progressInterval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        setProgress(step.progress);
        setLoadingText(step.text);
        currentStep++;
      } else {
        clearInterval(progressInterval);
      }
    }, 300);

    // 等待依赖项加载完成
    const waitForDependencies = async () => {
      try {
        if (dependencies.length > 0) {
          await Promise.all(dependencies);
        }
      } catch (error) {
        console.warn('Some dependencies failed to load:', error);
      }
    };

    // 确保最小显示时间
    const timer = setTimeout(async () => {
      await waitForDependencies();
      
      setProgress(100);
      setLoadingText(lang === 'zh' ? '加载完成' : 'Complete');
      
      setTimeout(() => {
        setIsVisible(false);
        onLoadingComplete?.();
      }, 300);
    }, Math.max(minDisplayTime, startTime + 1000));

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [minDisplayTime, onLoadingComplete, dependencies, lang, setLang]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-white z-50 flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="mb-8 transform transition-transform duration-500 hover:scale-105">
        <img 
          src="/logo.png" 
          alt="logo" 
          className="w-32 h-32 animate-pulse"
        />
      </div>

      {/* 加载文字 */}
      <div className="text-xl font-semibold text-gray-700 mb-4 text-center min-h-[2rem]">
        {loadingText}
      </div>

      {/* 进度条 */}
      <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 进度百分比 */}
      <div className="mt-3 text-sm text-gray-500 font-medium">
        {Math.round(progress)}%
      </div>

      {/* 加载动画 */}
      <div className="mt-6 flex space-x-1">
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