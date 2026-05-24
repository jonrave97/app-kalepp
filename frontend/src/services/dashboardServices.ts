import API from './api';
import { cached } from './cache';

export interface DashboardStats {
    users: {
        total:        number;
        enabled:      number;
        disabled:     number;
        notActivated: number;
    };
    warehouses: {
        total:    number;
        enabled:  number;
        disabled: number;
    };
    epps: {
        total:    number;
        active:   number;
        inactive: number;
    };
    categories: { total: number };
    positions:  { total: number };
}

export const getDashboardStats = (): Promise<DashboardStats> =>
    cached('dashboard:stats', () =>
        API.get<DashboardStats>('/dashboard/summary').then(r => r.data),
    );

