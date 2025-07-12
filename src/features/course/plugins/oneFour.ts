import L from 'leaflet';
import { destinationPoint } from '@shared/lib/geo';
import { CoursePlugin } from './CoursePlugin';
import { getCurrentLang } from 'src/locale';

export interface OneFourParams {
  axis: number;       // degrees
  distanceNm: number; // nautical miles from start-line midpoint to Mark1 midpoint direction
  startLineM: number; // start line length
  mark4Width: number; // 4P-4S length in metres
  mark4Dist: number;  // perpendicular distance from start line to 4P-4S line centre (metres)
}

const paramSchema = {
  axis:        { type: 'number', label: '角度 (°M)', step: 5 },
  distanceNm:  { type: 'number', label: '距离 (NM)',  step: 0.05, decimals: 2 },
  startLineM:  { type: 'number', label: '起航线长度 (m)', step: 10 },
  mark4Width:  { type: 'number', label: '4 门宽度 (m)',  step: 10 },
  mark4Dist:   { type: 'number', label: '4 门距离起航线 (m)', step: 10 },
};

export const oneFourPlugin: CoursePlugin<OneFourParams> = {
  id: 'oneFour',
  i18n: {
    zh: {
      name: '1-4 航向',
      labels: {
        axis: '角度 (°M)',
        distanceNm: '距离 (NM)',
        startLineM: '起航线长度 (m)',
        mark4Width: '4 门宽度 (m)',
        mark4Dist: '4 门距离起航线 (m)'
      },
      tooltips: {
        origin: '起航船',
        startMark: '起航标',
        mark1: '1 标',
        fourP: '4P',
        fourS: '4S'
      }
    },
    en: {
      name: '1-4 Course',
      labels: {
        axis: 'Angle (°M)',
        distanceNm: 'Distance (NM)',
        startLineM: 'Start line (m)',
        mark4Width: 'Gate width (m)',
        mark4Dist: 'Gate distance (m)'
      },
      tooltips: {
        origin: 'Signal boat',
        startMark: 'Start mark',
        mark1: 'Mark 1',
        fourP: '4P',
        fourS: '4S'
      }
    }
  },
  paramSchema,
  defaultParams: {
    axis: 40,
    distanceNm: 0.9,
    startLineM: 100,
    mark4Width: 50,
    mark4Dist: 150,
  },
  draw: (
    map: L.Map,
    origin: L.LatLng,
    p: OneFourParams,
    existing?: L.FeatureGroup | null
  ) => {
    const { axis, distanceNm, startLineM, mark4Width, mark4Dist } = p;
    if (existing) map.removeLayer(existing);

    const g = L.featureGroup();

    // 1. start mark
    const startMark = destinationPoint(origin.lat, origin.lng, (axis + 270) % 360, startLineM);
    const startLine = L.polyline([origin, startMark], { color: '#ff7f0e', weight: 3 });

    // 2. midpoint
    const midLat = (origin.lat + startMark[0]) / 2;
    const midLng = (origin.lng + startMark[1]) / 2;
    const mid = L.latLng(midLat, midLng);

    // 3. mark1
    const mark1Arr = destinationPoint(midLat, midLng, axis, distanceNm * 1852);
    const mark1 = L.latLng(mark1Arr[0], mark1Arr[1]);

    // 4. 4 gate centre C
    const centreArr = destinationPoint(midLat, midLng, axis, mark4Dist);
    const centre = L.latLng(centreArr[0], centreArr[1]);

    // 5. 4P / 4S along start line direction (+/-) (axis+270 and axis+90)
    const fourPArr = destinationPoint(centre.lat, centre.lng, (axis + 270) % 360, mark4Width / 2);
    const fourSArr = destinationPoint(centre.lat, centre.lng, (axis + 90) % 360, mark4Width / 2);
    const fourP = L.latLng(fourPArr[0], fourPArr[1]);
    const fourS = L.latLng(fourSArr[0], fourSArr[1]);

    // lines
    const courseLine = L.polyline([mid, mark1], { color: '#1f77b4', weight: 3 });
    const gateLine  = L.polyline([fourP, fourS], { color: '#2ca02c', weight: 3 });

    // markers style
    const markStyle: L.CircleMarkerOptions = {
      radius: 6,
      color: '#000',
      weight: 1,
      fillColor: '#fff',
      fillOpacity: 1,
    };

    const lang = getCurrentLang();
    const tooltips = oneFourPlugin.i18n![lang].tooltips;
    const originMarker = L.circleMarker(origin, markStyle).bindTooltip(tooltips.origin);
    const startMarkMarker = L.circleMarker(startMark as [number, number], markStyle).bindTooltip(tooltips.startMark);
    const mark1Marker = L.circleMarker(mark1, markStyle).bindTooltip(tooltips.mark1);
    const fourPMarker = L.circleMarker(fourP, markStyle).bindTooltip(tooltips.fourP);
    const fourSMarker = L.circleMarker(fourS, markStyle).bindTooltip(tooltips.fourS);

    g.addLayer(startLine);
    g.addLayer(courseLine);
    g.addLayer(gateLine);
    g.addLayer(originMarker);
    g.addLayer(startMarkMarker);
    g.addLayer(mark1Marker);
    g.addLayer(fourPMarker);
    g.addLayer(fourSMarker);

    g.addTo(map);
    return g;
  },
};

export default oneFourPlugin; 