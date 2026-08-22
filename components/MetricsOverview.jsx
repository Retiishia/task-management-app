'use client';

import { CheckCircle, Clock, AlertTriangle, Layers, TrendingUp } from 'lucide-react';
import appConfig from '@/data/appConfig.json';

const ICON_MAP = {
  Layers,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
};

const STATS = appConfig.metricsStats.map((item) => ({
  ...item,
  icon: ICON_MAP[item.icon] || Layers,
  format: (v, stats) => {
    if (item.key === 'completionRate') return `${v || 0}%`;
    if (item.key === 'urgent') return `${v || 0} (${stats?.overdue || 0} overdue)`;
    return v || 0;
  },
}));

export default function MetricsOverview({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {STATS.map(({ key, label, icon: Icon, color, bgColor, format }) => (
        <div key={key} className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {label}
            </p>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: bgColor }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
          </div>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            {key === 'urgent' ? stats[key] || 0 : format(stats[key], stats)}
          </p>
          {key === 'urgent' && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {stats?.overdue || 0} overdue
            </p>
          )}
          {key === 'completionRate' && (
            <div className="progress-bar mt-2">
              <div className="progress-fill" style={{ width: `${stats[key] || 0}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
