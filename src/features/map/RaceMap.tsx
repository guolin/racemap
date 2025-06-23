'use client';
import LegacyMap from '@features/map/LegacyMap';

interface Props {
  courseId: string;
  isAdmin?: boolean;
}

export default function RaceMap({ courseId, isAdmin }: Props) {
  return <LegacyMap courseId={courseId} isAdmin={isAdmin} />;
} 