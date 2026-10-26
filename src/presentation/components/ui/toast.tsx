'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'default' | 'success' | 'destructive' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const { id, title, description, variant = 'default', action } = toast;

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          container: 'bg-card border-emerald-500/30 text-card-foreground shadow-emerald-500/5',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
          title: 'text-foreground font-semibold',
          desc: 'text-muted-foreground',
        };
      case 'destructive':
        return {
          container: 'bg-card border-rose-500/30 text-card-foreground shadow-rose-500/5',
          icon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />,
          title: 'text-rose-600 dark:text-rose-400 font-semibold',
          desc: 'text-muted-foreground',
        };
      case 'warning':
        return {
          container: 'bg-card border-amber-500/30 text-card-foreground shadow-amber-500/5',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
          title: 'text-amber-600 dark:text-amber-400 font-semibold',
          desc: 'text-muted-foreground',
        };
      case 'info':
        return {
          container: 'bg-card border-blue-500/30 text-card-foreground shadow-blue-500/5',
          icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />,
          title: 'text-blue-600 dark:text-blue-400 font-semibold',
          desc: 'text-muted-foreground',
        };
      default:
        return {
          container: 'bg-card border-border text-card-foreground',
          icon: null,
          title: 'text-foreground font-semibold',
          desc: 'text-muted-foreground',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 duration-200',
        styles.container
      )}
    >
      {styles.icon}
      <div className="flex-1 min-w-0 pr-2">
        <h4 className={cn('text-xs tracking-tight', styles.title)}>{title}</h4>
        {description && (
          <p className={cn('text-[11px] leading-relaxed mt-1', styles.desc)}>
            {description}
          </p>
        )}
        {action && (
          <button
            type="button"
            onClick={() => {
              action.onClick();
              onDismiss(id);
            }}
            className="mt-2 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
        aria-label="Tutup Notifikasi"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

