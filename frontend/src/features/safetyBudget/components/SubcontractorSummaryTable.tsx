import type { SubcontractorBudgetSummary } from '../domain/subcontractorSummary';

function formatWon(amount: number): string {
    return `${Math.round(amount).toLocaleString()}원`;
}

export function SubcontractorSummaryTable({ summaries }: { summaries: SubcontractorBudgetSummary[] }) {
    if (summaries.length === 0) {
        return <p className="text-slate-400 text-center py-12">등록된 협력사가 없습니다.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="py-3 pr-4">협력사</th>
                        <th className="py-3 pr-4">배정액</th>
                        <th className="py-3 pr-4">집행액(확정)</th>
                        <th className="py-3 pr-4">집행액(확인대기)</th>
                        <th className="py-3 pr-4">잔액</th>
                        <th className="py-3 pr-4">의심금액</th>
                    </tr>
                </thead>
                <tbody>
                    {summaries.map((s) => (
                        <tr key={s.subcontractorId} className="border-b border-slate-50">
                            <td className="py-3 pr-4 font-bold text-slate-900">{s.name}</td>
                            <td className="py-3 pr-4">{formatWon(s.allocated)}</td>
                            <td className="py-3 pr-4 text-emerald-600 font-medium">{formatWon(s.confirmedExecutedTotal)}</td>
                            <td className="py-3 pr-4 text-amber-600 font-medium">{formatWon(s.unconfirmedExecutedTotal)}</td>
                            <td className="py-3 pr-4">{formatWon(s.unexecutedBalance)}</td>
                            <td className={`py-3 pr-4 font-bold ${s.suspiciousOverageAmount > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                                {formatWon(s.suspiciousOverageAmount)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
