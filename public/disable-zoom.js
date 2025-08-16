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
  
  // 防止页面被拖拽 - 只在地图页面生效，但允许滚动容器内的滚动
  document.addEventListener('touchmove', function (event) {
    // 只在地图页面或有 data-map-page 属性的页面阻止 touchmove
    const isMapPage = document.body.classList.contains('map-page') || 
                      document.querySelector('[data-map-page]');
    
    if (!isMapPage) return; // 非地图页面直接放行
    
    // 地图页面中，检查是否在可滚动容器内
    let target = event.target;
    while (target && target !== document.body) {
      const computedStyle = window.getComputedStyle(target);
      // 如果是可滚动容器，允许滚动
      if (computedStyle.overflowY === 'auto' || computedStyle.overflowY === 'scroll' ||
          computedStyle.overflow === 'auto' || computedStyle.overflow === 'scroll') {
        return; // 允许滚动
      }
      target = target.parentElement;
    }
    
    // 关键：只有多点触摸时才阻止（防止页面缩放），单点触摸（地图拖拽）则放行
    if (event.touches && event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });
  
})(); 