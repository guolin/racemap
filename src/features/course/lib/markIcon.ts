import L from 'leaflet';

export type MarkShape = 'circle' | 'triangle';

/**
 * 生成自定义样式的标的图标
 * @param label 标的名字（最多2字符）
 * @param options 可选项：颜色、形状、尺寸
 */
export function createMarkIcon(
  label: string,
  options?: {
    color?: string;      // 填充色，默认橙色
    shape?: MarkShape;   // 形状，默认圆形
    size?: number;       // 图标直径，默认24
  }
) {
  const { color = '#FF6A2A', shape = 'circle', size = 24 } = options || {};
  const fontSize = Math.round(size * 0.58);
  let html = '';
  if (shape === 'circle') {
    html = `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;font-weight:bold;color:#fff;box-shadow:0 1px 4px #0002;user-select:none;">${label}</div>`;
  } else if (shape === 'triangle') {
    html = `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;position:relative;">
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="position:absolute;top:0;left:0;"><polygon points="12,2 22,22 2,22" fill="${color}"/></svg>
      <span style="position:relative;z-index:1;font-size:${fontSize}px;font-weight:bold;color:#fff;">${label}</span>
    </div>`;
  }
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
} 