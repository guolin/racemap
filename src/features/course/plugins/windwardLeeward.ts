import L from 'leaflet';
import { destinationPoint } from '@shared/lib/geo';
import { CoursePlugin } from './CoursePlugin';
import { getCurrentLang } from 'src/locale';
import { createMarkIcon, createFlagIcon, createBoatIcon } from '../lib/markIcon';

export interface WindwardLeewardParams {
  axis: number;           // 航向 (°M)
  distanceNm: number;     // 上风距离 (NM) — 起航线中点到上风标距离
  startLineM: number;     // 起航线长度 (m)
  
  useGate: boolean;           // 是否启用 4 标门
  mark4DistM: number;         // 4标距离起航线中点的距离 (m)，可为负，负数表示下方（顺风方向）
  gateWidthM: number;     // 下风门宽度 (m)

  offsetMark: boolean;        // 是否使用偏移标
  offsetMarkAngleDeg: number; // 1a标夹角 (°)
  offsetDistance: number;     // 偏移距离 (m)


}

const paramSchema = {
  axis: { type: 'number', label: '角度 (°M)', step: 5 },
  distanceNm: { type: 'number', label: '上风距离 (NM)', step: 0.05, decimals: 2 },
  startLineM: { type: 'number', label: '起航线长度 (m)', step: 10 },
  useGate: { type: 'boolean', label: '启用4标门' },
  mark4DistM: { type: 'number', label: '4标距离 (m)', min: -2000, max: 2000, step: 10 },
  gateWidthM: { type: 'number', label: '下风门宽度 (m)', min: 10, max: 400, step: 10 },

  offsetMark: { type: 'boolean', label: '使用偏移标记' },
  offsetMarkAngleDeg: { type: 'number', label: '1a标夹角 (°)', step: 5 },
  offsetDistance: { type: 'number', label: '偏移距离 (m)', min: 10, max: 300, step: 10 },

};

export const windwardLeewardPlugin: CoursePlugin<WindwardLeewardParams> = {
  id: 'windwardLeeward',
  i18n: {
    zh: {
      name: '迎尾风航线 (W/L)',
      labels: {
        axis: '角度 (°M)',
        distanceNm: '上风距离 (NM)',
        startLineM: '起航线长度 (m)',
        gateWidthM: '下风门宽度 (m)',
        offsetMark: '使用偏移标记',
        offsetMarkAngleDeg: '1a标夹角 (°)',
        offsetDistance: '偏移距离 (m)',
        mark4DistM: '4标距离 (m)',
        useGate: '启用4标门'
      },
      tooltips: {
        committeeBoot: '委员会船',
        startMark: '起航标记',
        windwardMark: '上风标记',
        offsetMark: '偏移标记',
        mark4S: '4S',
        mark4P: '4P'
      }
    },
    en: {
      name: 'Windward-Leeward Course',
      labels: {
        axis: 'Angle (°M)',
        distanceNm: 'Windward Distance (NM)',
        startLineM: 'Start Line Length (m)',
        gateWidthM: 'Leeward Gate Width (m)',
        offsetMark: 'Use Offset Mark',
        offsetMarkAngleDeg: 'Offset Mark Angle (°)',
        offsetDistance: 'Offset Distance (m)',
        mark4DistM: 'Mark 4 Distance (m)',
        useGate: 'Enable Gate (Mark 4)'
      },
      tooltips: {
        committeeBoot: 'Committee Boat',
        startMark: 'Start Mark',
        windwardMark: 'Windward Mark',
        offsetMark: 'Offset Mark',
        mark4S: 'Mark 4S',
        mark4P: 'Mark 4P'
      }
    }
  },
  paramSchema,
  defaultParams: {
    axis: 40,
    distanceNm: 1.0,
    startLineM: 150,
    gateWidthM: 120,
    offsetMark: true,
    offsetMarkAngleDeg: 70,
    offsetDistance: 50,
    mark4DistM: -100,
    useGate: true,
  },
  draw: (
    map: L.Map,
    origin: L.LatLng,
    params: WindwardLeewardParams,
    existing?: L.FeatureGroup | null
  ): L.FeatureGroup => {
    const {
      axis,
      distanceNm,
      startLineM,
      gateWidthM,
      offsetMark,
      offsetMarkAngleDeg,
      offsetDistance,
      mark4DistM,
      useGate,
    } = params;

    if (existing) {
      map.removeLayer(existing);
    }

    const group = L.featureGroup();

    // 起航标记（start mark）位于 origin 后方左舷 90° 的方向，距离为 startLineM
    const startMark = destinationPoint(
      origin.lat,
      origin.lng,
      (axis + 270) % 360,
      startLineM
    );

    // 起航线中点
    const startLineMidLat = (origin.lat + startMark[0]) / 2;
    const startLineMidLng = (origin.lng + startMark[1]) / 2;

    // 上风标记（沿 axis 方向）
    const windwardMark = destinationPoint(
      startLineMidLat,
      startLineMidLng,
      axis,
      distanceNm * 1852 // NM -> m
    );

    // 4 标门中心（沿轴线）
    const bearing4 = mark4DistM >= 0 ? axis : (axis + 180) % 360;
    // 使得从起航线中点到 4S/4P 的直线距离等于 |mark4DistM|
    const halfGate = gateWidthM / 2;
    const dAbs = Math.abs(mark4DistM);
    const centerAxisDist = Math.max(0, Math.sqrt(Math.max(0, dAbs * dAbs - halfGate * halfGate)));
    const gateCenter = destinationPoint(
      startLineMidLat,
      startLineMidLng,
      bearing4,
      centerAxisDist
    );

    // 门两端（4S/4P，垂直于轴线）
    const leftBearing = (axis + 270) % 360; // 左舷 (Port)
    const rightBearing = (axis + 90) % 360; // 右舷 (Starboard)

    const mark4P = destinationPoint(
      gateCenter[0],
      gateCenter[1],
      leftBearing,
      gateWidthM / 2
    );

    const mark4S = destinationPoint(
      gateCenter[0],
      gateCenter[1],
      rightBearing,
      gateWidthM / 2
    );

    // 线段
    const startLine = L.polyline([origin, startMark], {
      color: '#ff7f0e',
      weight: 4,
    });

    // 航向主线（实线）
    const courseLine = L.polyline(
      [
        [startLineMidLat, startLineMidLng],
        windwardMark,
        gateCenter,
        [startLineMidLat, startLineMidLng],
      ],
      {
        color: '#1f77b4',
        weight: 3,
      }
    );

    // 1 - 1A 连线（虚线，仅在有偏移标时）
    let line1To1a: L.Polyline | null = null;

    const lang = getCurrentLang();
    const tooltips = windwardLeewardPlugin.i18n![lang].tooltips;

    // 标记
    const committeeBootMarker = L.marker(origin, {
      icon: createBoatIcon(),
    }).bindTooltip(tooltips.committeeBoot);

    const startMarkMarker = L.marker(startMark as [number, number], {
      icon: createFlagIcon(),
    }).bindTooltip(tooltips.startMark);

    const windwardMarkMarker = L.marker(windwardMark as [number, number], {
      icon: createMarkIcon('1'),
    }).bindTooltip(tooltips.windwardMark);

    // 偏移标（1A，可选，红色）
    if (offsetMark) {
      const bearing1a = (axis - offsetMarkAngleDeg + 360) % 360; // 左侧偏移
      const offsetMarkPos = destinationPoint(
        windwardMark[0],
        windwardMark[1],
        bearing1a,
        offsetDistance
      );

      const offsetMarkMarker = L.marker(offsetMarkPos as [number, number], {
        icon: createMarkIcon('1A', { color: '#d62728' }),
      }).bindTooltip(tooltips.offsetMark);

      // 1-1A 虚线
      line1To1a = L.polyline([windwardMark as [number, number], offsetMarkPos as [number, number]], {
        color: '#d62728',
        weight: 2,
        dashArray: '4 4',
      });

      group.addLayer(offsetMarkMarker);
      group.addLayer(line1To1a);
    }

    // 门线 + 门标（仅在启用时）
    if (useGate) {
      const gateLine = L.polyline([mark4P, mark4S], {
        color: '#d62728',
        weight: 3,
      });

      const mark4PMarker = L.marker(mark4P as [number, number], {
        icon: createMarkIcon('4P'),
      }).bindTooltip(tooltips.mark4P);

      const mark4SMarker = L.marker(mark4S as [number, number], {
        icon: createMarkIcon('4S'),
      }).bindTooltip(tooltips.mark4S);

      group.addLayer(gateLine);
      group.addLayer(mark4PMarker);
      group.addLayer(mark4SMarker);
    }

    // 添加所有图层
    group.addLayer(startLine);
    group.addLayer(courseLine);
    group.addLayer(committeeBootMarker);
    group.addLayer(startMarkMarker);
    group.addLayer(windwardMarkMarker);

    group.addTo(map);
    return group;
  },
};

export default windwardLeewardPlugin;