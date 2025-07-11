'use client';
import React, { useState, useMemo, useEffect } from 'react';
import TopBar from '../../src/features/map/components/TopBar';
import Clock from '../../src/features/map/components/Clock';

// Simple helper to parse HHMM or HHMMSS numeric strings to seconds from midnight
function parseTimeString(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d{4}(\d{2})?$/.test(trimmed)) return null;
  if (trimmed.length === 4) {
    const h = parseInt(trimmed.slice(0, 2), 10);
    const m = parseInt(trimmed.slice(2, 4), 10);
    if (h > 23 || m > 59) return null;
    return h * 3600 + m * 60;
  }
  const h = parseInt(trimmed.slice(0, 2), 10);
  const m = parseInt(trimmed.slice(2, 4), 10);
  const s = parseInt(trimmed.slice(4, 6), 10);
  if (h > 23 || m > 59 || s > 59) return null;
  return h * 3600 + m * 60 + s;
}

function formatTime(seconds: number | null): string {
  if (seconds == null || isNaN(seconds)) return '';
  const s = ((seconds % 60) + 60) % 60;
  const totalMinutes = Math.floor(seconds / 60);
  const m = ((totalMinutes % 60) + 60) % 60;
  const h = ((Math.floor(totalMinutes / 60)) + 24) % 24;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function TimerPage() {
  const [warning, setWarning] = useState('');
  const [firstFinish, setFirstFinish] = useState('');
  const [lastFinish, setLastFinish] = useState('');
  const [now, setNow] = useState<Date>(new Date());

  const warningSec = useMemo(() => parseTimeString(warning), [warning]);
  const firstFinishSec = useMemo(() => parseTimeString(firstFinish), [firstFinish]);
  const lastFinishSec = useMemo(() => parseTimeString(lastFinish), [lastFinish]);

  const preparatorySec = useMemo(() => (warningSec != null ? warningSec + 60 : null), [warningSec]);
  const oneMinSec = useMemo(() => (warningSec != null ? warningSec + 240 : null), [warningSec]);
  const startSec = useMemo(() => (warningSec != null ? warningSec + 300 : null), [warningSec]);
  const startLimitSec = useMemo(() => (startSec != null ? startSec + 240 : null), [startSec]);
  const mark1LimitSec = useMemo(() => (startSec != null ? startSec + 1500 : null), [startSec]);
  const finishLimitSec = useMemo(() => (startSec != null ? startSec + 3600 : null), [startSec]);

  const gateCloseSec = useMemo(() => (firstFinishSec != null ? firstFinishSec + 600 : null), [firstFinishSec]);
  const protestLimitSec = useMemo(() => (lastFinishSec != null ? lastFinishSec + 2400 : null), [lastFinishSec]);

  const signalRows = [
    { rel: -5, label: '预告信号', sec: warningSec },
    { rel: -4, label: '准备信号', sec: preparatorySec },
    { rel: -1, label: '1 分钟信号', sec: oneMinSec },
    { rel: 0, label: '启航信号', sec: startSec },
    { rel: 4, label: '起航线限制', sec: startLimitSec },
    { rel: 25, label: '一标时限', sec: mark1LimitSec },
    { rel: 60, label: '终点时限', sec: finishLimitSec },
  ];

  const inputClass = 'border p-2 rounded w-full';
  const labelClass = 'font-medium';

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const nowStr = formatTime(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());

  return (
    <>
      <TopBar center="TIMER" right={<Clock />} />
      <div className="max-w-2xl mx-auto p-4 space-y-6 mt-16">

        {/* Warning Signal */}
        <div>
          <label className={labelClass}>预告信号时间 (HHMM 或 HHMMSS)</label>
          <input
            className={inputClass}
            value={warning}
            onChange={(e) => setWarning(e.target.value)}
            placeholder="例如 132500"
          />
        </div>

        <div className="space-y-2">
          {signalRows.map((row) => (
            <div
              key={row.label}
              className={`flex items-center space-x-4 ${row.rel === 0 ? 'text-red-600 font-bold' : ''}`}
            >
              <span className="w-16 text-right">
                {row.rel > 0 ? `+${row.rel}` : row.rel}min
              </span>
              <span className="flex-1">{row.label}</span>
              <span className="tabular-nums font-mono text-2xl">{row.sec != null ? formatTime(row.sec) : ''}</span>
            </div>
          ))}
        </div>

        {/* Finish Times */}
        <div>
          <label className={labelClass}>第一个冲终点时间</label>
          <input
            className={inputClass}
            value={firstFinish}
            onChange={(e) => setFirstFinish(e.target.value)}
            placeholder="例如 141230"
          />
          <div className="mt-2">
            <span className={labelClass}>关门时间 (+10 min): </span>
            <span className={`${gateCloseSec != null ? 'text-red-600 font-bold' : ''} text-2xl font-mono`}>{gateCloseSec != null ? formatTime(gateCloseSec) : ''}</span>
          </div>
        </div>

        <div>
          <label className={labelClass}>最后一个终点时间</label>
          <input
            className={inputClass}
            value={lastFinish}
            onChange={(e) => setLastFinish(e.target.value)}
            placeholder="例如 145500"
          />
          <div className="mt-2">
            <span className={labelClass}>抗议时限 (+40 min): </span>
            <span className="text-2xl font-mono">{protestLimitSec != null ? formatTime(protestLimitSec) : ''}</span>
          </div>
        </div>
      </div>
    </>
  );
} 