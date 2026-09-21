import type { AlertLevel } from '../config/constants';

const LABELS: Record<AlertLevel, string> = {
    normal: '정상',
    caution: '주의',
    warning: '경고',
};

const STYLES: Record<AlertLevel, string> = {
    normal: 'bg-emerald-100 text-emerald-700',
    caution: 'bg-amber-100 text-amber-700',
    warning: 'bg-red-100 text-red-700',
};

export function AlertBadge({ level }: { level: AlertLevel }) {
    return (
        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold ${STYLES[level]}`}>
            {LABELS[level]}
        </span>
    );
}
