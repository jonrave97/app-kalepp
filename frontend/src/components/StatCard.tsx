interface StatCardProps {
    label: string;
    value: number | null;
    color?: 'default' | 'green' | 'red' | 'yellow';
}

const colorMap: Record<NonNullable<StatCardProps['color']>, string> = {
    default: 'text-gray-900',
    green:   'text-green-600',
    red:     'text-red-500',
    yellow:  'text-yellow-500',
};

export function StatCard({ label, value, color = 'default' }: StatCardProps) {
    return (
        <div className="flex flex-col gap-1">
            <span className={`text-4xl font-bold tabular-nums ${colorMap[color]}`}>
                <span>{value ?? '—'}</span>
            </span>
            <span className="text-sm text-gray-500 leading-tight">{label}</span>
        </div>
    );
}
