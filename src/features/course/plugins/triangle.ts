import L from 'leaflet';
import { destinationPoint } from '@shared/lib/geo';
import { CoursePlugin } from './CoursePlugin';
import { getCurrentLang } from 'src/locale';
import { createMarkIcon } from '../lib/markIcon';

export interface TriangleParams {
  axis: number;           // 航向 (°M)
  distanceNm: number;     // 上风距离 (NM) — 起航线中点到上风标距离
  startLineM: number;     // 起航线长度 (m)
  interior: number;       // 1标角度 (°) — 角312的度数
  finishType: 'leeward' | 'windward';  // 终点位置：顺风终点(起点) 或 迎风终点(上风标记)
}

const paramSchema = {
  axis: { type: 'number', min: 0, max: 359, step: 5, decimals: 0 },
  distanceNm: { type: 'number', min: 0.3, max: 3.0, step: 0.1, decimals: 1 },
  startLineM: { type: 'number', min: 50, max: 300, step: 10 },
  interior: { type: 'number', min: 30, max: 80, step: 5, decimals: 0 },
  finishType: { type: 'select', options: ['leeward', 'windward'] },
};

export const trianglePlugin: CoursePlugin<TriangleParams> = {
  id: 'triangle',
  i18n: {
    zh: {
      name: '奥林匹克三角形航线',
      labels: {
        axis: '航向 (°M)',
        distanceNm: '上风距离 (NM)',
        startLineM: '起航线长度 (m)',
        interior: '1标角度 (°)',
        finishType: '终点位置'
      },
      tooltips: {
        committeeBoot: '委员会船',
        startMark: '起航标记',
        windwardMark: '上风标记 (1)',
        reachingMark: '横风标记 (2)',
        finishLine: '终点线'
      }
    },
    en: {
      name: 'Olympic Triangle Course',
      labels: {
        axis: 'Course Axis (°M)',
        distanceNm: 'Windward Distance (NM)',
        startLineM: 'Start Line Length (m)',
        interior: 'Mark 1 Angle (°)',
        finishType: 'Finish Location'
      },
      tooltips: {
        committeeBoot: 'Committee Boat',
        startMark: 'Start Mark',
        windwardMark: 'Windward Mark (1)',
        reachingMark: 'Reaching Mark (2)',
        finishLine: 'Finish Line'
      }
    }
  },
  paramSchema,
  defaultParams: {
    axis: 0,
    distanceNm: 0.5,
    startLineM: 50,
    interior: 60,
    finishType: 'leeward',
  },
  draw: (
    map: L.Map,
    origin: L.LatLng,
    params: TriangleParams,
    existing?: L.FeatureGroup | null
  ): L.FeatureGroup => {
    const { axis, distanceNm, startLineM, interior, finishType } = params;

    if (existing) {
      map.removeLayer(existing);
    }

    const group = L.featureGroup();

    // 调试信息
    console.log('Triangle params:', { axis, distanceNm, startLineM, interior, finishType });
    console.log('Origin:', origin);

    // 3标（起航标记）位于委员会船左侧，起航线与风向垂直
    // 左侧方向 = axis - 90° (垂直于风向，向左)
    const leftBearing = (axis - 90 + 360) % 360;
    const mark3 = destinationPoint(
      origin.lat,
      origin.lng,
      leftBearing, // 委员会船左侧
      startLineM
    );

    console.log('Mark3 calculated:', mark3);

    // 确保坐标是有效的数字
    if (isNaN(mark3[0]) || isNaN(mark3[1])) {
      console.error('Invalid mark3 coordinates:', mark3);
      console.error('Input values:', { lat: origin.lat, lng: origin.lng, bearing: 270, distance: startLineM });
      return group;
    }

    // 1标（上风标记）- 从3标向上（axis方向）
    const windwardMark = destinationPoint(
      mark3[0],
      mark3[1],
      axis,
      distanceNm * 1852
    );

    console.log('WindwardMark calculated:', windwardMark);

    // 确保上风标记坐标有效
    if (isNaN(windwardMark[0]) || isNaN(windwardMark[1])) {
      console.error('Invalid windwardMark coordinates:', windwardMark);
      console.error('Input values:', { lat: startLineMidLat, lng: startLineMidLng, bearing: axis, distance: distanceNm * 1852 });
      return group;
    }

    // 2标（横风标记）- 等腰三角形，线12=线23
    // interior参数是角312=角132（在1标处的角度）
    
    // 在等腰三角形123中：
    // - 线段12 = 线段23
    // - 角132 = 角231 = interior（底角相等）  
    // - 角123 = 180° - 2*interior（顶角）
    
    // 使用正弦定理计算12的长度：
    // 13/sin(角123) = 12/sin(角231)
    // 13/sin(180°-2*interior) = 12/sin(interior)
    // 12 = 13 * sin(interior) / sin(180°-2*interior)
    // 因为sin(180°-x) = sin(x)，所以：
    // 12 = 13 * sin(interior) / sin(2*interior)
    // 因为sin(2x) = 2*sin(x)*cos(x)，所以：
    // 12 = 13 * sin(interior) / (2*sin(interior)*cos(interior))
    // 12 = 13 / (2*cos(interior))
    
    const distance13 = distanceNm * 1852;
    const distance12 = distance13 / (2 * Math.cos(interior * Math.PI / 180));
    
    // 2标方向：从1标看向3标的方向偏转interior角度
    const bearing1to3 = Math.atan2(
      mark3[1] - windwardMark[1],
      mark3[0] - windwardMark[0]
    ) * 180 / Math.PI;
    
    const bearing1to2 = (bearing1to3 + interior) % 360;
    
    const reachingMark = destinationPoint(
      windwardMark[0],
      windwardMark[1],
      bearing1to2,
      distance12
    );

    console.log('ReachingMark calculated:', reachingMark);

    // 确保横风标记坐标有效
    if (isNaN(reachingMark[0]) || isNaN(reachingMark[1])) {
      console.error('Invalid reachingMark coordinates:', reachingMark);
      console.error('Input values:', { lat: windwardMark[0], lng: windwardMark[1], bearing: axis + 120, distance: distanceNm * 1852 });
      return group;
    }

    // 起航线
    const startLine = L.polyline([origin, mark3], {
      color: '#ff7f0e',
      weight: 4,
    });

    // 三角形航线 - 实线连接
    const coursePath = [
      L.latLng(mark3[0], mark3[1]),
      L.latLng(windwardMark[0], windwardMark[1]),
      L.latLng(reachingMark[0], reachingMark[1]),
      L.latLng(mark3[0], mark3[1])
    ];

    const courseLine = L.polyline(coursePath, { 
      color: '#1f77b4', 
      weight: 3
    });

    // 终点线和终点标记位置
    let finishLine: L.Polyline | null = null;
    let finishMarkPosition: L.LatLng;
    
    if (finishType === 'windward') {
      // 迎风终点：在1标右侧50m处设置终点标记
      const finishMarkCoords = destinationPoint(
        windwardMark[0],
        windwardMark[1],
        axis + 90, // 右侧（垂直于航向向右）
        50 // 50米距离
      );
      finishMarkPosition = L.latLng(finishMarkCoords[0], finishMarkCoords[1]);
      
      // 终点线：从1标到终点标记
      finishLine = L.polyline([
        L.latLng(windwardMark[0], windwardMark[1]),
        finishMarkPosition
      ], {
        color: '#0000ff',
        weight: 3,
        dashArray: '5, 5'
      });
    } else {
      // 顺风终点：不画终点线，只有终点标记在3标位置
      finishMarkPosition = L.latLng(mark3[0], mark3[1]);
    }

    const lang = getCurrentLang();
    const tooltips = trianglePlugin.i18n![lang].tooltips;

    // 标记
    const committeeBootMarker = L.marker(origin, { 
      icon: createMarkIcon('CB') 
    }).bindTooltip(tooltips.committeeBoot);
    
    const startMarkMarker = L.marker(mark3 as [number, number], { 
      icon: createMarkIcon('3') 
    }).bindTooltip('起航标记 (3)');
    
    const windwardMarkMarker = L.marker(windwardMark as [number, number], { 
      icon: createMarkIcon('1') 
    }).bindTooltip(tooltips.windwardMark);
    
    const reachingMarkMarker = L.marker(reachingMark as [number, number], { 
      icon: createMarkIcon('2') 
    }).bindTooltip(tooltips.reachingMark);

    // 终点标记（蓝色小旗）- 只在迎风终点时显示
    let finishMarker: L.Marker | null = null;
    if (finishType === 'windward') {
      finishMarker = L.marker(finishMarkPosition, {
        icon: L.divIcon({
          html: '🔵',
          className: 'finish-flag-blue',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).bindTooltip('终点');
    }

    // 添加所有图层
    group.addLayer(startLine);
    group.addLayer(courseLine);
    if (finishLine) {
      group.addLayer(finishLine);
    }
    group.addLayer(committeeBootMarker);
    group.addLayer(startMarkMarker);
    group.addLayer(windwardMarkMarker);
    group.addLayer(reachingMarkMarker);
    if (finishMarker) {
      group.addLayer(finishMarker);
    }

    group.addTo(map);
    return group;
  },
};

export default trianglePlugin;