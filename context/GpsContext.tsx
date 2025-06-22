'use client';
import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import { watchPositionThrottled, clearWatch } from '../utils/geoThrottle';

interface PositionState {
  lat: number;
  lng: number;
  accuracy: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

interface GpsContextValue {
  position: PositionState | null;
  error: GeolocationPositionError | null;
  tracking: boolean;
  start: () => void;
  stop: () => void;
  fetchOnce: () => void;
}

const GpsContext = createContext<GpsContextValue | undefined>(undefined);

export const useGps = () => {
  const ctx = useContext(GpsContext);
  if (!ctx) throw new Error('useGps must be used within <GpsProvider>');
  return ctx;
};

export const GpsProvider: React.FC<{ children: React.ReactNode; throttleMs?: number }> = ({ children, throttleMs = 1000 }) => {
  const [position, setPosition] = useState<PositionState | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [tracking, setTracking] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const lastCbTsRef = useRef<number>(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearExistingWatch = () => {
    if (watchIdRef.current != null) {
      clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const handleSuccess: PositionCallback = (pos) => {
    const { latitude, longitude, accuracy, heading, speed } = pos.coords;
    const ts = pos.timestamp;
    setPosition({ lat: latitude, lng: longitude, accuracy, heading, speed, timestamp: ts });
    lastCbTsRef.current = Date.now();
  };

  const handleError: PositionErrorCallback = (err) => {
    setError(err);
  };

  const start = () => {
    if (tracking) return;
    setTracking(true);
  };

  const stop = () => {
    setTracking(false);
  };

  const fetchOnce = () => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: 'Geolocation unsupported', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as any);
      return;
    }
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, { enableHighAccuracy: true, maximumAge: 0, timeout: 2000 });
  };

  // manage watch
  useEffect(() => {
    if (!tracking) {
      clearExistingWatch();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    watchIdRef.current = watchPositionThrottled(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 2000,
      throttleTime: throttleMs,
    });

    // polling fallback
    pollIntervalRef.current = setInterval(() => {
      if (Date.now() - lastCbTsRef.current > throttleMs + 200) {
        fetchOnce();
      }
    }, throttleMs);

    return () => {
      clearExistingWatch();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [tracking, throttleMs]);

  // auto start once mounted
  useEffect(() => {
    start();
    return () => stop();
  }, []);

  const ctxValue: GpsContextValue = {
    position,
    error,
    tracking,
    start,
    stop,
    fetchOnce,
  };

  return <GpsContext.Provider value={ctxValue}>{children}</GpsContext.Provider>;
}; 