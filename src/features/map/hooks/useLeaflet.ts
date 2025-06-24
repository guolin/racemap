import { useEffect, useRef } from 'react';
import L from 'leaflet';

/**
 * Initialize a Leaflet map once per component lifecycle and clean it up when unmounted.
 * Returns the map instance (ref.current) after creation.
 *
 * NOTE: This hook **only** sets up the map container with given id and basic tileLayer.
 * It does NOT handle markers, bearing, or event listeners – leaving those to caller.
 */
export function useLeafletMap(containerId: string) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current) return;
    // Create map
    const map = L.map(containerId, {
      zoomControl: false,
      rotate: true,
    } as L.MapOptions & { rotate: boolean });
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      {
        attribution: '©OpenStreetMap, ©CartoDB',
        subdomains: 'abcd',
        maxZoom: 19,
        noWrap: true,
        crossOrigin: true,
      }
    ).addTo(map);
    map.setView([39.9042, 116.4074], 12);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [containerId]);

  return mapRef;
} 