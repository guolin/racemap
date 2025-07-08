import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { ObserverPos } from '@features/mqtt/hooks/useObserversPos';

// 颜色池
const COLORS = ['#ff4d4f', '#40a9ff', '#36cfc9', '#9254de', '#fadb14', '#fa8c16', '#13c2c2'];
const getColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
  return COLORS[hash % COLORS.length];
};

export const ObserversLayer: React.FC<{ observers: ObserverPos[]; map: L.Map | null }> = ({ observers, map }) => {
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }
  }, [map]);

  // 更新位置
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    observers.forEach(o => {
      const circle = L.circleMarker([o.lat, o.lng], {
        radius: 6,
        color: '#000000',       // 边框
        weight: 1,
        fillColor: getColor(o.id),
        fillOpacity: 0.9,
      });
      circle.addTo(layer);
    });
  }, [observers]);

  return null;
}; 