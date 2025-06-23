import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { calcBearing } from '@shared/lib/geo';

export interface GpsState {
  latLng: L.LatLng | null;
  speedKts: number | null;
  headingDeg: number | null; // browser provided heading if available
  trackBearing: number | null; // bearing calculated between successive points
  gpsOk: boolean;
}

/**
 * Watch device geolocation continuously and expose reactive GPS data.
 * 注意：在 iOS 上需要 https + 用户交互后才能拿到 heading。
 */
export function useGpsWatcher(): GpsState {
  const [latLng, setLatLng] = useState<L.LatLng | null>(null);
  const [speedKts, setSpeedKts] = useState<number | null>(null);
  const [headingDeg, setHeadingDeg] = useState<number | null>(null);
  const [trackBearing, setTrackBearing] = useState<number | null>(null);
  const [gpsOk, setGpsOk] = useState<boolean>(false);

  // internal refs
  const watchIdRef = useRef<number | null>(null);
  const lastLatLngRef = useRef<L.LatLng | null>(null);
  const lastTsRef = useRef<number>(0);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('[GPS] geolocation not supported');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading } =
          pos.coords as GeolocationCoordinates & { heading: number };
        const ll = L.latLng(latitude, longitude);
        setLatLng(ll);

        if (speed != null && !Number.isNaN(speed)) {
          setSpeedKts(speed * 1.94384); // m/s → knots
        }
        if (heading != null && !Number.isNaN(heading)) {
          setHeadingDeg(heading);
        }

        // track bearing computed from successive points
        if (lastLatLngRef.current) {
          const brg = calcBearing(
            lastLatLngRef.current.lat,
            lastLatLngRef.current.lng,
            latitude,
            longitude
          );
          setTrackBearing(brg);
        }
        lastLatLngRef.current = ll;
        lastTsRef.current = Date.now();
        setGpsOk(true);
      },
      (err) => {
        console.error('[GPS] error', err);
        setGpsOk(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 2000 }
    );

    // health checker
    const healthTimer = setInterval(() => {
      if (Date.now() - lastTsRef.current > 2500) {
        setGpsOk(false);
      }
    }, 1000);

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      clearInterval(healthTimer);
    };
  }, []);

  return { latLng, speedKts, headingDeg, trackBearing, gpsOk };
} 