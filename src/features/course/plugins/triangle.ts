import L from 'leaflet';
import { destinationPoint } from '@shared/lib/geo';
import { CoursePlugin } from './CoursePlugin';
import { getCurrentLang } from 'src/locale';
import { createMarkIcon } from '../lib/markIcon';

export interface TriangleParams {
  sideLength: number;         // 边长 (海里)
  startLineLength: number;    // 起航线长度 (米)
  triangleType: 'equilateral' | 'windward-reaching';  // 三角形类型
  windwardAngle: number;      // 上风角度 (度)
  laps: number;              // 圈数
  direction: 'port' | 'starboard';  // 绕行方向
  finishType: 'windward' | 'leeward' | 'reaching';  // 终点位置
}

const paramSchema = {
  sideLength: { type: 'number', min: 0.3, max: 3.0, step: 0.1, decimals: 1 },
  startLineLength: { type: 'number', min: 50, max: 300, step: 10 },
  triangleType: { type: 'select', options: ['equilateral', 'windward-reaching'] },
  windwardAngle: { type: 'number', min: -30, max: 30, step: 5 },
  laps: { type: 'number', min: 1, max: 3, step: 1 },
  direction: { type: 'select', options: ['port', 'starboard'] },
  finishType: { type: 'select', options: ['windward', 'leeward', 'reaching'] },
};

export const trianglePlugin: CoursePlugin<TriangleParams> = {
  id: 'triangle',
  i18n: {
    zh: {
      name: '三角形航线',
      labels: {
        sideLength: '边长 (海里)',
        startLineLength: '起航线长度 (米)',
        triangleType: '三角形类型',
        windwardAngle: '上风角度 (度)',
        laps: '圈数',
        direction: '绕行方向',
        finishType: '终点位置'
      },
      tooltips: {
        committeeBoot: '委员会船',
        startMark: '起航标记',
        windwardMark: '上风标记 (1)',
        reachingMarkA: '横风标记 A (2)',
        reachingMarkB: '横风标记 B (3)'
      }
    },
    en: {
      name: 'Triangle Course',
      labels: {
        sideLength: 'Side Length (NM)',
        startLineLength: 'Start Line Length (m)',
        triangleType: 'Triangle Type',
        windwardAngle: 'Windward Angle (°)',
        laps: 'Number of Laps',
        direction: 'Rounding Direction',
        finishType: 'Finish Location'
      },
      tooltips: {
        committeeBoot: 'Committee Boat',
        startMark: 'Start Mark',
        windwardMark: 'Windward Mark (1)',
        reachingMarkA: 'Reaching Mark A (2)',
        reachingMarkB: 'Reaching Mark B (3)'
      }
    }
  },
  paramSchema,
  defaultParams: {
    sideLength: 1.0,
    startLineLength: 150,
    triangleType: 'equilateral',
    windwardAngle: 0,
    laps: 1,
    direction: 'port',
    finishType: 'windward',
  },
  draw: (
    map: L.Map,
    origin: L.LatLng,
    params: TriangleParams,
    existing?: L.FeatureGroup | null
  ): L.FeatureGroup => {
    const { sideLength, startLineLength, triangleType, windwardAngle, direction } = params;

    if (existing) {
      map.removeLayer(existing);
    }

    const group = L.featureGroup();

    // 起航标记（start mark）位于 origin 左侧
    const startMark = destinationPoint(
      origin.lat,
      origin.lng,
      270, // 左侧
      startLineLength
    );

    // 计算起航线中点
    const startLineMidLat = (origin.lat + startMark[0]) / 2;
    const startLineMidLng = (origin.lng + startMark[1]) / 2;

    // 上风标记（windward mark）
    const windwardMarkAngle = windwardAngle; // 可调整的上风角度
    const windwardMark = destinationPoint(
      startLineMidLat,
      startLineMidLng,
      windwardMarkAngle,
      sideLength * 1852
    );

    let reachingMarkA: [number, number];
    let reachingMarkB: [number, number];

    if (triangleType === 'equilateral') {
      // 等边三角形：每个角60度
      reachingMarkA = destinationPoint(
        windwardMark[0],
        windwardMark[1],
        windwardMarkAngle + (direction === 'port' ? -120 : 120),
        sideLength * 1852
      );
      
      reachingMarkB = destinationPoint(
        reachingMarkA[0],
        reachingMarkA[1],
        windwardMarkAngle + (direction === 'port' ? -240 : 240),
        sideLength * 1852
      );
    } else {
      // 上风-横风三角形
      reachingMarkA = destinationPoint(
        windwardMark[0],
        windwardMark[1],
        windwardMarkAngle + (direction === 'port' ? -90 : 90),
        sideLength * 1852
      );
      
      reachingMarkB = destinationPoint(
        startLineMidLat,
        startLineMidLng,
        windwardMarkAngle + (direction === 'port' ? -90 : 90),
        sideLength * 1852 * 0.8
      );
    }

    // 起航线
    const startLine = L.polyline([origin, startMark], {
      color: '#ff7f0e',
      weight: 4,
    });

    // 三角形航线
    const coursePath = [
      [startLineMidLat, startLineMidLng],
      windwardMark,
      reachingMarkA,
      reachingMarkB,
      [startLineMidLat, startLineMidLng]
    ];

    const courseLine = L.polyline(coursePath, { 
      color: '#1f77b4', 
      weight: 3,
      dashArray: '5, 10'
    });

    // 方向箭头（在航线中点添加箭头标记）
    const arrowPoints: L.LatLng[] = [];
    for (let i = 0; i < coursePath.length - 1; i++) {
      const start = coursePath[i];
      const end = coursePath[i + 1];
      const midLat = (start[0] + end[0]) / 2;
      const midLng = (start[1] + end[1]) / 2;
      arrowPoints.push(L.latLng(midLat, midLng));
    }

    const lang = getCurrentLang();
    const tooltips = trianglePlugin.i18n![lang].tooltips;

    // 标记
    const committeeBootMarker = L.marker(origin, { 
      icon: createMarkIcon('CB') 
    }).bindTooltip(tooltips.committeeBoot);
    
    const startMarkMarker = L.marker(startMark as [number, number], { 
      icon: createMarkIcon('S') 
    }).bindTooltip(tooltips.startMark);
    
    const windwardMarkMarker = L.marker(windwardMark as [number, number], { 
      icon: createMarkIcon('1') 
    }).bindTooltip(tooltips.windwardMark);
    
    const reachingMarkAMarker = L.marker(reachingMarkA as [number, number], { 
      icon: createMarkIcon('2') 
    }).bindTooltip(tooltips.reachingMarkA);
    
    const reachingMarkBMarker = L.marker(reachingMarkB as [number, number], { 
      icon: createMarkIcon('3') 
    }).bindTooltip(tooltips.reachingMarkB);

    // 方向指示箭头
    arrowPoints.forEach((point, index) => {
      const arrowMarker = L.marker(point, {
        icon: L.divIcon({
          html: direction === 'port' ? '↺' : '↻',
          className: 'triangle-direction-arrow',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      });
      group.addLayer(arrowMarker);
    });

    // 添加所有图层
    group.addLayer(startLine);
    group.addLayer(courseLine);
    group.addLayer(committeeBootMarker);
    group.addLayer(startMarkMarker);
    group.addLayer(windwardMarkMarker);
    group.addLayer(reachingMarkAMarker);
    group.addLayer(reachingMarkBMarker);

    group.addTo(map);
    return group;
  },
};

export default trianglePlugin;