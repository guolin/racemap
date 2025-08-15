import L from 'leaflet';
import { destinationPoint } from '@shared/lib/geo';
import { CoursePlugin } from './CoursePlugin';
import { getCurrentLang } from 'src/locale';
import { createMarkIcon } from '../lib/markIcon';

export interface OptimistTrapezoidParams {
  trapezoidAngle: 60 | 70;    // 梯形角度 (度)
  windwardDistance: number;    // 上风距离 (海里)
  gateWidth: number;          // 4号门宽度 (米)
  startLineLength: number;    // 起航线长度 (米)
  finishType: 'committee' | 'windward';  // 终点类型
  laps: number;               // 圈数
  useOffsetMark: boolean;     // 是否使用偏移标记
  offsetDistance: number;     // 偏移距离 (米)
}

const paramSchema = {
  trapezoidAngle: { type: 'select', options: [60, 70] },
  windwardDistance: { type: 'number', min: 0.3, max: 2.0, step: 0.1, decimals: 1 },
  gateWidth: { type: 'number', min: 50, max: 150, step: 10 },
  startLineLength: { type: 'number', min: 80, max: 200, step: 10 },
  finishType: { type: 'select', options: ['committee', 'windward'] },
  laps: { type: 'number', min: 1, max: 3, step: 1 },
  useOffsetMark: { type: 'boolean' },
  offsetDistance: { type: 'number', min: 20, max: 80, step: 10 },
};

export const optimistTrapezoidPlugin: CoursePlugin<OptimistTrapezoidParams> = {
  id: 'optimistTrapezoid',
  i18n: {
    zh: {
      name: 'OP 梯形航线',
      labels: {
        trapezoidAngle: '梯形角度 (度)',
        windwardDistance: '上风距离 (海里)',
        gateWidth: '4号门宽度 (米)',
        startLineLength: '起航线长度 (米)',
        finishType: '终点类型',
        laps: '圈数',
        useOffsetMark: '使用偏移标记',
        offsetDistance: '偏移距离 (米)'
      },
      tooltips: {
        committeeBoot: '委员会船',
        startMark: '起航标记',
        windwardMark: '上风标记 (1)',
        reachingMarkA: '横风标记 A (2)',
        reachingMarkB: '横风标记 B (3)',
        leewardGateA: '下风门 A (4A)',
        leewardGateB: '下风门 B (4B)',
        offsetMark: '偏移标记 (1A)'
      }
    },
    en: {
      name: 'Optimist Trapezoid Course',
      labels: {
        trapezoidAngle: 'Trapezoid Angle (°)',
        windwardDistance: 'Windward Distance (NM)',
        gateWidth: 'Gate 4 Width (m)',
        startLineLength: 'Start Line Length (m)',
        finishType: 'Finish Type',
        laps: 'Number of Laps',
        useOffsetMark: 'Use Offset Mark',
        offsetDistance: 'Offset Distance (m)'
      },
      tooltips: {
        committeeBoot: 'Committee Boat',
        startMark: 'Start Mark',
        windwardMark: 'Windward Mark (1)',
        reachingMarkA: 'Reaching Mark A (2)',
        reachingMarkB: 'Reaching Mark B (3)',
        leewardGateA: 'Leeward Gate A (4A)',
        leewardGateB: 'Leeward Gate B (4B)',
        offsetMark: 'Offset Mark (1A)'
      }
    }
  },
  paramSchema,
  defaultParams: {
    trapezoidAngle: 60,
    windwardDistance: 0.8,
    gateWidth: 80,
    startLineLength: 120,
    finishType: 'committee',
    laps: 1,
    useOffsetMark: true,
    offsetDistance: 40,
  },
  draw: (
    map: L.Map,
    origin: L.LatLng,
    params: OptimistTrapezoidParams,
    existing?: L.FeatureGroup | null
  ): L.FeatureGroup => {
    const { trapezoidAngle, windwardDistance, gateWidth, startLineLength, useOffsetMark, offsetDistance } = params;

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

    // 4号门中心作为参考点（2008年奥运标准）
    const gate4Center = destinationPoint(
      startLineMidLat,
      startLineMidLng,
      180, // 正南（下风方向）
      windwardDistance * 1852 * 0.6 // 4号门位于下风位置
    );

    // 4号门的两个标记
    const gate4A = destinationPoint(
      gate4Center[0],
      gate4Center[1],
      270, // 左侧
      gateWidth / 2
    );

    const gate4B = destinationPoint(
      gate4Center[0],
      gate4Center[1],
      90, // 右侧
      gateWidth / 2
    );

    // 上风标记（Mark 1）- 相对于4号门中心
    const windwardMark = destinationPoint(
      gate4Center[0],
      gate4Center[1],
      0, // 正北
      windwardDistance * 1852
    );

    // 计算梯形的横风标记（Mark 2 和 3）
    const halfAngleRad = (trapezoidAngle * Math.PI) / 180 / 2;
    const reachingDistance = windwardDistance * 1852 * 0.8; // 横风标记距离稍短

    // Mark 2 (左侧横风标记)
    const mark2Angle = 180 + (90 - trapezoidAngle / 2); // 左下角
    const reachingMarkA = destinationPoint(
      gate4Center[0],
      gate4Center[1],
      mark2Angle,
      reachingDistance
    );

    // Mark 3 (右侧横风标记)
    const mark3Angle = 180 - (90 - trapezoidAngle / 2); // 右下角
    const reachingMarkB = destinationPoint(
      gate4Center[0],
      gate4Center[1],
      mark3Angle,
      reachingDistance
    );

    // 起航线
    const startLine = L.polyline([origin, startMark], {
      color: '#ff7f0e',
      weight: 4,
    });

    // 4号门连线
    const gate4Line = L.polyline([gate4A, gate4B], {
      color: '#d62728',
      weight: 3,
    });

    // 梯形航路
    const trapezoidPath = [
      [startLineMidLat, startLineMidLng],
      windwardMark,
      reachingMarkA,
      gate4Center,
      reachingMarkB,
      windwardMark,
      [startLineMidLat, startLineMidLng]
    ];

    const courseLine = L.polyline(trapezoidPath, { 
      color: '#1f77b4', 
      weight: 3,
      dashArray: '5, 10'
    });

    const lang = getCurrentLang();
    const tooltips = optimistTrapezoidPlugin.i18n![lang].tooltips;

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
    
    const gate4AMarker = L.marker(gate4A as [number, number], { 
      icon: createMarkIcon('4A') 
    }).bindTooltip(tooltips.leewardGateA);
    
    const gate4BMarker = L.marker(gate4B as [number, number], { 
      icon: createMarkIcon('4B') 
    }).bindTooltip(tooltips.leewardGateB);

    // 偏移标记（可选）
    if (useOffsetMark) {
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
    group.addLayer(gate4Line);
    group.addLayer(courseLine);
    group.addLayer(committeeBootMarker);
    group.addLayer(startMarkMarker);
    group.addLayer(windwardMarkMarker);
    group.addLayer(reachingMarkAMarker);
    group.addLayer(reachingMarkBMarker);
    group.addLayer(gate4AMarker);
    group.addLayer(gate4BMarker);

    group.addTo(map);
    return group;
  },
};

export default optimistTrapezoidPlugin;