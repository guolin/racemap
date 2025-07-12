import { useState, useEffect } from 'react';

interface UseLoadingOptions {
  minDuration?: number;
  dependencies?: Promise<any>[];
  onComplete?: () => void;
}

export function useLoading({
  minDuration = 1000,
  dependencies = [],
  onComplete
}: UseLoadingOptions = {}) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    let progressInterval: NodeJS.Timeout;

    // 模拟进度更新
    progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 200);

    // 等待依赖项和最小时间
    const waitForComplete = async () => {
      try {
        if (dependencies.length > 0) {
          await Promise.all(dependencies);
        }
      } catch (error) {
        console.warn('Some dependencies failed to load:', error);
      }

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDuration - elapsed);

      setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          onComplete?.();
        }, 200);
      }, remaining);
    };

    waitForComplete();

    return () => {
      clearInterval(progressInterval);
    };
  }, [minDuration, dependencies, onComplete]);

  return {
    isLoading,
    progress,
    setIsLoading
  };
} 