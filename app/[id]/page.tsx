import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@components/Map'), { ssr: false });

export default function CoursePage({ params }: { params: { id: string } }) {
  return <MapView courseId={params.id.toUpperCase()} />;
} 