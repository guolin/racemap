import L from 'leaflet';
import { destinationPoint } from '@shared/lib/geo';
import { CoursePlugin } from './CoursePlugin';
import { getCurrentLang } from 'src/locale';
import { createMarkIcon } from '../lib/markIcon';

export interface IqfoilSlalomParams {
  gateCount: number;        // 门数 (通常2-3个)
  gateWidth: number;        // 门宽度 (米)
  gateSpacing: number;      // 门间距 (米)
  startOffset: number;      // 起始偏移距离 (米)
  finishType: 'gate' | 'line';  // 终点类型
  windConditions: '5-10' | '7-15';  // 适用风况 (节)
}

const paramSchema = {
  gateCount: { type: 'number', min: 2, max: 3, step: 1 },
  gateWidth: { type: 'number', min: 20, max: 50, step: 5 },
  gateSpacing: { type: 'number', min: 100, max: 300, step: 25 },
  startOffset: { type: 'number', min: 50, max: 200, step: 25 },
  finishType: { type: 'select', options: ['gate', 'line'] },
  windConditions: { type: 'select', options: ['5-10', '7-15'] },
};

export const iqfoilSlalomPlugin: CoursePlugin<IqfoilSlalomParams> = {
  id: 'iqfoilSlalom',
  i18n: {
    zh: {
      name: 'iQFoil 障碍滑航',
      labels: {
        gateCount: '门数',
        gateWidth: '门宽度 (米)',
        gateSpacing: '门间距 (米)',
        startOffset: '起始偏移 (米)',
        finishType: '终点类型',
        windConditions: '风况 (节)'
      },
      tooltips: {
        startLine: '起始线',
        portGate: '左舷门 (红)',
        starboardGate: '右舷门 (绿)',
        finishLine: '终点线',
        windIndicator: '风向指示'
      }
    },
    en: {
      name: 'iQFoil Slalom Course',
      labels: {
        gateCount: 'Number of Gates',
        gateWidth: 'Gate Width (m)',
        gateSpacing: 'Gate Spacing (m)',
        startOffset: 'Start Offset (m)',
        finishType: 'Finish Type',
        windConditions: 'Wind Conditions (knots)'
      },
      tooltips: {
        startLine: 'Start Line',
        portGate: 'Port Gate (Red)',
        starboardGate: 'Starboard Gate (Green)',
        finishLine: 'Finish Line',
        windIndicator: 'Wind Direction'
      }
    }
  },
  paramSchema,
  defaultParams: {
    gateCount: 3,
    gateWidth: 30,
    gateSpacing: 150,
    startOffset: 100,
    finishType: 'line',
    windConditions: '5-10',
  },
  draw: (
    map: L.Map,
    origin: L.LatLng,
    params: IqfoilSlalomParams,
    existing?: L.FeatureGroup | null
  ): L.FeatureGroup => {
    const { gateCount, gateWidth, gateSpacing, startOffset, finishType } = params;

    if (existing) {
      map.removeLayer(existing);
    }

    const group = L.featureGroup();

    // 起始线中点
    const startCenter = destinationPoint(
      origin.lat,
      origin.lng,
      0, // 正北
      startOffset
    );

    // 起始线两端
    const startLineLeft = destinationPoint(
      startCenter[0],
      startCenter[1],
      270, // 左侧
      50
    );

    const startLineRight = destinationPoint(
      startCenter[0],
      startCenter[1],
      90, // 右侧
      50
    );

    // 起始线
    const startLine = L.polyline([startLineLeft, startLineRight], {
      color: '#ff7f0e',
      weight: 4,
    });

    const lang = getCurrentLang();
    const tooltips = iqfoilSlalomPlugin.i18n![lang].tooltips;

    // 生成门序列
    const gates: Array<{
      portGate: [number, number];
      starboardGate: [number, number];
      gateNumber: number;
    }> = [];

    for (let i = 0; i < gateCount; i++) {
      const gateDistance = startOffset + (i + 1) * gateSpacing;
      
      // 左右交替布置门，创造S形路径
      const lateralOffset = (i % 2 === 0) ? -40 : 40; // 左右偏移40米
      
      const gateCenter = destinationPoint(
        origin.lat,
        origin.lng,
        0, // 正北
        gateDistance
      );

      const gateCenterWithOffset = destinationPoint(
        gateCenter[0],
        gateCenter[1],
        90, // 东西方向偏移
        lateralOffset
      );

      const portGate = destinationPoint(
        gateCenterWithOffset[0],
        gateCenterWithOffset[1],
        270, // 左侧
        gateWidth / 2
      );

      const starboardGate = destinationPoint(
        gateCenterWithOffset[0],
        gateCenterWithOffset[1],
        90, // 右侧
        gateWidth / 2
      );

      gates.push({
        portGate,
        starboardGate,
        gateNumber: i + 1
      });
    }

    // 绘制门和路径指示
    const pathPoints: L.LatLng[] = [L.latLng(startCenter[0], startCenter[1])];

    gates.forEach(({ portGate, starboardGate, gateNumber }, index) => {
      // 门连线
      const gateLine = L.polyline([portGate, starboardGate], {
        color: '#d62728',
        weight: 3,
      });

      // 左舷门标记 (红色)
      const portGateMarker = L.marker(portGate as [number, number], { 
        icon: createMarkIcon(`${gateNumber}P`, { color: '#dc2626' }) 
      }).bindTooltip(`${tooltips.portGate} ${gateNumber}`);
      
      // 右舷门标记 (绿色)
      const starboardGateMarker = L.marker(starboardGate as [number, number], { 
        icon: createMarkIcon(`${gateNumber}S`, { color: '#16a34a' }) 
      }).bindTooltip(`${tooltips.starboardGate} ${gateNumber}`);

      group.addLayer(gateLine);
      group.addLayer(portGateMarker);
      group.addLayer(starboardGateMarker);

      // 添加到路径点（门中心）
      const gateCenter = [
        (portGate[0] + starboardGate[0]) / 2,
        (portGate[1] + starboardGate[1]) / 2
      ];
      pathPoints.push(L.latLng(gateCenter[0], gateCenter[1]));
    });

    // 终点设置
    if (finishType === 'line') {
      const lastGate = gates[gates.length - 1];
      const finishCenter = [
        (lastGate.portGate[0] + lastGate.starboardGate[0]) / 2,
        (lastGate.portGate[1] + lastGate.starboardGate[1]) / 2
      ];

      const finishLine = destinationPoint(
        finishCenter[0],
        finishCenter[1],
        0, // 正北
        gateSpacing / 2
      );

      const finishLineLeft = destinationPoint(
        finishLine[0],
        finishLine[1],
        270,
        50
      );

      const finishLineRight = destinationPoint(
        finishLine[0],
        finishLine[1],
        90,
        50
      );

      const finishLineMarker = L.polyline([finishLineLeft, finishLineRight], {
        color: '#2ca02c',
        weight: 4,
      });

      group.addLayer(finishLineMarker);
      pathPoints.push(L.latLng(finishLine[0], finishLine[1]));
    }

    // 推荐路径线（虚线）
    const pathLine = L.polyline(pathPoints, {
      color: '#1f77b4',
      weight: 2,
      dashArray: '10, 10',
      opacity: 0.7
    });

    // 委员会船标记
    const committeeBootMarker = L.marker(origin, { 
      icon: createMarkIcon('CB') 
    }).bindTooltip('委员会船');

    // 风向指示器（简化的北向箭头）
    const windArrow = L.marker(origin, {
      icon: L.divIcon({
        html: '↑',
        className: 'wind-direction-arrow',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
    }).bindTooltip(tooltips.windIndicator);

    // 添加所有图层
    group.addLayer(startLine);
    group.addLayer(pathLine);
    group.addLayer(committeeBootMarker);
    group.addLayer(windArrow);

    group.addTo(map);
    return group;
  },
};

export default iqfoilSlalomPlugin;