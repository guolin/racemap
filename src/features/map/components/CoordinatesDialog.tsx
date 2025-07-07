import React from 'react';
import L from 'leaflet';
import { destinationPoint } from '@shared/lib/geo';

interface CoordinatePoint {
  name: string;
  lat: number;
  lng: number;
}

interface Props {
  isVisible: boolean;
  onClose: () => void;
  origin: L.LatLng | null;
  courseType: string;
  courseParams: Record<string, any>;
}

export const CoordinatesDialog: React.FC<Props> = ({ 
  isVisible, 
  onClose, 
  origin, 
  courseType, 
  courseParams 
}) => {
  // (debug logs removed)
  
  if (!isVisible) return null;

  // 根据课程类型计算坐标点
  const getCoordinatePoints = (): CoordinatePoint[] => {
    if (!origin) {
      return [];
    }
    
    const points: CoordinatePoint[] = [
      {
        name: 'Signal Boat',
        lat: origin.lat,
        lng: origin.lng
      }
    ];

    // 根据不同的课程类型计算其他坐标点
    if (courseType === 'simple' || courseType === 'simple1a' || courseType === 'oneFour') {
      const { axis, distanceNm, startLineM } = courseParams;
      
      // 计算起航标（start mark）
      const startMarkBearing = (axis + 270) % 360;
      const [startMarkLat, startMarkLng] = destinationPoint(origin.lat, origin.lng, startMarkBearing, startLineM);
      
      points.push({
        name: 'Pin End',
        lat: startMarkLat,
        lng: startMarkLng
      });

      // 计算起航线中点
      const midLat = (origin.lat + startMarkLat) / 2;
      const midLng = (origin.lng + startMarkLng) / 2;

      // 计算1标
      const [mark1Lat, mark1Lng] = destinationPoint(midLat, midLng, axis, distanceNm * 1852);
      
      points.push({
        name: 'Mark 1',
        lat: mark1Lat,
        lng: mark1Lng
      });

      // 如果是simple1a类型，计算1a标
      if (courseType === 'simple1a') {
        const { mark1AngleDeg, mark1aDist } = courseParams;
        const bearing1a = (axis - mark1AngleDeg + 360) % 360;
        const [mark1aLat, mark1aLng] = destinationPoint(mark1Lat, mark1Lng, bearing1a, mark1aDist);
        
        points.push({
          name: 'Mark 1a',
          lat: mark1aLat,
          lng: mark1aLng
        });
      }

      // 如果是oneFour类型，计算4P和4S
      if (courseType === 'oneFour') {
        const { mark4Width, mark4Dist } = courseParams;
        
        // 4门中心点
        const [centreLat, centreLng] = destinationPoint(midLat, midLng, axis, mark4Dist);
        
        // 4P
        const fourPBearing = (axis + 270) % 360;
        const [fourPLat, fourPLng] = destinationPoint(centreLat, centreLng, fourPBearing, mark4Width / 2);
        
        points.push({
          name: '4P',
          lat: fourPLat,
          lng: fourPLng
        });

        // 4S
        const fourSBearing = (axis + 90) % 360;
        const [fourSLat, fourSLng] = destinationPoint(centreLat, centreLng, fourSBearing, mark4Width / 2);
        
        points.push({
          name: '4S',
          lat: fourSLat,
          lng: fourSLng
        });
      }
    }

    return points;
  };

  const coordinatePoints = getCoordinatePoints();

  // 格式化坐标为 "XX° YY.YYYY'"
  const fmtLat = (v: number) => {
    const abs = Math.abs(v);
    const deg = Math.floor(abs);
    const minutes = (abs - deg) * 60;
    const dir = v >= 0 ? 'N' : 'S';
    return `${deg}° ${minutes.toFixed(4)}' ${dir}`;
  };

  const fmtLng = (v: number) => {
    const abs = Math.abs(v);
    const deg = Math.floor(abs);
    const minutes = (abs - deg) * 60;
    const dir = v >= 0 ? 'E' : 'W';
    return `${deg}° ${minutes.toFixed(4)}' ${dir}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Coordinates</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-3">
          {coordinatePoints.length > 0 ? (
            coordinatePoints.map((point, index) => (
              <div key={index} className="border-b border-gray-200 pb-2">
                <div className="font-medium text-gray-800">{point.name}</div>
                <div className="text-sm text-gray-600 font-mono">
                  {fmtLat(point.lat)}, {fmtLng(point.lng)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg mb-2">No coordinates yet</div>
              <div className="text-sm">Waiting for the signal boat position …</div>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-xs text-gray-500">
          Course: {courseType || 'N/A'}
        </div>
      </div>
    </div>
  );
}; 