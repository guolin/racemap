import L from 'leaflet';
import { destinationPoint } from '@shared/lib/geo';
import { CoursePlugin } from './CoursePlugin';
import { getCurrentLang } from 'src/locale';
import { createMarkIcon } from '../lib/markIcon';

export interface WindwardLeewardParams {
  windwardDistance: number;    // 上风距离 (海里)
  startLineLength: number;     // 起航线长度 (米)
  gateWidth: number;          // 下风门宽度 (米)
  laps: number;               // 圈数
  finishType: 'windward' | 'leeward';  // 终点位置
  offsetMark: boolean;        // 是否使用偏移标记
  offsetDistance: number;     // 偏移距离 (米)
}

const paramSchema = {
  windwardDistance: { type: 'number', min: 0.1, max: 5.0, step: 0.1, decimals: 1 },
  startLineLength: { type: 'number', min: 50, max: 500, step: 10 },
  gateWidth: { type: 'number', min: 50, max: 200, step: 10 },
  laps: { type: 'number', min: 1, max: 5, step: 1 },
  finishType: { type: 'select', options: ['windward', 'leeward'] },
  offsetMark: { type: 'boolean' },
  offsetDistance: { type: 'number', min: 20, max: 100, step: 10 },
};

export const windwardLeewardPlugin: CoursePlugin<WindwardLeewardParams> = {
  id: 'windwardLeeward',
  i18n: {
    zh: {
      name: '迎尾风航线 (W/L)',
      labels: {
        windwardDistance: '上风距离 (海里)',
        startLineLength: '起航线长度 (米)',
        gateWidth: '下风门宽度 (米)',
        laps: '圈数',
        finishType: '终点位置',
        offsetMark: '使用偏移标记',
        offsetDistance: '偏移距离 (米)'
      },
      tooltips: {
        committeeBoot: '委员会船',
        startMark: '起航标记',
        windwardMark: '上风标记',
        offsetMark: '偏移标记',
        leewardGateA: '下风门 A',
        leewardGateB: '下风门 B'
      }
    },
    en: {
      name: 'Windward-Leeward Course',
      labels: {
        windwardDistance: 'Windward Distance (NM)',
        startLineLength: 'Start Line Length (m)',
        gateWidth: 'Leeward Gate Width (m)',
        laps: 'Number of Laps',
        finishType: 'Finish Location',
        offsetMark: 'Use Offset Mark',
        offsetDistance: 'Offset Distance (m)'
      },
      tooltips: {
        committeeBoot: 'Committee Boat',
        startMark: 'Start Mark',
        windwardMark: 'Windward Mark',
        offsetMark: 'Offset Mark',
        leewardGateA: 'Leeward Gate A',
        leewardGateB: 'Leeward Gate B'
      }
    }
  },
  paramSchema,
  defaultParams: {
    windwardDistance: 1.0,
    startLineLength: 150,
    gateWidth: 100,
    laps: 2,
    finishType: 'windward',
    offsetMark: true,
    offsetDistance: 50,
  },
  draw: (
    map: L.Map,
    origin: L.LatLng,
    params: WindwardLeewardParams,
    existing?: L.FeatureGroup | null
  ): L.FeatureGroup => {
    const { windwardDistance, startLineLength, gateWidth, offsetMark, offsetDistance } = params;

    if (existing) {
      map.removeLayer(existing);
    }

    const group = L.featureGroup();

    // 起航标记（start mark）位于 origin 左侧 90° 的方向，距离为 startLineLength
    const startMark = destinationPoint(
      origin.lat,
      origin.lng,
      270, // 左侧
      startLineLength
    );

    // 计算起航线中点
    const startLineMidLat = (origin.lat + startMark[0]) / 2;
    const startLineMidLng = (origin.lng + startMark[1]) / 2;

    // 上风标记（windward mark）位于起航线中点正北方向
    const windwardMark = destinationPoint(
      startLineMidLat, 
      startLineMidLng, 
      0, // 正北
      windwardDistance * 1852 // 转换为米
    );

    // 下风门（leeward gate）位于起航线下方
    const leewardGateCenter = destinationPoint(
      startLineMidLat,
      startLineMidLng,
      180, // 正南
      windwardDistance * 1852 * 0.8 // 下风门距离起航线稍近
    );

    const leewardGateA = destinationPoint(
      leewardGateCenter[0],
      leewardGateCenter[1],
      270, // 左侧
      gateWidth / 2
    );

    const leewardGateB = destinationPoint(
      leewardGateCenter[0],
      leewardGateCenter[1],
      90, // 右侧
      gateWidth / 2
    );

    // 起航线
    const startLine = L.polyline([origin, startMark], {
      color: '#ff7f0e',
      weight: 4,
    });

    // 航线路径
    const courseLine = L.polyline([
      [startLineMidLat, startLineMidLng],
      windwardMark,
      leewardGateCenter,
      [startLineMidLat, startLineMidLng]
    ], { 
      color: '#1f77b4', 
      weight: 3,
      dashArray: '5, 10'
    });

    // 下风门连线
    const gateLine = L.polyline([leewardGateA, leewardGateB], {
      color: '#d62728',
      weight: 3,
    });

    const lang = getCurrentLang();
    const tooltips = windwardLeewardPlugin.i18n![lang].tooltips;

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
    
    const leewardGateAMarker = L.marker(leewardGateA as [number, number], { 
      icon: createMarkIcon('4A') 
    }).bindTooltip(tooltips.leewardGateA);
    
    const leewardGateBMarker = L.marker(leewardGateB as [number, number], { 
      icon: createMarkIcon('4B') 
    }).bindTooltip(tooltips.leewardGateB);

    // 偏移标记（可选）
    if (offsetMark) {
      const offsetMarkPos = destinationPoint(
        windwardMark[0],
        windwardMark[1],
        90, // 右侧
        offsetDistance
      );
      
      const offsetMarkMarker = L.marker(offsetMarkPos as [number, number], { 
        icon: createMarkIcon('1A') 
      }).bindTooltip(tooltips.offsetMark);
      
      group.addLayer(offsetMarkMarker);
    }

    // 添加所有图层
    group.addLayer(startLine);
    group.addLayer(courseLine);
    group.addLayer(gateLine);
    group.addLayer(committeeBootMarker);
    group.addLayer(startMarkMarker);
    group.addLayer(windwardMarkMarker);
    group.addLayer(leewardGateAMarker);
    group.addLayer(leewardGateBMarker);

    group.addTo(map);
    return group;
  },
};

export default windwardLeewardPlugin;