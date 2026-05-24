import { useState, useEffect } from 'react';
import { getDashboardStats } from '@/services/dashboardServices';
import type { DashboardStats } from '@/services/dashboardServices';

interface UseDashboardStatsResult {
    stats:   DashboardStats | null;
    loading: boolean;
    error:   string | null;
    refresh: () => void;
}

export function useDashboardStats(): UseDashboardStatsResult {
    const [stats,   setStats]   = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState<string | null>(null);
    const [tick,    setTick]    = useState(0);

    useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setError(null);

        getDashboardStats()
            .then(data => { if (!cancelled) setStats(data); })
            .catch(() => {
                if (!cancelled)
                    setError('No se pudieron cargar las estadísticas. Verifica tu conexión.');
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [tick]);

    const refresh = () => setTick(t => t + 1);

    return { stats, loading, error, refresh };
}
