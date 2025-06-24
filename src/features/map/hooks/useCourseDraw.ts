import { useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import { drawCourse, CourseParams } from '@features/map/services/drawCourse';

/**
 * 管理航线绘制。返回一个 redraw(origin) 方法；当参数变化时，若存在 lastOrigin 会自动重绘。
 */
export function useCourseDraw(
  mapRef: React.RefObject<L.Map | null>,
  params: CourseParams
) {
  const groupRef = useRef<L.FeatureGroup | null>(null);
  const lastOriginRef = useRef<L.LatLng | null>(null);

  // 手动触发绘制
  const redraw = useCallback(
    (origin: L.LatLng) => {
      if (!mapRef.current) return;
      lastOriginRef.current = origin;
      groupRef.current = drawCourse(mapRef.current, origin, params, groupRef.current);
    },
    [mapRef, params]
  );

  // 参数变化时自动重绘
  useEffect(() => {
    if (lastOriginRef.current) redraw(lastOriginRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.axis, params.distanceNm, params.startLineM]);

  // 清理
  useEffect(() => {
    return () => {
      if (mapRef.current && groupRef.current) {
        mapRef.current.removeLayer(groupRef.current);
        groupRef.current = null;
      }
    };
  }, [mapRef]);

  return { redraw };
} 