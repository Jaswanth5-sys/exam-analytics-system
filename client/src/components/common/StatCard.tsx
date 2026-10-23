import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-brand-50 text-brand-600',
      border: 'border-brand-100',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600',
      border: 'border-purple-100',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600',
      border: 'border-rose-100',
    },
  };

  const current = colorMap[color];

  return (
    <div className={`p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm transition hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          {trend && (
            <p className="mt-2 text-xs font-medium text-emerald-600 flex items-center gap-1">
              <span>↑</span> {trend}
            </p>
          )}
        </div>
        <div className={`p-3.5 rounded-xl ${current.bg} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
