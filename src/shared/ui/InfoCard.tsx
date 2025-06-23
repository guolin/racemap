import React from 'react';

export interface InfoCardProps {
  title: string;
  value: string;
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, value, className }) => {
  return (
    <div
      className={`min-w-[120px] rounded-lg bg-white px-3 py-2 text-center shadow-md ${className ?? ''}`}
    >
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-gray-600">{title}</div>
    </div>
  );
}; 