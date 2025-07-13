// 禁用页面缩放
(function() {
  'use strict';
  
  // 禁用双击缩放
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
  
  // 禁用双指缩放
  document.addEventListener('gesturestart', function (event) {
    event.preventDefault();
  });
  
  document.addEventListener('gesturechange', function (event) {
    event.preventDefault();
  });
  
  document.addEventListener('gestureend', function (event) {
    event.preventDefault();
  });
  
  // 禁用键盘缩放
  document.addEventListener('keydown', function (event) {
    if (event.ctrlKey || event.metaKey) {
      if (event.key === '+' || event.key === '=' || event.key === '-' || event.key === '0') {
        event.preventDefault();
      }
    }
  });
  
  // 确保viewport设置正确
  function setViewport() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover');
    }
  }
  
  // 页面加载时设置
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setViewport);
  } else {
    setViewport();
  }
  
  // 防止页面被拖拽
  document.addEventListener('touchmove', function (event) {
    if (event.scale !== 1) {
      event.preventDefault();
    }
  }, { passive: false });
  
})(); 