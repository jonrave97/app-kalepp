import { useEffect, useRef, useState } from 'react';
import { Search, ArrowLeft, Eye, User2, ChevronDown } from 'lucide-react';
import { useMyTeam } from '@/hooks/users/useMyTeam';
import { useEmployeeRequests, type EmployeeRequestStatus } from '@/hooks/requests/useEmployeeRequests';
import { RequestDetailModal, StatusBadge } from '@/components/requests/RequestDetailModal';
import { formatDate } from '@/components/requests/requestHelpers';
import type { TeamMember } from '@/services/userAdminServices';
import type { AdminRequest } from '@/services/requestServices';

// ─── Tarjeta de miembro del equipo ───────────────────────────────────────────
function TeamMemberCard({ member, onSelect }: { member: TeamMember; onSelect: () => void }) {
    const positionName =
        member.position && typeof member.position === 'object'
            ? member.position.name
            : (member.position as string | null | undefined) ?? '—';

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <User2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 capitalize truncate">{member.name}</p>
                <p className="text-xs text-gray-400 truncate">{member.email}</p>
                <p className="text-xs text-gray-500 mt-0.5">{positionName}</p>
            </div>
            <button
                onClick={onSelect}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-orange-200 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer"
            >
                <Eye className="w-3.5 h-3.5" />
                Ver solicitudes
            </button>
        </div>
    );
}

// ─── Estado vacío ─────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
    return (
        <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <User2 className="w-10 h-10 opacity-30" />
            <p className="text-sm">{message}</p>
        </div>
    );
}

// ─── Vista: historial de solicitudes de un miembro ───────────────────────────
const STATUS_OPTIONS: { label: string; value: EmployeeRequestStatus }[] = [
    { label: 'Todos los estados',    value: '' },
    { label: 'Pendiente',            value: 'Pendiente' },
    { label: 'Aprobada',             value: 'Aprobada' },
    { label: 'Sin Stock',            value: 'Sin Stock' },
    { label: 'Entregada',            value: 'Entregada' },
    { label: 'Cambios solicitados',  value: 'Cambios solicitados' },
];

function MemberRequestsView({
    member,
    onBack,
}: {
    member: TeamMember;
    onBack: () => void;
}) {
    const {
        requests, total, pages, page,
        inputSearch, setInputSearch,
        statusFilter, loading,
        fetchRequests,
        handleSearch,
        handlePageChange,
        handleStatusChange,
        handleClear,
    } = useEmployeeRequests(member._id);

    const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
    const [dropdownOpen, setDropdownOpen]        = useState(false);
    const dropdownRef                            = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchRequests(1, '');
    }, [fetchRequests]);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const currentStatusLabel =
        STATUS_OPTIONS.find(o => o.value === statusFilter)?.label ?? 'Todos los estados';

    return (
        <>
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-5xl mx-auto space-y-4">

                {/* Encabezado */}
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-3 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a Mi Equipo
                    </button>
                    <h1 className="text-xl font-semibold text-gray-900 capitalize">
                        Solicitudes de {member.name}
                    </h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {total} solicitud{total !== 1 ? 'es' : ''}
                    </p>
                </div>

                {/* Buscador + Filtro */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Buscar por EPP o código…"
                            value={inputSearch}
                            onChange={e => setInputSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    {/* Dropdown estado */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(prev => !prev)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                        >
                            {currentStatusLabel}
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden">
                                {STATUS_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { handleStatusChange(opt.value); setDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer
                                            ${statusFilter === opt.value
                                                ? 'bg-orange-50 text-primary font-medium'
                                                : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSearch}
                        className="px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                        Buscar
                    </button>
                    {(inputSearch || statusFilter) && (
                        <button
                            onClick={handleClear}
                            className="px-3 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            Limpiar
                        </button>
                    )}
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="py-16 text-center text-sm text-gray-400">Cargando…</div>
                    ) : requests.length === 0 ? (
                        <EmptyState message="No se encontraron solicitudes" />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Código</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Motivo</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {requests.map(req => (
                                        <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-gray-700">#{req.code}</td>
                                            <td className="px-4 py-3 text-gray-600">{formatDate(req.date)}</td>
                                            <td className="px-4 py-3 text-gray-600">{req.reason || '—'}</td>
                                            <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => setSelectedRequest(req)}
                                                    title="Ver detalle"
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Paginación */}
                {pages > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Página {page} de {pages}</span>
                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => handlePageChange(page - 1)}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-default"
                            >
                                Anterior
                            </button>
                            <button
                                disabled={page >= pages}
                                onClick={() => handlePageChange(page + 1)}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-default"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {selectedRequest && (
            <RequestDetailModal req={selectedRequest} onClose={() => setSelectedRequest(null)} />
        )}
        </>
    );
}

// ─── Vista: lista del equipo ──────────────────────────────────────────────────
function TeamListView({ onSelectMember }: { onSelectMember: (m: TeamMember) => void }) {
    const { members, loading, error } = useMyTeam();
    const [search, setSearch]         = useState('');

    const filtered: TeamMember[] = search.trim()
        ? members.filter((m: TeamMember) =>
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.email.toLowerCase().includes(search.toLowerCase()),
          )
        : members;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-5xl mx-auto space-y-4">

                {/* Encabezado */}
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Mi Equipo</h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {members.length} miembro{members.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Buscador */}
                <div className="relative max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>

                {/* Contenido */}
                {loading ? (
                    <div className="py-16 text-center text-sm text-gray-400">Cargando equipo…</div>
                ) : error ? (
                    <div className="py-16 text-center text-sm text-red-400">{error}</div>
                ) : filtered.length === 0 ? (
                    <EmptyState message={search ? 'No se encontraron miembros' : 'No tienes miembros en tu equipo'} />
                ) : (
                    <div className="grid gap-3">
                        {filtered.map((m: TeamMember) => (
                            <TeamMemberCard key={m._id} member={m} onSelect={() => onSelectMember(m)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Página principal ─────────────────────────────────────────────────────────
function MyTeamPage() {
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

    if (selectedMember) {
        return (
            <MemberRequestsView
                member={selectedMember}
                onBack={() => setSelectedMember(null)}
            />
        );
    }

    return <TeamListView onSelectMember={setSelectedMember} />;
}

export default MyTeamPage;




