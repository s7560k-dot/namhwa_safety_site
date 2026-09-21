import type { SettlementResult } from '../domain/settlement';
import type { SettlementRuleType } from '../schemas/project.schema';

const RULE_LABELS: Record<SettlementRuleType, string> = {
    PUBLIC_REFUND: '공공 반환·감액형',
    PRIVATE_CONTRACT: '민간 계약형',
};

export function SettlementResultCard({ ruleType, result }: { ruleType: SettlementRuleType; result: SettlementResult }) {
    return (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-2">준공 예상 정산 시뮬레이션</h3>
            <p className="text-sm text-slate-500 mb-6">정산 규칙: {RULE_LABELS[ruleType]}</p>

            {result.status === 'CALCULATED' ? (
                <>
                    <p className="text-3xl font-black text-red-600 mb-3">{result.refundAmount.toLocaleString()}원</p>
                    <p className="text-sm text-slate-500">{result.explanation}</p>
                </>
            ) : (
                <p className="text-sm font-medium text-red-600 bg-red-50 rounded-xl px-4 py-3">{result.reason}</p>
            )}
        </div>
    );
}
