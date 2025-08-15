import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface ObserverPos {
  id: string;
  lat: number;
  lng: number;
  heading: number | null;
  ts: number;
}

interface Props {
  observers: ObserverPos[];
  map: L.Map | null;
}

export const ObserversLayer: React.FC<Props> = ({ observers, map }) => {
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }
  }, [map]);

  // 更新位置：只在观察者数据真正变化时才更新
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    layer.clearLayers();
    observers.forEach(o => {
      const size = 12;
      const color = getColor(o.id);
      const iconHtml = `<div style="width:${size}px;height:${size}px;border-radius:50%;background-color:${color};"></div>`;
      
      const marker = L.marker([o.lat, o.lng], {
        icon: L.divIcon({
          html: iconHtml,
          className: 'observer-marker',
          iconSize: [size, size],
          iconAnchor: [size/2, size/2],
        }),
        zIndexOffset: 1000, // 设置高层级，确保显示在最上层
      } as any);

      marker.addTo(layer);
    });
  }, [observers]);

  const getColor = (id: string) => {
    // 简单的颜色生成逻辑
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  return null;
}; 