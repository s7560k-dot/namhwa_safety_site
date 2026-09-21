import type { LedgerReconciliationResult } from '../domain/reconciliation';

function formatWon(amount: number): string {
    return `${Math.round(amount).toLocaleString()}원`;
}

export function LedgerReconciliationCard({ result }: { result: LedgerReconciliationResult }) {
    return (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6">이중 원장 대사</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">계상액</p>
                    <p className="text-lg font-black text-slate-900">{formatWon(result.allocated)}</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">집행액</p>
                    <p className="text-lg font-black text-slate-900">{formatWon(result.executedTotal)}</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">미집행 잔액</p>
                    <p className="text-lg font-black text-emerald-600">{formatWon(result.unexecutedBalance)}</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">목적 외 의심</p>
                    <p className={`text-lg font-black ${result.suspiciousOverageAmount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {formatWon(result.suspiciousOverageAmount)}
                    </p>
                </div>
            </div>
            {result.capApplied && (
                <p className="mt-6 text-sm font-medium text-red-600 bg-red-50 rounded-xl px-4 py-3">
                    집행액이 계상액을 초과해 집계 시 {formatWon(result.allocated)}로 상한 처리했습니다. 원본 지출 기록은 변경되지 않았습니다.
                </p>
            )}
        </div>
    );
}
