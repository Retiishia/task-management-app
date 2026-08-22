'use client';

import { CheckCircle, Clock, AlertTriangle, Layers, TrendingUp } from 'lucide-react';

const STATS = [
  {
    key: 'total',
    label: 'Total Tasks',
    icon: Layers,
    color: '#2563eb',
    bgColor: 'rgba(37,99,235,0.1)',
    format: (v) => v || 0,
  },
  {
    key: 'completionRate',
    label: 'Completion Rate',
    icon: TrendingUp,
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.1)',
    format: (v) => `${v || 0}%`,
  },
  {
    key: 'inProgress',
    label: 'In Progress',
    icon: Clock,
    color: '#06b6d4',
    bgColor: 'rgba(6,182,212,0.1)',
    format: (v) => v || 0,
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: CheckCircle,
    color: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.1)',
    format: (v) => v || 0,
  },
  {
    key: 'urgent',
    label: 'Urgent',
    icon: AlertTriangle,
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.1)',
    format: (v, stats) => `${v || 0} (${stats?.overdue || 0} overdue)`,
  },
];

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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: bgColor }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
          </div>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            {key === 'urgent'
              ? stats[key] || 0
              : format(stats[key], stats)}
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
