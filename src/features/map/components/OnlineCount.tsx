import React from 'react';

interface Props {
  count: number;
}

export const OnlineCount: React.FC<Props> = ({ count }) => (
  <div
    style={{
      position: 'absolute',
      top: 8,
      right: 8,
      background: 'rgba(255,255,255,0.8)',
      padding: '2px 6px',
      borderRadius: 4,
      fontSize: 12,
      zIndex: 1200,
    }}
  >
    👤 {count}
  </div>
); 