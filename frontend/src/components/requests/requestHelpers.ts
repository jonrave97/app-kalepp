import type { AdminRequest } from '@/services/requestServices';

export function normalizeStatus(status: string): string {
    const aliases: Record<string, string> = {
        Anulada:   'Cambios solicitados',
        Entregado: 'Entregada',
    };
    return aliases[status] ?? status;
}

export function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CL', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

export function employeeName(emp: AdminRequest['employee']): string {
    if (!emp) return '—';
    if (typeof emp === 'object' && emp.name) return emp.name;
    return '—';
}

