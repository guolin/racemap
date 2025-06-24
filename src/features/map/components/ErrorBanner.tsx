'use client';
import React from 'react';

interface Props {
  message: string | null;
}

/**
 * 顶部错误提示条
 */
const ErrorBanner: React.FC<Props> = ({ message }) => {
  if (!message) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        background: 'rgba(200,0,0,0.9)',
        color: '#fff',
        padding: '6px 12px',
        textAlign: 'center',
        zIndex: 1200,
      }}
    >
      {message}
    </div>
  );
};

export default ErrorBanner; 