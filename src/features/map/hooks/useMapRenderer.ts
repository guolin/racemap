import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { registry } from '@features/course/plugins/registry';
import { useCourseStore } from '@features/course/store';

/**
 * 统一的地图渲染器
 * 职责：监听所有相关状态变化，统一管理地图重绘
 */
export function useMapRenderer(mapRef: React.RefObject<L.Map | null>) {
  const type = useCourseStore((s) => s.type);
  const params = useCourseStore((s) => s.params);
  const groupRef = useRef<L.FeatureGroup | null>(null);

  // 统一的渲染状态 - 这是唯一的数据源
  const renderState = useMemo(() => ({
    courseType: type,
    courseParams: params,
    // 使用稳定的序列化避免引用问题
    paramsHash: JSON.stringify(
      Object.keys(params || {})
        .sort()
        .reduce((acc, key) => ({ ...acc, [key]: params[key] }), {})
    )
  }), [type, params]);

  // 纯绘制函数 - 无副作用，只负责绘制
  const drawCourse = useCallback((origin: L.LatLng) => {
    if (!mapRef.current) return;
    
    const plugin = registry[renderState.courseType];
    if (!plugin) return;

    // 移除旧图层
    if (groupRef.current) {
      mapRef.current.removeLayer(groupRef.current);
    }

    // 绘制新图层 - 前面已移除旧图层，这里总是传null
    groupRef.current = plugin.draw(
      mapRef.current, 
      origin, 
      renderState.courseParams, 
      null
    );
  }, [mapRef, renderState.courseType, renderState.paramsHash]); // 只依赖类型和参数hash，避免频繁重建

  // 清理函数
  useEffect(() => {
    return () => {
      if (mapRef.current && groupRef.current) {
        mapRef.current.removeLayer(groupRef.current);
        groupRef.current = null;
      }
    };
  }, [mapRef]);

  return { 
    drawCourse,
    renderState // 暴露状态用于调试
  };
}