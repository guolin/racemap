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
export function createFlagIcon(size: number = 30) {
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
 * @param options 自定义尺寸和配色
 */
export function createBoatIcon(
  options?: {
    height?: number;
    hullColor?: string;
    deckColor?: string;
    cabinColor?: string;
    outlineColor?: string;
    accentColor?: string;
  }
) {
  const {
    height = 32,
    hullColor = '#FF6A2A',
    deckColor = '#FDBA74',
    cabinColor = '#FFF7ED',
    outlineColor = '#B45309',
    accentColor = '#9A3412',
  } = options || {};

  const width = Math.max(22, Math.round(height * 0.5));
  const html = `
    <div style="width:${width}px;height:${height}px;display:flex;align-items:center;justify-content:center;">
      <svg width="${width}" height="${height}" viewBox="0 0 60 120" preserveAspectRatio="xMidYMid meet">
        <!-- 船体轮廓 -->
        <path d="M30 3 C40 7 48 18 50 32 L50 78 L43 78 L43 92 L17 92 L17 78 L10 78 L10 32 C12 18 20 7 30 3 Z" fill="${hullColor}" stroke="${outlineColor}" stroke-width="4" stroke-linejoin="round" />
        <!-- 甲板 -->
        <path d="M30 12 C36 16 40 26 40 36 L40 70 L20 70 L20 36 C20 26 24 16 30 12 Z" fill="${deckColor}" stroke="${outlineColor}" stroke-width="2" stroke-linejoin="round" />
        <!-- 驾驶舱 -->
        <path d="M30 34 C35 40 36 50 34 58 L26 58 C24 50 25 40 30 34 Z" fill="${cabinColor}" stroke="${outlineColor}" stroke-width="2" stroke-linejoin="round" />
        <!-- 观察窗 -->
        <path d="M21 44 Q30 40 39 44" fill="none" stroke="${outlineColor}" stroke-width="3" stroke-linecap="round" />
        <line x1="22" y1="52" x2="28" y2="52" stroke="${outlineColor}" stroke-width="3" stroke-linecap="round" />
        <line x1="32" y1="52" x2="38" y2="52" stroke="${outlineColor}" stroke-width="3" stroke-linecap="round" />
        <!-- 船尾发动机 -->
        <rect x="24" y="92" width="12" height="12" rx="3" fill="${accentColor}" stroke="${outlineColor}" stroke-width="2" />
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'course-boat-icon',
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
  });
}
