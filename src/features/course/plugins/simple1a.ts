import L from 'leaflet';
import { destinationPoint } from '@shared/lib/geo';
import { CoursePlugin } from './CoursePlugin';
import { getCurrentLang } from 'src/locale';

export interface Simple1aParams {
  axis: number;          // 航向 (°M)
  distanceNm: number;    // 原 simple 航线距离 (NM)
  startLineM: number;    // 起航线长度 (m)
  mark1AngleDeg: number; // 1标夹角 (°)
  mark1aDist: number;    // 1a 标距离 (m)
}

const paramSchema = {
  axis:          { type: 'number', label: '角度 (°M)', step: 5 },
  distanceNm:    { type: 'number', label: '距离 (NM)',  step: 0.1 },
  startLineM:    { type: 'number', label: '起航线长度 (m)', step: 10 },
  mark1AngleDeg: { type: 'number', label: '1标夹角 (°)', step: 5 },
  mark1aDist:    { type: 'number', label: '1a标距离 (m)', step: 10 },
};

export const simple1aPlugin: CoursePlugin<Simple1aParams> = {
  id: 'simple1a',
  i18n: {
    zh: {
      name: 'Simple + 1a',
      labels: {
        axis: '角度 (°M)',
        distanceNm: '距离 (NM)',
        startLineM: '起航线长度 (m)',
        mark1AngleDeg: '1标夹角 (°)',
        mark1aDist: '1a标距离 (m)'
      },
      tooltips: {
        origin: '起航船',
        startMark: '起航标',
        mark1: '1 标',
        mark1a: '1a 标'
      }
    },
    en: {
      name: 'Simple + 1a',
      labels: {
        axis: 'Angle (°M)',
        distanceNm: 'Distance (NM)',
        startLineM: 'Start line (m)',
        mark1AngleDeg: 'Mark 1 angle (°)',
        mark1aDist: 'Mark 1a distance (m)'
      },
      tooltips: {
        origin: 'Signal boat',
        startMark: 'Start mark',
        mark1: 'Mark 1',
        mark1a: 'Mark 1a'
      }
    }
  },
  paramSchema,
  defaultParams: {
    axis: 40,
    distanceNm: 0.9,
    startLineM: 100,
    mark1AngleDeg: 70,
    mark1aDist: 50,
  },
  draw: (
    map: L.Map,
    origin: L.LatLng,
    params: Simple1aParams,
    existing?: L.FeatureGroup | null
  ): L.FeatureGroup => {
    const { axis, distanceNm, startLineM, mark1AngleDeg, mark1aDist } = params;

    if (existing) {
      map.removeLayer(existing);
    }

    const group = L.featureGroup();

    // 1. 起航标在 origin 后方 90° 方向，距离 startLineM
    const startMark = destinationPoint(
      origin.lat,
      origin.lng,
      (axis + 270) % 360,
      startLineM
    );

    // 2. 计算起航线中点
    const midLat = (origin.lat + startMark[0]) / 2;
    const midLng = (origin.lng + startMark[1]) / 2;

    // 3. 1 标
    const mark1 = destinationPoint(midLat, midLng, axis, distanceNm * 1852);

    // 4. 1a 标
    const bearing1a = (axis - mark1AngleDeg + 360) % 360; // 左侧 (逆时针) mark1AngleDeg
    const mark1a = destinationPoint(mark1[0], mark1[1], bearing1a, mark1aDist);

    // ---- 绘制线段&标记 ----
    const startLine = L.polyline([origin, startMark], {
      color: '#ff7f0e',
      weight: 3,
    });

    const courseLine = L.polyline(
      [
        [midLat, midLng],
        mark1,
      ],
      { color: '#1f77b4', weight: 3 }
    );

    const line1To1a = L.polyline([mark1, mark1a], {
      color: '#d62728',
      weight: 2,
      dashArray: '4 4',
    });

    // markers style
    const markStyle: L.CircleMarkerOptions = {
      radius: 6,
      color: '#000',
      weight: 1,
      fillColor: '#fff',
      fillOpacity: 1,
    };

    const lang = getCurrentLang();
    const tooltips = simple1aPlugin.i18n![lang].tooltips;
    const originMarker = L.circleMarker(origin, markStyle).bindTooltip(tooltips.origin);
    const startMarkMarker = L.circleMarker(startMark as [number, number], markStyle).bindTooltip(tooltips.startMark);
    const mark1Marker = L.circleMarker(mark1 as [number, number], markStyle).bindTooltip(tooltips.mark1);

    const mark1aStyle: L.CircleMarkerOptions = {
      ...markStyle,
      color: '#d62728',
      fillColor: '#d62728',
    };
    const mark1aMarker = L.circleMarker(mark1a as [number, number], mark1aStyle).bindTooltip(tooltips.mark1a);

    group.addLayer(startLine);
    group.addLayer(courseLine);
    group.addLayer(line1To1a);
    group.addLayer(originMarker);
    group.addLayer(startMarkMarker);
    group.addLayer(mark1Marker);
    group.addLayer(mark1aMarker);

    group.addTo(map);
    return group;
  },
};

export default simple1aPlugin; 