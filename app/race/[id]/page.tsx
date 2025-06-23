'use client';
import dynamic from 'next/dynamic';
import { getMyRaceId } from '../../../utils/race';

const RaceMap = dynamic(() => import('@features/map/RaceMap'), { ssr: false });

export default function RacePage({ params }: { params: { id: string } }) {
  console.debug('[RacePage] component initialized, params:', params);
  const id = params.id.toUpperCase();
  const myId = typeof window !== 'undefined' ? getMyRaceId() : '';
  const isAdmin = id === myId;
  console.debug('[RacePage] id:', id, 'myId:', myId, 'isAdmin:', isAdmin);
  return <RaceMap courseId={id} isAdmin={isAdmin} />;
} 