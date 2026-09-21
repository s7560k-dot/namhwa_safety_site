import { BUDGET_ITEM_CODE_LABELS } from '../config/constants';
import type { Expense } from '../schemas/expense.schema';

export function ExpenseListTable({ expenses }: { expenses: Expense[] }) {
    if (expenses.length === 0) {
        return <p className="text-slate-400 text-center py-12">등록된 집행 내역이 없습니다.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="py-3 pr-4">일자</th>
                        <th className="py-3 pr-4">비목</th>
                        <th className="py-3 pr-4">금액</th>
                        <th className="py-3 pr-4">증빙</th>
                    </tr>
                </thead>
                <tbody>
                    {expenses.map((expense) => (
                        <tr key={expense.id} className="border-b border-slate-50">
                            <td className="py-3 pr-4 text-slate-600">{expense.date.slice(0, 10)}</td>
                            <td className="py-3 pr-4 font-medium text-slate-800">
                                {BUDGET_ITEM_CODE_LABELS[expense.itemCode]}
                            </td>
                            <td className="py-3 pr-4 font-bold text-slate-900">{expense.amount.toLocaleString()}원</td>
                            <td className="py-3 pr-4">
                                {expense.evidenceUrl ? (
                                    <a
                                        href={expense.evidenceUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-red-600 hover:underline"
                                    >
                                        보기
                                    </a>
                                ) : (
                                    <span className="text-amber-600 text-xs font-bold">증빙 약함</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
