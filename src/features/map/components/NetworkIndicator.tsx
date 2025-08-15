import React from 'react';
import type { NetworkStatus } from '@features/network/hooks/useNetworkStatus';
import { useT } from 'src/locale';

interface NetworkIndicatorProps {
  status: NetworkStatus;
  className?: string;
  compact?: boolean;
}

export const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({ status, className = '', compact = false }) => {
  const t = useT();
  const statusConfig = {
    online: { color: compact ? 'bg-success/80' : 'bg-success', icon: '🟢', priority: 'low' },
    offline: { color: compact ? 'bg-destructive/80' : 'bg-destructive', icon: '🔴', priority: 'critical' },
    mqtt_error: { color: compact ? 'bg-warning/80' : 'bg-warning', icon: '🟡', priority: 'high' },
    stale: { color: compact ? 'bg-warning/60' : 'bg-warning/80', icon: '🟠', priority: 'medium' },
  } as const;

  const config = statusConfig[status.status];
  const msgKey =
    status.status === 'online'
      ? 'network.online'
      : status.status === 'offline'
      ? 'network.offline'
      : status.status === 'mqtt_error'
      ? 'network.mqtt_error'
      : 'network.stale';

  const base = compact
    ? 'px-1.5 py-0.5 rounded text-[10px] font-medium shadow-sm'
    : 'px-2 py-1 rounded text-xs font-semibold';
  const pulse = compact ? '' : config.priority !== 'low' ? 'animate-pulse' : '';

  return (
    <div
      className={`flex items-center gap-1 text-white ${config.color} ${base} ${pulse} ${className}`}
      aria-live="polite"
      title={t(msgKey)}
    >
      <span aria-hidden>{config.icon}</span>
      {!compact && <span className="truncate max-w-[40vw]">{t(msgKey)}</span>}
    </div>
  );
}; 