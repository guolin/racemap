import L from 'leaflet';
import { destinationPoint } from '@shared/lib/geo';
import { CoursePlugin } from './CoursePlugin';
import { getCurrentLang } from 'src/locale';
import { createMarkIcon } from '../lib/markIcon';

export interface OptimistTrapezoidParams {
  axis: number;           // 主轴方向 (度)
  distanceNm: number;     // 基础航线距离 (海里)
  startLineM: number;     // 起航线长度 (米)
  interior: number;       // ∠起航线中点1标2标的角度 (度)
  leg2Ratio: number;      // leg2长度倍数
  leg3Ratio: number;      // leg3长度倍数
  mark3GateWidth: number;  // 3标门宽度 (米)
  finishMarkDistance: number; // 终点标距离 (米)
}

const paramSchema = {
  axis: { type: 'number', min: 0, max: 360, step: 5 },
  distanceNm: { type: 'number', min: 0.1, max: 2.0, step: 0.1, decimals: 1 },
  startLineM: { type: 'number', min: 50, max: 300, step: 10 },
  interior: { type: 'number', min: 30, max: 90, step: 5 },
  leg2Ratio: { type: 'number', min: 0.8, max: 1.2, step: 0.1, decimals: 1 },
  leg3Ratio: { type: 'number', min: 0.8, max: 1.2, step: 0.1, decimals: 1 },
  mark3GateWidth: { type: 'number', min: 20, max: 200, step: 10 },
  finishMarkDistance: { type: 'number', min: 20, max: 200, step: 10 },
};

export const optimistTrapezoidPlugin: CoursePlugin<OptimistTrapezoidParams> = {
  id: 'optimistTrapezoid',
  i18n: {
    zh: {
      name: 'OP 梯形航线',
      labels: {
        axis: '主轴方向 (°)',
        distanceNm: '基础航线距离 (海里)',
        startLineM: '起航线长度 (米)',
        interior: 'Interior角度 (°)',
        leg2Ratio: 'Leg2长度倍数',
        leg3Ratio: 'Leg3长度倍数',
        mark3GateWidth: '3标门宽度 (米)',
        finishMarkDistance: '终点标距离 (米)'
      },
      tooltips: {
        origin: '起航船',
        mark1: '标记1',
        mark2: '标记2',
        mark3s: '标记3S',
        mark3p: '标记3P',
        finishMark: '终点标'
      }
    },
    en: {
      name: 'Optimist Trapezoid Course',
      labels: {
        axis: 'Axis (°)',
        distanceNm: 'Base Distance (NM)',
        startLineM: 'Start Line (m)',
        interior: 'Interior Angle (°)',
        leg2Ratio: 'Leg2 Length Ratio',
        leg3Ratio: 'Leg3 Length Ratio',
        mark3GateWidth: 'Mark 3 Gate Width (m)',
        finishMarkDistance: 'Finish Mark Distance (m)'
      },
      tooltips: {
        origin: 'Signal boat',
        mark1: 'Mark 1',
        mark2: 'Mark 2',
        mark3s: 'Mark 3S',
        mark3p: 'Mark 3P',
        finishMark: 'Finish Mark'
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
    mark3GateWidth: 80,
    finishMarkDistance: 50
  },
  draw: (map, origin, params, existing) => {
    const { axis, distanceNm, startLineM, interior, leg2Ratio, leg3Ratio, mark3GateWidth, finishMarkDistance } = params;

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
    const tooltips = optimistTrapezoidPlugin.i18n![lang].tooltips;

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
    
    // 终点标（从2标出发，向航线方向+90度，距离可调）
    const finishMarkDirection = (axis + 90) % 360;
    const finishMark = destinationPoint(mark2[0], mark2[1], finishMarkDirection, finishMarkDistance);

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

    // 终点线（从2标到终点标的虚线）
    const finishLine = L.polyline([mark2, finishMark], {
      color: '#1f77b4',
      weight: 2,
      dashArray: '5, 10'
    });

    // 3S/3P门连线
    const mark3GateLine = L.polyline([mark3s, mark3p], {
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
    
    // 终点标（蓝色）
    const finishMarkMarker = L.marker(finishMark as [number, number], { 
      icon: createMarkIcon('F', { color: '#1f77b4' })
    }).bindTooltip(tooltips.finishMark);

    // 添加到组
    group.addLayer(startLine);
    group.addLayer(leg1);
    group.addLayer(leg2);
    group.addLayer(leg3);
    group.addLayer(finishLine);
    group.addLayer(mark3GateLine);
    group.addLayer(originMarker);
    group.addLayer(leftSideMarker);
    group.addLayer(mark1Marker);
    group.addLayer(mark2Marker);
    group.addLayer(mark3sMarker);
    group.addLayer(mark3pMarker);
    group.addLayer(finishMarkMarker);

    group.addTo(map);
    return group;
  },
};

export default optimistTrapezoidPlugin;
