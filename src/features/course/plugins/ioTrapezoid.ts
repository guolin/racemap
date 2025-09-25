import L from 'leaflet';
import { destinationPoint } from '@shared/lib/geo';
import { CoursePlugin } from './CoursePlugin';
import { getCurrentLang } from 'src/locale';
import { createMarkIcon } from '../lib/markIcon';

export interface IOTrapezoidParams {
  axis: number;           // 主轴方向 (度)
  distanceNm: number;     // 基础航线距离 (海里)
  startLineM: number;     // 起航线长度 (米)
  interior: number;       // ∠起航线中点1标2标的角度 (度)
  leg2Ratio: number;      // leg2长度倍数
  leg3Ratio: number;      // leg3长度倍数
  mark4DistanceNm: number; // 4标距起航线中点的距离 (海里)
  mark3GateWidth: number;  // 3标门宽度 (米)
  mark4GateWidth: number;  // 4标门宽度 (米)
  showMark4: boolean;     // 是否显示4标相关内容
}

const paramSchema = {
  axis: { type: 'number', min: 0, max: 360, step: 5 },
  distanceNm: { type: 'number', min: 0.1, max: 2.0, step: 0.1, decimals: 1 },
  startLineM: { type: 'number', min: 50, max: 300, step: 10 },
  interior: { type: 'number', min: 30, max: 90, step: 5 },
  leg2Ratio: { type: 'number', min: 0.8, max: 1.2, step: 0.1, decimals: 1 },
  leg3Ratio: { type: 'number', min: 0.8, max: 1.2, step: 0.1, decimals: 1 },
  mark3GateWidth: { type: 'number', min: 20, max: 200, step: 10 },
  showMark4: { type: 'boolean' },
  mark4DistanceNm: { type: 'number', min: 0.01, max: 0.1, step: 0.01, decimals: 2 },
  mark4GateWidth: { type: 'number', min: 20, max: 200, step: 10 },
};

export const ioTrapezoidPlugin: CoursePlugin<IOTrapezoidParams> = {
  id: 'ioTrapezoid',
  i18n: {
    zh: {
      name: 'Trapezoid梯形航线',
      labels: {
        axis: '主轴方向 (°)',
        distanceNm: '基础航线距离 (海里)',
        startLineM: '起航线长度 (米)',
        interior: 'Interior角度 (°)',
        leg2Ratio: 'Leg2长度倍数',
        leg3Ratio: 'Leg3长度倍数',
        mark4DistanceNm: '4标距离 (海里)',
        mark3GateWidth: '3标门宽度 (米)',
        mark4GateWidth: '4标门宽度 (米)',
        showMark4: '显示4标'
      },
      tooltips: {
        origin: '起航船',
        mark1: '标记1',
        mark2: '标记2',
        mark3s: '标记3S',
        mark3p: '标记3P',
        mark4: '标记4'
      }
    },
    en: {
      name: 'Trapezoid Course',
      labels: {
        axis: 'Axis (°)',
        distanceNm: 'Base Distance (NM)',
        startLineM: 'Start Line (m)',
        interior: 'Interior Angle (°)',
        leg2Ratio: 'Leg2 Length Ratio',
        leg3Ratio: 'Leg3 Length Ratio',
        mark4DistanceNm: 'Mark 4 Distance (NM)',
        mark3GateWidth: 'Mark 3 Gate Width (m)',
        mark4GateWidth: 'Mark 4 Gate Width (m)',
        showMark4: 'Show Mark 4'
      },
      tooltips: {
        origin: 'Signal boat',
        mark1: 'Mark 1',
        mark2: 'Mark 2',
        mark3s: 'Mark 3S',
        mark3p: 'Mark 3P',
        mark4: 'Mark 4'
      }
    }
  },
  paramSchema,
  defaultParams: {
    axis: 45,
    distanceNm: 1.0,
    startLineM: 100,
    interior: 60,
    leg2Ratio: 1.0,
    leg3Ratio: 1.0,
    mark4DistanceNm: 0.02,
    mark3GateWidth: 80,
    mark4GateWidth: 60,
    showMark4: false
  },
  draw: (map, origin, params, existing) => {
    const { axis, distanceNm, startLineM, interior, leg2Ratio, leg3Ratio, mark4DistanceNm, mark3GateWidth, mark4GateWidth, showMark4 } = params;

    // 参数验证
    if (!origin || isNaN(origin.lat) || isNaN(origin.lng)) {
      console.error('Invalid origin:', origin);
      return L.featureGroup();
    }
    
    if (isNaN(axis) || isNaN(distanceNm) || isNaN(startLineM)) {
      console.error('Invalid params:', { axis, distanceNm, startLineM });
      return L.featureGroup();
    }

    if (existing) {
      map.removeLayer(existing);
    }

    const group = L.featureGroup();
    const lang = getCurrentLang();
    const tooltips = ioTrapezoidPlugin.i18n![lang].tooltips;

    // 计算各标记位置
    // 左侧（垂直于主轴方向的左侧位置）
    const leftSide = destinationPoint(origin.lat, origin.lng, (axis + 270) % 360, startLineM);
    
    // 起航线中点
    const startMidLat = (origin.lat + leftSide[0]) / 2;
    const startMidLng = (origin.lng + leftSide[1]) / 2;
    
    // 调试输出
    console.log('Debug info:', {
      origin: [origin.lat, origin.lng],
      leftSide,
      startMid: [startMidLat, startMidLng],
      axis,
      distanceNm
    });
    
    // 1标（迎风标）
    const mark1 = destinationPoint(startMidLat, startMidLng, axis, distanceNm * 1852);
    
    // 2标（横风标）- 从1标出发，沿1标到起航线中点方向顺时针旋转interior度数
    const mark2Direction = (axis + 180 + interior) % 360;
    const mark2Distance = distanceNm * leg2Ratio * 1852;
    const mark2 = destinationPoint(mark1[0], mark1[1], mark2Direction, mark2Distance);
    
    // 3标（3S-3P连线中点）
    const mark3Distance = distanceNm * leg3Ratio * 1852;
    const mark3Center = destinationPoint(mark2[0], mark2[1], (axis + 180) % 360, mark3Distance);
    const mark3s = destinationPoint(mark3Center[0], mark3Center[1], (axis + 270) % 360, mark3GateWidth / 2);
    const mark3p = destinationPoint(mark3Center[0], mark3Center[1], (axis + 90) % 360, mark3GateWidth / 2);
    
    // 4标（在起航线中点到1标连线上）
    const mark4Distance = mark4DistanceNm * 1852;
    const mark4 = destinationPoint(startMidLat, startMidLng, axis, mark4Distance);
    const mark4s = destinationPoint(mark4[0], mark4[1], (axis + 270) % 360, mark4GateWidth / 2);
    const mark4p = destinationPoint(mark4[0], mark4[1], (axis + 90) % 360, mark4GateWidth / 2);

    // 绘制线条
    const startLine = L.polyline([origin, leftSide], {
      color: '#ff7f0e',
      weight: 3,
    });

    const leg1 = L.polyline([[startMidLat, startMidLng], mark1], {
      color: '#1f77b4',
      weight: 3,
    });

    const leg2 = L.polyline([mark1, mark2], {
      color: '#1f77b4',
      weight: 3,
    });

    const leg3 = L.polyline([mark2, mark3Center], {
      color: '#1f77b4',
      weight: 3,
    });

    // leg4 从3标到4标的连线已移除（不显示）

    // 3S/3P门连线
    const mark3GateLine = L.polyline([mark3s, mark3p], {
      color: '#9467bd',
      weight: 2,
      dashArray: '5, 5'
    });

    // 4S/4P门连线
    const mark4GateLine = L.polyline([mark4s, mark4p], {
      color: '#9467bd',
      weight: 2,
      dashArray: '5, 5'
    });

    // 创建标记
    const originMarker = L.marker(origin, { icon: createMarkIcon('S') })
      .bindTooltip(tooltips.origin);
    const leftSideMarker = L.marker(leftSide as [number, number], { icon: createMarkIcon('L') })
      .bindTooltip('左侧');
    const mark1Marker = L.marker(mark1 as [number, number], { icon: createMarkIcon('1') })
      .bindTooltip(tooltips.mark1);
    const mark2Marker = L.marker(mark2 as [number, number], { icon: createMarkIcon('2') })
      .bindTooltip(tooltips.mark2);
    const mark3sMarker = L.marker(mark3s as [number, number], { icon: createMarkIcon('3S') })
      .bindTooltip(tooltips.mark3s);
    const mark3pMarker = L.marker(mark3p as [number, number], { icon: createMarkIcon('3P') })
      .bindTooltip(tooltips.mark3p);
    // 添加到组
    group.addLayer(startLine);
    group.addLayer(leg1);
    group.addLayer(leg2);
    group.addLayer(leg3);
    group.addLayer(mark3GateLine);
    group.addLayer(originMarker);
    group.addLayer(leftSideMarker);
    group.addLayer(mark1Marker);
    group.addLayer(mark2Marker);
    group.addLayer(mark3sMarker);
    group.addLayer(mark3pMarker);

    // 根据开关显示4标相关内容
    if (showMark4) {
      const mark4sMarker = L.marker(mark4s as [number, number], { icon: createMarkIcon('4S') })
        .bindTooltip('标记4S');
      const mark4pMarker = L.marker(mark4p as [number, number], { icon: createMarkIcon('4P') })
        .bindTooltip('标记4P');
      
      group.addLayer(mark4GateLine);
      group.addLayer(mark4sMarker);
      group.addLayer(mark4pMarker);
    }

    group.addTo(map);
    return group;
  },
};

export default ioTrapezoidPlugin;
