import { Link } from 'react-router-dom';

const TABS = [
    { path: '', label: '현황 대시보드' },
    { path: '/subcontractors', label: '협력사 잔액' },
    { path: '/settlement', label: '정산 시뮬레이션' },
    { path: '/audit', label: '감사 준비도' },
] as const;

export function SafetyBudgetTabs({ projectId, active }: { projectId: string; active: (typeof TABS)[number]['path'] }) {
    return (
        <nav className="flex gap-2 border-b border-slate-200 mb-8 overflow-x-auto">
            {TABS.map((tab) => (
                <Link
                    key={tab.path}
                    to={`/safety-budget/${projectId}${tab.path}`}
                    className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                        active === tab.path
                            ? 'border-red-600 text-red-600'
                            : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                >
                    {tab.label}
                </Link>
            ))}
        </nav>
    );
}
