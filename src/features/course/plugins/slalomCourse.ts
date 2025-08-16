import L from 'leaflet';
import { destinationPoint } from '@shared/lib/geo';
import { CoursePlugin } from './CoursePlugin';
import { getCurrentLang } from 'src/locale';
import { createMarkIcon, createBoatIcon } from '../lib/markIcon';

export interface SlalomCourseParams {
  axis: number;           // 航线方向 (度)
  distanceNm: number;     // 基础航线距离 (海里)
  startLineM: number;     // 起航线长度 (米)
  direction: 'PD' | 'SD'; // 启航方向选择
  leg2Ratio: number;      // Leg2长度比例
  finishDistance: number; // 2标到终点标距离 (米)
  mark3Offset: number;    // 3标偏移距离比例
  finishLineLength: number; // 终点线长度 (米)
}

const paramSchema = {
  axis: { type: 'number', min: 0, max: 360, step: 5 },
  distanceNm: { type: 'number', min: 0.1, max: 2.0, step: 0.1, decimals: 1 },
  startLineM: { type: 'number', min: 20, max: 100, step: 10 },
  direction: { type: 'select', options: ['PD', 'SD'] },
  leg2Ratio: { type: 'number', min: 0.5, max: 1.5, step: 0.1, decimals: 1 },
  finishDistance: { type: 'number', min: 100, max: 500, step: 50 },
  mark3Offset: { type: 'number', min: 0.5, max: 2.0, step: 0.1, decimals: 1 },
  finishLineLength: { type: 'number', min: 20, max: 100, step: 10 },
};

export const slalomCoursePlugin: CoursePlugin<SlalomCourseParams> = {
  id: 'slalomCourse',
  i18n: {
    zh: {
      name: 'SLALOM Course障碍航线',
      labels: {
        axis: '航线方向 (°)',
        distanceNm: '基础航线距离 (海里)',
        startLineM: '起航线长度 (米)',
        direction: '启航方向',
        leg2Ratio: 'Leg2长度比例',
        finishDistance: '终点距离 (米)',
        mark3Offset: '3标偏移比例',
        finishLineLength: '终点线长度 (米)'
      },
      tooltips: {
        origin: '信号船',
        startMark: '起航标',
        mark1: '标记1',
        mark2: '标记2',
        mark3: '标记3',
        finishLeft: '终点线左端',
        finishRight: '终点线右端'
      }
    },
    en: {
      name: 'SLALOM Course',
      labels: {
        axis: 'Course Axis (°)',
        distanceNm: 'Base Distance (NM)',
        startLineM: 'Start Line Length (m)',
        direction: 'Start Direction',
        leg2Ratio: 'Leg2 Length Ratio',
        finishDistance: 'Finish Distance (m)',
        mark3Offset: 'Mark 3 Offset Ratio',
        finishLineLength: 'Finish Line Length (m)'
      },
      tooltips: {
        origin: 'Signal boat',
        startMark: 'Start mark',
        mark1: 'Mark 1',
        mark2: 'Mark 2',
        mark3: 'Mark 3',
        finishLeft: 'Finish line left',
        finishRight: 'Finish line right'
      }
    }
  },
  paramSchema,
  defaultParams: {
    axis: 180,
    distanceNm: 0.5,
    startLineM: 30,
    direction: 'PD',
    leg2Ratio: 1.0,
    finishDistance: 200,
    mark3Offset: 1.0,
    finishLineLength: 30
  },
  draw: (map, origin, params, existing) => {
    const { axis, distanceNm, startLineM, direction, leg2Ratio, finishDistance, mark3Offset, finishLineLength } = params;

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
    const tooltips = slalomCoursePlugin.i18n![lang].tooltips;

    // 计算各标记位置
    // 1. 起航标位置：从信号船沿航线方向+180°
    const startMark = destinationPoint(origin.lat, origin.lng, (axis + 180) % 360, startLineM);
    
    // 2. 起航线中点
    const startMidLat = (origin.lat + startMark[0]) / 2;
    const startMidLng = (origin.lng + startMark[1]) / 2;
    
    // 3. 1标位置：根据PD/SD方向确定  
    const mark1Direction = direction === 'SD' ? (axis + 90) % 360 : (axis - 90 + 360) % 360;
    const mark1 = destinationPoint(startMidLat, startMidLng, mark1Direction, distanceNm * 1852);
    
    // 4. 2标位置：从1标沿axis方向
    const mark2 = destinationPoint(mark1[0], mark1[1], axis, distanceNm * leg2Ratio * 1852);
    
    // 5. 终点标位置：从2标沿axis方向
    const finishMark = destinationPoint(mark2[0], mark2[1], axis, finishDistance);
    
    // 6. 3标位置：2标-终点标连线中点，然后偏移
    const mark23MidLat = (mark2[0] + finishMark[0]) / 2;
    const mark23MidLng = (mark2[1] + finishMark[1]) / 2;
    const mark3Direction = direction === 'SD' ? 270 : 90;
    const mark3 = destinationPoint(mark23MidLat, mark23MidLng, mark3Direction, distanceNm * mark3Offset * 1852);
    
    // 7. 终点线端点：沿航线方向
    const finishLineDirection = axis; // 沿航线方向
    const finishLeft = destinationPoint(finishMark[0], finishMark[1], finishLineDirection, finishLineLength / 2);
    const finishRight = destinationPoint(finishMark[0], finishMark[1], (finishLineDirection + 180) % 360, finishLineLength / 2);

    // 绘制线条
    const startLine = L.polyline([origin, startMark], {
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

    const leg3 = L.polyline([mark2, mark3], {
      color: '#1f77b4',
      weight: 3,
    });

    const leg4 = L.polyline([mark3, finishMark], {
      color: '#1f77b4',
      weight: 3,
    });

    const finishLine = L.polyline([finishLeft, finishRight], {
      color: '#1f77b4',
      weight: 4,
    });

    // 创建标记
    const originMarker = L.marker(origin, { icon: createMarkIcon('S') })
      .bindTooltip(tooltips.origin);
    const startMarkMarker = L.marker(startMark as [number, number], { icon: createMarkIcon('ST') })
      .bindTooltip(tooltips.startMark);
    const mark1Marker = L.marker(mark1 as [number, number], { icon: createMarkIcon('1') })
      .bindTooltip(tooltips.mark1);
    const mark2Marker = L.marker(mark2 as [number, number], { icon: createMarkIcon('2') })
      .bindTooltip(tooltips.mark2);
    const mark3Marker = L.marker(mark3 as [number, number], { icon: createMarkIcon('3') })
      .bindTooltip(tooltips.mark3);
    const finishLeftMarker = L.marker(finishLeft as [number, number], { icon: createMarkIcon('FL') })
      .bindTooltip(tooltips.finishLeft);
    const finishRightMarker = L.marker(finishRight as [number, number], { icon: createBoatIcon() })
      .bindTooltip(tooltips.finishRight);

    // 添加到组
    group.addLayer(startLine);
    group.addLayer(leg1);
    group.addLayer(leg2);
    group.addLayer(leg3);
    group.addLayer(leg4);
    group.addLayer(finishLine);
    group.addLayer(originMarker);
    group.addLayer(startMarkMarker);
    group.addLayer(mark1Marker);
    group.addLayer(mark2Marker);
    group.addLayer(mark3Marker);
    group.addLayer(finishLeftMarker);
    group.addLayer(finishRightMarker);

    group.addTo(map);
    return group;
  },
};

export default slalomCoursePlugin;