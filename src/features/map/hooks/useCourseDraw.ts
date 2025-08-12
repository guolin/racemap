import { useMapRenderer } from './useMapRenderer';

/**
 * @deprecated 使用新的useMapRenderer替代
 * 为了向后兼容暂时保留，但建议迁移到新架构
 */
export function useCourseDraw(mapRef: React.RefObject<L.Map | null>) {
  const { drawCourse } = useMapRenderer(mapRef);
  
  // 向后兼容的接口
  return { 
    redraw: drawCourse 
  };
} 