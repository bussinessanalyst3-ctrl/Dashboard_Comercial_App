import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subValue?: string;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'danger' | 'neutral';
  progress?: number | null;
  icon?: React.ReactNode;
  category?: 'toneladas' | 'facturacion' | 'cobertura';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subValue,
  badge,
  badgeType = 'neutral',
  progress,
  icon,
  category = 'toneladas'
}) => {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'success':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'warning':
        return 'text-amber-800 bg-amber-50 border-amber-200';
      case 'danger':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getProgressColor = () => {
    if (progress === null || progress === undefined) return 'bg-slate-300';
    if (progress >= 100) return 'bg-emerald-500';
    if (progress >= 85) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getCategoryBorder = () => {
    switch (category) {
      case 'toneladas':
        return 'hover:border-slate-400';
      case 'facturacion':
        return 'hover:border-slate-400';
      case 'cobertura':
        return 'hover:border-slate-400';
      default:
        return 'hover:border-slate-300';
    }
  };

  return (
    <div
      className={`relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4.5 shadow-2xs transition-all ${getCategoryBorder()}`}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          {icon && <div className="text-slate-400">{icon}</div>}
        </div>

        {/* Primary Value */}
        <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 font-mono">
          {value}
        </div>
      </div>

      {/* Footer / Subvalue / Badge */}
      <div className="mt-3 pt-2.5 border-t border-slate-100">
        {progress !== undefined && progress !== null && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500 font-medium">Meta alcanzada</span>
              <span className="font-bold text-slate-900 font-mono">{progress.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${getProgressColor()}`}
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          {subValue ? (
            <span className="text-slate-500 text-[11px] font-medium leading-none">
              {subValue}
            </span>
          ) : (
            <span />
          )}

          {badge && (
            <span
              className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-bold leading-none ${getBadgeStyle()}`}
            >
              {badgeType === 'success' && <TrendingUp className="h-3 w-3" />}
              {badgeType === 'danger' && <TrendingDown className="h-3 w-3" />}
              {badgeType === 'neutral' && <Minus className="h-3 w-3" />}
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
