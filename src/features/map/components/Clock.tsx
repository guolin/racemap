import React, { useState, useEffect } from 'react';

interface ClockProps {
  className?: string;
}

/**
 * 实时时钟组件
 */
const Clock: React.FC<ClockProps> = ({ className = '' }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className={`tabular-nums font-mono text-base font-medium ${className}`}>
      {formatTime(time)}
    </div>
  );
};

export default Clock; 