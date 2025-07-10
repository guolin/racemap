import L from 'leaflet';
import { destinationPoint } from '@shared/lib/geo';
import { CoursePlugin } from './CoursePlugin';

export interface SimpleParams {
  axis: number;      // degrees
  distanceNm: number; // nautical miles
  startLineM: number; // metres
}

const paramSchema = {
  axis: { type: 'number', min: 0, max: 360, step: 5 },
  distanceNm: { type: 'number', min: 0, step: 0.1 },
  startLineM: { type: 'number', min: 0, step: 10 },
};

export const simpleCoursePlugin: CoursePlugin<SimpleParams> = {
  id: 'simple',
  name: 'Simple (Axis + Distance)',
  paramSchema,
  defaultParams: {
    axis: 40,
    distanceNm: 0.9,
    startLineM: 100,
  },
  draw: (
    map: L.Map,
    origin: L.LatLng,
    params: SimpleParams,
    existing?: L.FeatureGroup | null
  ): L.FeatureGroup => {
    const { axis, distanceNm, startLineM } = params;

    if (existing) {
      map.removeLayer(existing);
    }

    const group = L.featureGroup();

    // 起航标（start mark）位于 origin 后方 90° 的方向，距离为 startLineM
    const startMark = destinationPoint(
      origin.lat,
      origin.lng,
      (axis + 270) % 360,
      startLineM
    );

    // 计算中点
    const midLat = (origin.lat + startMark[0]) / 2;
    const midLng = (origin.lng + startMark[1]) / 2;

    // 1 标
    const mark1 = destinationPoint(midLat, midLng, axis, distanceNm * 1852);

    // polyline & markers
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

    group.addLayer(startLine);
    group.addLayer(courseLine);
    group.addLayer(originMarker);
    group.addLayer(startMarkMarker);
    group.addLayer(mark1Marker);

    group.addTo(map);
    return group;
  },
};

export default simpleCoursePlugin; 