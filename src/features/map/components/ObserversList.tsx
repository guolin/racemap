import React, { useMemo } from 'react';

interface ObserverPos {
  id: string;
  lat: number;
  lng: number;
  heading: number | null;
  ts: number;
}

interface ObserversListProps {
  observers: ObserverPos[];
  currentObserverId: string;
}

export const ObserversList: React.FC<ObserversListProps> = ({ observers, currentObserverId }) => {
  const sortedObservers = useMemo(
    () => observers.filter(o => o.id !== currentObserverId).sort((a, b) => b.ts - a.ts),
    [observers, currentObserverId]
  );

  return (
    <div className="absolute top-20 right-4 bg-black/80 text-white rounded-lg p-3 text-xs min-w-[180px] z-[1100]">
      <div className="font-bold mb-2 flex items-center gap-2">
        <span>在线裁判</span>
        <span className="bg-blue-500 px-1.5 py-0.5 rounded">{sortedObservers.length + 1}</span>
      </div>

      <div className="flex items-center gap-2 mb-2 p-1 bg-blue-500/20 rounded">
        <div className="w-2 h-2 rounded-full bg-blue-400" />
        <span className="font-medium">{currentObserverId} (我)</span>
      </div>

      {sortedObservers.map(obs => {
        const timeDiff = Date.now() - obs.ts;
        const isRecent = timeDiff < 10_000;
        const secondsAgo = Math.round(timeDiff / 1000);
        return (
          <div key={obs.id} className="flex items-center gap-2 mb-1 p-1 rounded hover:bg-white/10">
            <div className={`w-2 h-2 rounded-full ${isRecent ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className="flex-1">{obs.id}</span>
            <span className={`text-xs ${isRecent ? 'text-green-300' : 'text-yellow-300'}`}>{secondsAgo}s前</span>
          </div>
        );
      })}

      {sortedObservers.length === 0 && <div className="text-gray-400 text-center py-2">暂无其他裁判在线</div>}
    </div>
  );
}; 