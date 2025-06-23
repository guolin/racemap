import L from 'leaflet';
import { destinationPoint } from '@shared/lib/geo';

export interface CourseParams {
  axis: number; // degrees
  distanceNm: number; // nm
  startLineM: number; // metres
}

export function drawCourse(
  map: L.Map,
  origin: L.LatLng,
  params: CourseParams,
  existing?: L.FeatureGroup | null
): L.FeatureGroup {
  const { axis, distanceNm, startLineM } = params;

  if (existing) {
    map.removeLayer(existing);
  }

  const group = L.featureGroup();

  const startMark = destinationPoint(
    origin.lat,
    origin.lng,
    (axis + 270) % 360,
    startLineM
  );

  const midLat = (origin.lat + startMark[0]) / 2;
  const midLng = (origin.lng + startMark[1]) / 2;

  const mark1 = destinationPoint(midLat, midLng, axis, distanceNm * 1852);

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
} 