import { BUDGET_ITEM_CODE_LABELS } from '../config/constants';
import type { Expense } from '../schemas/expense.schema';
import type { Subcontractor } from '../schemas/subcontractor.schema';

interface EvidenceConfirmationListProps {
    expenses: Expense[];
    subcontractors: Subcontractor[];
    onConfirm: (expenseId: string) => void;
    isConfirming: boolean;
}

/** 기성 처리를 위한 증빙 확인 대기 목록 (F4, 관리자 전용). */
export function EvidenceConfirmationList({ expenses, subcontractors, onConfirm, isConfirming }: EvidenceConfirmationListProps) {
    const pending = expenses.filter((e) => e.subcontractorId && !e.evidenceConfirmed);
    const nameById = new Map(subcontractors.map((s) => [s.id, s.name]));

    if (pending.length === 0) {
        return <p className="text-slate-400 text-center py-8">증빙 확인 대기 중인 집행이 없습니다.</p>;
    }

    return (
        <div className="space-y-3">
            {pending.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between bg-amber-50 rounded-xl px-5 py-4">
                    <div>
                        <p className="font-bold text-slate-900">
                            {expense.subcontractorId ? nameById.get(expense.subcontractorId) ?? '알 수 없음' : '-'} ·{' '}
                            {BUDGET_ITEM_CODE_LABELS[expense.itemCode]}
                        </p>
                        <p className="text-sm text-slate-500">
                            {expense.date.slice(0, 10)} · {expense.amount.toLocaleString()}원
                        </p>
                    </div>
                    <button
                        onClick={() => onConfirm(expense.id)}
                        disabled={isConfirming}
                        className="bg-slate-900 text-white text-sm font-bold rounded-lg px-4 py-2 hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                        증빙 확인
                    </button>
                </div>
            ))}
        </div>
    );
}
