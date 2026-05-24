import { Users, Warehouse, Shield, Tag, Briefcase } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { EntityStatsCard } from '@/components/EntityStatsCard';

function DashboardPage() {
    const { stats, loading, error, refresh } = useDashboardStats();

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <p className="text-gray-500 text-sm">{error}</p>
                    <button
                        onClick={refresh}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:opacity-85 transition-opacity"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4" translate="no">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Resumen general del sistema</p>
                </div>

                {/* Cards grid */}
                <div className="flex flex-col gap-4">

                    <EntityStatsCard
                        title="Usuarios"
                        icon={<Users size={16} />}
                        loading={loading}
                        stats={[
                            { label: 'Total',          value: stats?.users.total        ?? null },
                            { label: 'Habilitados',    value: stats?.users.enabled      ?? null, color: 'green'  },
                            { label: 'Deshabilitados', value: stats?.users.disabled     ?? null, color: 'red'    },
                            { label: 'No activados',   value: stats?.users.notActivated ?? null, color: 'yellow' },
                        ]}
                    />

                    <EntityStatsCard
                        title="Bodegas"
                        icon={<Warehouse size={16} />}
                        loading={loading}
                        stats={[
                            { label: 'Total',          value: stats?.warehouses.total    ?? null },
                            { label: 'Habilitadas',    value: stats?.warehouses.enabled  ?? null, color: 'green' },
                            { label: 'Deshabilitadas', value: stats?.warehouses.disabled ?? null, color: 'red'   },
                        ]}
                    />

                    <EntityStatsCard
                        title="EPPs"
                        icon={<Shield size={16} />}
                        loading={loading}
                        stats={[
                            { label: 'Total',    value: stats?.epps.total    ?? null },
                            { label: 'Activos',  value: stats?.epps.active   ?? null, color: 'green' },
                            { label: 'Inactivos',value: stats?.epps.inactive ?? null, color: 'red'   },
                        ]}
                    />

                    <EntityStatsCard
                        title="Categorías"
                        icon={<Tag size={16} />}
                        loading={loading}
                        stats={[
                            { label: 'Total', value: stats?.categories.total ?? null },
                        ]}
                    />

                    <EntityStatsCard
                        title="Cargos"
                        icon={<Briefcase size={16} />}
                        loading={loading}
                        stats={[
                            { label: 'Total', value: stats?.positions.total ?? null },
                        ]}
                    />

                </div>
            </div>
        </div>
    );
}

export default DashboardPage;