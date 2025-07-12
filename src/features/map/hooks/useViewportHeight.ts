import { useState, useEffect } from 'react';

/**
 * 处理移动端浏览器动态视口高度问题
 * 特别是地址栏显示/隐藏时的视口高度变化
 * 
 * 返回当前可用的视口高度，并监听视口变化
 */
export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState<number>(0);

  useEffect(() => {
    // 初始化视口高度
    const updateHeight = () => {
      // 使用 visualViewport API（如果可用）
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        // 降级到 window.innerHeight
        setViewportHeight(window.innerHeight);
      }
    };

    // 立即更新一次
    updateHeight();

    // 监听视口变化
    const handleResize = () => {
      updateHeight();
    };

    // 监听 visualViewport 变化（更精确）
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    // 添加事件监听器
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // 如果支持 visualViewport，使用它来监听变化
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, []);

  return viewportHeight;
}

/**
 * 检测移动端浏览器的地址栏状态
 * 返回地址栏是否可见
 */
export function useAddressBarState() {
  const [isAddressBarVisible, setIsAddressBarVisible] = useState<boolean>(false);

  useEffect(() => {
    // 只在移动端检测
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) return;

    let lastHeight = window.innerHeight;
    
    const checkAddressBar = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = Math.abs(currentHeight - lastHeight);
      
      // 如果高度变化超过50px，可能是地址栏显示/隐藏
      if (heightDiff > 50) {
        setIsAddressBarVisible(currentHeight < lastHeight);
        lastHeight = currentHeight;
      }
    };

    // 监听视口变化
    window.addEventListener('resize', checkAddressBar);
    window.addEventListener('orientationchange', checkAddressBar);
    
    // 如果支持 visualViewport，使用它来更精确地检测
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkAddressBar);
    }

    return () => {
      window.removeEventListener('resize', checkAddressBar);
      window.removeEventListener('orientationchange', checkAddressBar);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', checkAddressBar);
      }
    };
  }, []);

  return isAddressBarVisible;
} 