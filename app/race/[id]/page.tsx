'use client';
import dynamic from 'next/dynamic';
import { getMyRaceId } from '../../../utils/race';
import SimpleLoading from '../../../components/SimpleLoading';
import { useState, useEffect } from 'react';

const RaceMap = dynamic(() => import('@features/map/RaceMap'), { ssr: false });

export default function RacePage({ params }: { params: { id: string } }) {
  console.debug('[RacePage] component initialized, params:', params);
  const [isLoading, setIsLoading] = useState(true);
  const id = params.id.toUpperCase();
  const myId = typeof window !== 'undefined' ? getMyRaceId() : '';
  const isAdmin = id === myId;
  console.debug('[RacePage] id:', id, 'myId:', myId, 'isAdmin:', isAdmin);

  // 简单的loading，2秒后自动消失
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {isLoading && <SimpleLoading />}
      <RaceMap courseId={id} isAdmin={isAdmin} />
    </>
  );
} 