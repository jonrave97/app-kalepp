import type { ReactNode } from 'react';
import { StatCard } from './StatCard';

interface StatItem {
    label: string;
    value: number | null;
    color?: 'default' | 'green' | 'red' | 'yellow';
}

interface EntityStatsCardProps {
    title:   string;
    icon:    ReactNode;
    stats:   StatItem[];
    loading: boolean;
}

function SkeletonPulse({ className }: { className: string }) {
    return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function EntityStatsCard({ title, icon, stats, loading }: EntityStatsCardProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <span className="text-primary">{icon}</span>
                <h2 className="text-base font-semibold text-gray-700 uppercase tracking-wide">
                    {title}
                </h2>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-10">
                {loading
                    ? Array.from({ length: stats.length || 2 }).map((_, i) => (
                          <div key={i} className="flex flex-col gap-2">
                              <SkeletonPulse className="h-9 w-16" />
                              <SkeletonPulse className="h-3 w-24" />
                          </div>
                      ))
                    : stats.map(s => (
                          <StatCard key={s.label} label={s.label} value={s.value} color={s.color} />
                      ))}
            </div>
        </div>
    );
}
