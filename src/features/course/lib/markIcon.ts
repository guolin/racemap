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

/**
 * 生成橙色小旗图标
 * @param size 图标尺寸，默认24
 */
export function createFlagIcon(size: number = 24) {
  const html = `
    <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;position:relative;">
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="position:absolute;top:0;left:0;">
        <!-- 旗杆 -->
        <line x1="12" y1="22" x2="12" y2="4" stroke="#8B4513" stroke-width="1.5" stroke-linecap="round"/>
        <!-- 旗面 -->
        <polygon points="12,4 22,6 22,14 12,12" fill="#FF6A2A" stroke="#E55A1A" stroke-width="0.5"/>
        <!-- 旗面装饰线 -->
        <line x1="14" y1="6" x2="20" y2="8" stroke="#E55A1A" stroke-width="0.5"/>
        <line x1="14" y1="10" x2="20" y2="12" stroke="#E55A1A" stroke-width="0.5"/>
      </svg>
    </div>
  `;
  
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size], // 锚点在旗杆底部
  });
}

/**
 * 生成小船图标（鸟瞰视角，游艇样式）
 * @param size 图标尺寸，默认24
 */
export function createBoatIcon(size: number = 24) {
  const html = `
    <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;position:relative;">
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="position:absolute;top:0;left:0;">
        <!-- 船身主体（椭圆形） -->
        <ellipse cx="12" cy="12" rx="8" ry="4" fill="#4169E1" stroke="#1E3A8A" stroke-width="0.5"/>
        <!-- 船头 -->
        <ellipse cx="20" cy="12" rx="2" ry="2" fill="#4169E1" stroke="#1E3A8A" stroke-width="0.5"/>
        <!-- 船舱 -->
        <ellipse cx="12" cy="12" rx="4" ry="2" fill="#F5F5DC" stroke="#8B4513" stroke-width="0.5"/>
        <!-- 桅杆 -->
        <circle cx="12" cy="12" r="0.5" fill="#8B4513"/>
        <!-- 帆（三角形） -->
        <polygon points="12,12 20,8 20,16" fill="#FFFFFF" stroke="#D2B48C" stroke-width="0.3"/>
        <!-- 帆装饰线 -->
        <line x1="14" y1="10" x2="18" y2="9" stroke="#D2B48C" stroke-width="0.2"/>
        <line x1="14" y1="12" x2="18" y2="11" stroke="#D2B48C" stroke-width="0.2"/>
        <line x1="14" y1="14" x2="18" y2="13" stroke="#D2B48C" stroke-width="0.2"/>
      </svg>
    </div>
  `;
  
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
} 