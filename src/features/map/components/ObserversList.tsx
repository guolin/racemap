import React, { useMemo } from 'react';
import { useT } from 'src/locale';

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
  isVisible?: boolean;
}

export const ObserversList: React.FC<ObserversListProps> = ({ observers, currentObserverId, isVisible = true }) => {
  const t = useT();
  const sortedObservers = useMemo(
    () => observers.filter(o => o.id !== currentObserverId).sort((a, b) => b.ts - a.ts),
    [observers, currentObserverId]
  );

  if (!isVisible) return null;

  return (
    <div className="absolute top-16 right-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 text-sm min-w-[200px] z-[1200]">
      <div className="font-bold mb-3 flex items-center gap-2 text-foreground">
        <span>{t('observers.title')}</span>
        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs">
          {sortedObservers.length + 1}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2 p-2 bg-primary/10 rounded border border-primary/20">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span className="font-medium text-foreground">{currentObserverId}</span>
        <span className="text-xs text-muted-foreground">({t('observers.me')})</span>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {sortedObservers.map(obs => {
          const timeDiff = Date.now() - obs.ts;
          const isRecent = timeDiff < 10_000;
          const secondsAgo = Math.round(timeDiff / 1000);
          return (
            <div key={obs.id} className="flex items-center gap-2 mb-1 p-2 rounded hover:bg-muted/50 transition-colors">
              <div className={`w-2 h-2 rounded-full ${isRecent ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="flex-1 text-foreground">{obs.id}</span>
              <span className={`text-xs ${isRecent ? 'text-green-600' : 'text-yellow-600'}`}>
                {secondsAgo}{t('observers.seconds_ago')}
              </span>
            </div>
          );
        })}
      </div>

      {sortedObservers.length === 0 && (
        <div className="text-muted-foreground text-center py-3 text-sm">
          {t('observers.no_others')}
        </div>
      )}
    </div>
  );
}; 