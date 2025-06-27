import L from 'leaflet';
import { destinationPoint } from '@shared/lib/geo';
import { CoursePlugin } from './CoursePlugin';

export interface Simple1aParams {
  axis: number;          // 航向 (°M)
  distanceNm: number;    // 原 simple 航线距离 (NM)
  startLineM: number;    // 起航线长度 (m)
  mark1AngleDeg: number; // 1标夹角 (°)
  mark1aDist: number;    // 1a 标距离 (m)
}

const paramSchema = {
  axis:          { type: 'number', label: '角度 (°M)', step: 1 },
  distanceNm:    { type: 'number', label: '距离 (NM)',  step: 0.1 },
  startLineM:    { type: 'number', label: '起航线长度 (m)', step: 1 },
  mark1AngleDeg: { type: 'number', label: '1标夹角 (°)', step: 1 },
  mark1aDist:    { type: 'number', label: '1a标距离 (m)', step: 1 },
};

export const simple1aPlugin: CoursePlugin<Simple1aParams> = {
  id: 'simple1a',
  name: 'Simple + 1a',
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

    const originMarker = L.circleMarker(origin, markStyle).bindTooltip('起航船');
    const startMarkMarker = L.circleMarker(startMark as [number, number], markStyle).bindTooltip('起航标');
    const mark1Marker = L.circleMarker(mark1 as [number, number], markStyle).bindTooltip('1 标');

    const mark1aStyle: L.CircleMarkerOptions = {
      ...markStyle,
      color: '#d62728',
      fillColor: '#d62728',
    };
    const mark1aMarker = L.circleMarker(mark1a as [number, number], mark1aStyle).bindTooltip('1a 标');

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