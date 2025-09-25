import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { NetworkStatus } from '@features/network/hooks/useNetworkStatus';
import type { GpsState } from '@features/map/hooks/useGpsWatch';
import { useT } from 'src/locale';
import { NetworkStatusDialog, DetailRow, Tone } from './NetworkStatusDialog';

interface NetworkIndicatorProps {
  status: NetworkStatus;
  gpsState?: GpsState;
  className?: string;
  compact?: boolean;
  observerHeartbeatAt?: number | null;
  heartbeatWarnMs?: number;
  heartbeatAlertMs?: number;
}

const formatTime = (ts: number | null, fallback: string) => {
  if (!ts) return fallback;
  return new Date(ts).toLocaleTimeString();
};

export const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({
  status,
  gpsState,
  className = '',
  compact = false,
  observerHeartbeatAt,
  heartbeatWarnMs = 35_000,
  heartbeatAlertMs = 55_000,
}) => {
  const t = useT();
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (observerHeartbeatAt === undefined) return;
    setNow(Date.now());
    if (typeof window === 'undefined') return;
    const timer = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => window.clearInterval(timer);
  }, [observerHeartbeatAt]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const heartbeatAge = observerHeartbeatAt != null ? now - observerHeartbeatAt : null;

  const secondsLabel = useCallback(
    (seconds: number) => `${seconds}${t('network.unit.seconds')}`,
    [t],
  );

  const config = useMemo(() => {
    if (status.status === 'offline') {
      return {
        color: compact ? 'bg-destructive/80' : 'bg-destructive',
        icon: '🔴',
        message: t('network.button.offline'),
        priority: 'critical' as const,
      };
    }
    if (status.status === 'mqtt_error') {
      return {
        color: compact ? 'bg-warning/80' : 'bg-warning',
        icon: '🟡',
        message: t('network.button.connecting'),
        priority: 'high' as const,
      };
    }
    if (status.status === 'stale') {
      return {
        color: compact ? 'bg-warning/80' : 'bg-warning',
        icon: '🟡',
        message: t('network.button.stale'),
        priority: 'high' as const,
      };
    }

    if (gpsState?.errorMsg) {
      return {
        color: compact ? 'bg-red-500/80' : 'bg-red-500',
        icon: '🟢',
        message: t('network.button.gps_error'),
        priority: 'high' as const,
      };
    }
    if (gpsState && (!gpsState.ok || !gpsState.latLng)) {
      return {
        color: compact ? 'bg-orange-500/80' : 'bg-orange-500',
        icon: '🟢',
        message: t('network.button.gps_acquiring'),
        priority: 'medium' as const,
      };
    }
    if (gpsState?.accuracy && gpsState.accuracy > 100) {
      return {
        color: compact ? 'bg-yellow-500/80' : 'bg-yellow-500',
        icon: '🟢',
        message: t('network.button.gps_inaccurate'),
        priority: 'high' as const,
      };
    }

    if (observerHeartbeatAt !== undefined) {
      if (observerHeartbeatAt === null) {
        return {
          color: compact ? 'bg-orange-500/80' : 'bg-orange-500',
          icon: '🟢',
          message: t('network.button.waiting_upload'),
          priority: 'medium' as const,
        };
      }
      if (heartbeatAge != null) {
        const seconds = Math.round(heartbeatAge / 1000);
        if (heartbeatAge >= heartbeatAlertMs) {
          return {
            color: compact ? 'bg-red-500/80' : 'bg-red-500',
            icon: '🟢',
            message: `${t('network.button.heartbeat_prefix')}${secondsLabel(seconds)}${t('network.button.heartbeat_delay_suffix')}`,
            priority: 'critical' as const,
          };
        }
        if (heartbeatAge >= heartbeatWarnMs) {
          return {
            color: compact ? 'bg-orange-500/80' : 'bg-orange-500',
            icon: '🟢',
            message: `${t('network.button.heartbeat_prefix')}${secondsLabel(seconds)}${t('network.button.heartbeat_delay_suffix')}`,
            priority: 'high' as const,
          };
        }
      }
    }

    return {
      color: compact ? 'bg-success/80' : 'bg-success',
      icon: '🟢',
      message: t('network.button.online'),
      priority: 'low' as const,
    };
  }, [compact, gpsState, heartbeatAge, heartbeatAlertMs, heartbeatWarnMs, observerHeartbeatAt, secondsLabel, status.status, t]);

  const getGpsIcon = useCallback(() => {
    if (!gpsState) return null;
    if (gpsState.errorMsg) return '🚫';
    if (!gpsState.ok || !gpsState.latLng) return '🔄';
    if (gpsState.accuracy && gpsState.accuracy > 100) return '📍';
    return '🛰️';
  }, [gpsState]);

  const detailRows = useMemo<DetailRow[]>(() => {
    const rows: DetailRow[] = [];

    const networkTone: Tone = status.status === 'offline' ? 'error' : status.status === 'online' ? 'ok' : 'warn';
    const networkValue = (() => {
      switch (status.status) {
        case 'offline':
          return t('network.button.offline');
        case 'mqtt_error':
          return t('network.button.connecting');
        case 'stale':
          return t('network.button.stale');
        default:
          return t('network.button.online');
      }
    })();
    rows.push({
      label: t('network.network'),
      value: networkValue,
      tone: networkTone,
    });

    if (observerHeartbeatAt !== undefined) {
      if (observerHeartbeatAt === null) {
        rows.push({
          label: t('network.heartbeat'),
          value: t('network.heartbeat_waiting'),
          tone: 'warn',
          secondary: `${t('network.detail.heartbeat_time')}: ${t('network.detail.none')}`,
        });
      } else if (heartbeatAge != null) {
        const seconds = Math.round(heartbeatAge / 1000);
        const secondsText = secondsLabel(seconds);
        const tone: Tone = heartbeatAge >= heartbeatAlertMs ? 'error' : heartbeatAge >= heartbeatWarnMs ? 'warn' : 'ok';
        const value = tone === 'ok'
          ? t('network.heartbeat_ok')
          : `${secondsText}${t('network.heartbeat_delay_suffix')}`;
        const timeParts = [`${t('network.detail.heartbeat_time')}: ${formatTime(observerHeartbeatAt, t('network.detail.none'))}`];
        timeParts.push(`${seconds}${t('observers.seconds_ago')}`);
        rows.push({
          label: t('network.heartbeat'),
          value,
          tone,
          secondary: timeParts.join(' | '),
        });
      }
    }

    if (gpsState) {
      let tone: Tone = 'ok';
      let value = t('network.gps_normal');
      const parts: string[] = [];

      if (gpsState.errorMsg) {
        tone = 'error';
        value = t('network.gps_error');
        parts.push(gpsState.errorMsg);
      } else if (!gpsState.ok || !gpsState.latLng) {
        tone = 'warn';
        value = t('network.gps_loading');
      } else if (gpsState.accuracy != null) {
        const meters = Math.round(gpsState.accuracy);
        if (meters > 100) {
          tone = 'warn';
        }
        value = `${t('network.gps_accuracy')} ${meters}${t('network.unit.meters')}`;
      }

      if (gpsState.latLng) {
        parts.push(`${t('network.gps_coordinates')}: ${gpsState.latLng.lat.toFixed(5)}, ${gpsState.latLng.lng.toFixed(5)}`);
      }
      parts.push(`${t('network.detail.gps_time')}: ${formatTime(gpsState.updatedAt ?? null, t('network.detail.none'))}`);
      if (gpsState.headingDeg != null && Number.isFinite(gpsState.headingDeg)) {
        parts.push(`${t('network.gps_heading')}: ${Math.round(gpsState.headingDeg)}°`);
      }
      if (gpsState.speedKts != null && Number.isFinite(gpsState.speedKts)) {
        parts.push(`${t('network.gps_speed')}: ${gpsState.speedKts.toFixed(1)} ${t('network.unit.knots')}`);
      }

      rows.push({
        label: t('network.gps'),
        value,
        tone,
        secondary: parts.join(' | '),
      });
    }

    return rows;
  }, [gpsState, heartbeatAge, heartbeatAlertMs, heartbeatWarnMs, observerHeartbeatAt, secondsLabel, status.status, t]);

  const pulse = config.priority !== 'low' ? 'animate-pulse' : '';
  const base = compact
    ? 'px-3 py-1.5 rounded-full text-[11px] font-semibold shadow-md'
    : 'px-4 py-2 rounded-full text-sm font-semibold shadow-md';

  const tooltip = detailRows.map(row => `${row.label}: ${row.value}`).join(' | ');

  const handleOpen = () => {
    setNow(Date.now());
    setOpen(true);
  };

  const gpsIcon = getGpsIcon();

  return (
    <>
      <button
        type="button"
        className={`flex items-center gap-2 text-white ${config.color} ${base} ${pulse} ${className}`}
        aria-live="polite"
        title={tooltip}
        onClick={handleOpen}
      >
        <span aria-hidden>{config.icon}</span>
        {gpsIcon && <span aria-hidden>{gpsIcon}</span>}
        {!compact && <span className="truncate max-w-[40vw]">{config.message}</span>}
      </button>
      <NetworkStatusDialog
        open={open}
        onClose={() => setOpen(false)}
        rows={detailRows}
        timestamp={now}
        title={t('network.status_title')}
        updatedLabel={t('network.updated_at')}
        closeLabel={t('network.close')}
      />
    </>
  );
};
