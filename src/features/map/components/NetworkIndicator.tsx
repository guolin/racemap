import React from 'react';
import type { NetworkStatus } from '@features/network/hooks/useNetworkStatus';
import type { GpsState } from '@features/map/hooks/useGpsWatch';
import { useT } from 'src/locale';

interface NetworkIndicatorProps {
  status: NetworkStatus;
  gpsState?: GpsState;
  className?: string;
  compact?: boolean;
}

export const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({ status, gpsState, className = '', compact = false }) => {
  const t = useT();
  
  // 判断整体状态优先级：网络 > GPS
  const getOverallStatus = () => {
    // 网络问题最优先显示
    if (status.status !== 'online') {
      return {
        color: status.status === 'offline' 
          ? (compact ? 'bg-destructive/80' : 'bg-destructive')
          : (compact ? 'bg-warning/80' : 'bg-warning'),
        networkIcon: status.status === 'offline' ? '🔴' : '🟡',
        message: status.message,
        priority: status.status === 'offline' ? 'critical' : 'high'
      };
    }
    
    // 网络正常时，检查GPS状态
    if (gpsState) {
      // GPS有错误信息
      if (gpsState.errorMsg) {
        return {
          color: compact ? 'bg-red-500/80' : 'bg-red-500',
          networkIcon: '🟢',
          message: gpsState.errorMsg,
          priority: 'high'
        };
      }
      // GPS未获得位置
      if (!gpsState.ok || !gpsState.latLng) {
        return {
          color: compact ? 'bg-orange-500/80' : 'bg-orange-500',
          networkIcon: '🟢',
          message: 'GPS获取中...',
          priority: 'medium'
        };
      }
      // GPS精度较差 (>100米)
      if (gpsState.accuracy && gpsState.accuracy > 100) {
        return {
          color: compact ? 'bg-yellow-500/80' : 'bg-yellow-500',
          networkIcon: '🟢',
          message: `GPS精度较差 (${Math.round(gpsState.accuracy)}m)`,
          priority: 'low'
        };
      }
    }
    
    // 都正常
    return {
      color: compact ? 'bg-success/80' : 'bg-success',
      networkIcon: '🟢',
      message: '实时同步中',
      priority: 'low'
    };
  };

  const config = getOverallStatus();
  
  // GPS状态图标
  const getGpsIcon = () => {
    if (!gpsState) return null;
    if (gpsState.errorMsg) return '🚫'; // GPS错误
    if (!gpsState.ok || !gpsState.latLng) return '🔄'; // GPS获取中
    if (gpsState.accuracy && gpsState.accuracy > 100) return '📍'; // GPS精度差
    return '🛰️'; // GPS正常
  };

  const gpsIcon = getGpsIcon();
  const base = compact
    ? 'px-1.5 py-0.5 rounded text-[10px] font-medium shadow-sm'
    : 'px-2 py-1 rounded text-xs font-semibold';
  const pulse = compact ? '' : config.priority !== 'low' ? 'animate-pulse' : '';

  return (
    <div
      className={`flex items-center gap-1 text-white ${config.color} ${base} ${pulse} ${className}`}
      aria-live="polite"
      title={`网络: ${status.message}${gpsState ? ` | GPS: ${gpsState.errorMsg ? gpsState.errorMsg : !gpsState.ok ? '获取中' : gpsState.accuracy ? `精度${Math.round(gpsState.accuracy)}m` : '已连接'}` : ''}`}
    >
      <span aria-hidden>{config.networkIcon}</span>
      {gpsIcon && <span aria-hidden>{gpsIcon}</span>}
      {!compact && <span className="truncate max-w-[40vw]">{config.message}</span>}
    </div>
  );
}; 