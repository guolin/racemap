import L from 'leaflet';
import { destinationPoint } from '@shared/lib/geo';
import { CoursePlugin } from './CoursePlugin';
import { getCurrentLang } from 'src/locale';
import { createMarkIcon } from '../lib/markIcon';

export interface IOTrapezoidParams {
  axis: number;           // 主轴方向 (度)
  windwardDistance: number; // 迎风段距离 (海里)
  reachLength: number;     // 到达段长度 (海里)
  reachAngle: number;      // 到达段角度 (度，相对于风向)
  startLineM: number;      // 起航线长度 (米)
  courseType: 'inner' | 'outer'; // 内圈或外圈
  gateWidth: number;       // 门宽度 (米)
}

const paramSchema = {
  axis: { type: 'number', min: 0, max: 360, step: 5 },
  windwardDistance: { type: 'number', min: 0.1, max: 2.0, step: 0.1, decimals: 1 },
  reachLength: { type: 'number', min: 0.1, max: 1.5, step: 0.1, decimals: 1 },
  reachAngle: { type: 'number', min: 45, max: 120, step: 5 },
  startLineM: { type: 'number', min: 50, max: 300, step: 10 },
  courseType: { type: 'select', options: ['inner', 'outer'] },
  gateWidth: { type: 'number', min: 20, max: 200, step: 10 },
};

export const ioTrapezoidPlugin: CoursePlugin<IOTrapezoidParams> = {
  id: 'ioTrapezoid',
  i18n: {
    zh: {
      name: 'IO梯形航线（内外圈）',
      labels: {
        axis: '主轴方向 (°)',
        windwardDistance: '迎风段距离 (海里)',
        reachLength: '到达段长度 (海里)',
        reachAngle: '到达段角度 (°)',
        startLineM: '起航线长度 (米)',
        courseType: '航线类型',
        gateWidth: '门宽度 (米)'
      },
      tooltips: {
        origin: '信号船',
        mark1: '标记1',
        mark2: '标记2',
        mark3s: '标记3S',
        mark3p: '标记3P',
        mark4: '标记4'
      }
    },
    en: {
      name: 'IO Trapezoid Course (Inner/Outer)',
      labels: {
        axis: 'Axis (°)',
        windwardDistance: 'Windward Distance (NM)',
        reachLength: 'Reach Length (NM)',
        reachAngle: 'Reach Angle (°)',
        startLineM: 'Start Line (m)',
        courseType: 'Course Type',
        gateWidth: 'Gate Width (m)'
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
    windwardDistance: 1.0,
    reachLength: 0.6,
    reachAngle: 60,
    startLineM: 100,
    courseType: 'outer',
    gateWidth: 50
  },
  draw: (map, origin, params, existing) => {
    const { axis, windwardDistance, reachLength, reachAngle, startLineM, courseType, gateWidth } = params;

    if (existing) {
      map.removeLayer(existing);
    }

    const group = L.featureGroup();
    const lang = getCurrentLang();
    const tooltips = ioTrapezoidPlugin.i18n![lang].tooltips;

    // 计算各标记位置
    // 标记4（参考点，在起航船左侧）
    const mark4 = destinationPoint(origin.lat, origin.lng, (axis + 270) % 360, startLineM);
    
    // 起航线中点
    const startMidLat = (origin.lat + mark4[0]) / 2;
    const startMidLng = (origin.lng + mark4[1]) / 2;
    
    // 标记1（上风标）
    const mark1 = destinationPoint(startMidLat, startMidLng, axis, windwardDistance * 1852);
    
    // 标记2（到达标）- 根据内外圈调整位置
    const reachDirection = courseType === 'outer' ? 
      (axis + reachAngle) % 360 : 
      (axis - reachAngle + 360) % 360;
    const mark2 = destinationPoint(mark1[0], mark1[1], reachDirection, reachLength * 1852);
    
    // 标记3门（下风门）- 创建3S和3P
    const mark3Center = destinationPoint(mark2[0], mark2[1], (axis + 180) % 360, windwardDistance * 1852);
    const mark3s = destinationPoint(mark3Center[0], mark3Center[1], (axis + 90) % 360, gateWidth / 2);
    const mark3p = destinationPoint(mark3Center[0], mark3Center[1], (axis + 270) % 360, gateWidth / 2);

    // 绘制线条
    const startLine = L.polyline([origin, mark4], {
      color: '#ff7f0e',
      weight: 3,
    });

    const windwardLeg = L.polyline([[startMidLat, startMidLng], mark1], {
      color: '#1f77b4',
      weight: 3,
    });

    const reachLeg = L.polyline([mark1, mark2], {
      color: '#2ca02c',
      weight: 3,
    });

    const leewardLeg = L.polyline([mark2, mark3Center], {
      color: '#1f77b4',
      weight: 3,
    });

    // 3S/3P门连线
    const gateLine = L.polyline([mark3s, mark3p], {
      color: '#9467bd',
      weight: 2,
      dashArray: '5, 5'
    });

    const finishLeg = L.polyline([mark3Center, mark4], {
      color: '#d62728',
      weight: 3,
    });

    // 创建标记
    const originMarker = L.marker(origin, { icon: createMarkIcon('S') })
      .bindTooltip(tooltips.origin);
    const mark4Marker = L.marker(mark4 as [number, number], { icon: createMarkIcon('4') })
      .bindTooltip(tooltips.mark4);
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
    group.addLayer(windwardLeg);
    group.addLayer(reachLeg);
    group.addLayer(leewardLeg);
    group.addLayer(gateLine);
    group.addLayer(finishLeg);
    group.addLayer(originMarker);
    group.addLayer(mark4Marker);
    group.addLayer(mark1Marker);
    group.addLayer(mark2Marker);
    group.addLayer(mark3sMarker);
    group.addLayer(mark3pMarker);

    group.addTo(map);
    return group;
  },
};

export default ioTrapezoidPlugin;