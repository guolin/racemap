'use client';
import dynamic from 'next/dynamic';
import { getMyRaceId } from '../../../utils/race';
import LoadingScreen from '../../../components/LoadingScreen';
import { useState, useEffect } from 'react';

const RaceMap = dynamic(() => import('@features/map/RaceMap'), { ssr: false });

export default function RacePage({ params }: { params: { id: string } }) {
  console.debug('[RacePage] component initialized, params:', params);
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const id = params.id.toUpperCase();
  const myId = typeof window !== 'undefined' ? getMyRaceId() : '';
  const isAdmin = id === myId;
  console.debug('[RacePage] id:', id, 'myId:', myId, 'isAdmin:', isAdmin);

  // 模拟地图加载完成
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      {isLoading && (
        <LoadingScreen 
          onLoadingComplete={handleLoadingComplete} 
          minDisplayTime={2000}
          dependencies={[
            // 等待地图组件加载
            new Promise(resolve => {
              if (mapLoaded) resolve(true);
              else {
                const checkLoaded = () => {
                  if (mapLoaded) resolve(true);
                  else setTimeout(checkLoaded, 100);
                };
                checkLoaded();
              }
            })
          ]}
        />
      )}
      <RaceMap courseId={id} isAdmin={isAdmin} />
    </>
  );
} 