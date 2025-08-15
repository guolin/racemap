'use client';
import { useEffect } from 'react';

// 动态导入leaflet插件
const loadLeafletPlugins = async () => {
  if (typeof window !== 'undefined') {
    await import('leaflet-rotate');
    await import('leaflet-rotatedmarker');
  }
};

interface LeafletMapProps {
  _mapRef: any;
}

export default function LeafletMap({ _mapRef }: LeafletMapProps) {
  useEffect(() => {
    loadLeafletPlugins();
  }, []);

  return null; // 这个组件只负责加载插件
} 