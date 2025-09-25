import React from 'react';
import { X } from 'lucide-react';

export type Tone = 'ok' | 'warn' | 'error';

export interface DetailRow {
  label: string;
  value: string;
  tone: Tone;
  secondary?: string;
}

interface NetworkStatusDialogProps {
  open: boolean;
  onClose: () => void;
  rows: DetailRow[];
  timestamp: number;
  title: string;
  updatedLabel: string;
  closeLabel: string;
}

const toneDot = (tone: Tone) => {
  const color = tone === 'ok' ? 'bg-green-500' : tone === 'warn' ? 'bg-amber-500' : 'bg-red-500';
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-hidden />;
};

export const NetworkStatusDialog: React.FC<NetworkStatusDialogProps> = ({
  open,
  onClose,
  rows,
  timestamp,
  title,
  updatedLabel,
  closeLabel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-background p-4 shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">
              {updatedLabel} {new Date(timestamp).toLocaleTimeString()}
            </p>
          </div>
          <button
            type="button"
            className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          {rows.map(row => (
            <div key={row.label} className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-foreground">{row.label}</span>
                <div className="flex items-center gap-2 text-foreground">
                  {toneDot(row.tone)}
                  <span>{row.value}</span>
                </div>
              </div>
              {row.secondary && (
                <div className="mt-1 text-xs text-muted-foreground">{row.secondary}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
