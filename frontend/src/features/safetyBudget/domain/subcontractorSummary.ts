import { reconcileLedger } from './reconciliation';
import type { Subcontractor } from '../schemas/subcontractor.schema';
import type { Expense } from '../schemas/expense.schema';

export interface SubcontractorBudgetSummary {
    subcontractorId: string;
    name: string;
    allocated: number;
    executedTotal: number;
    /** 증빙 확인이 완료되어 기성 처리에 반영 가능한 집행액 */
    confirmedExecutedTotal: number;
    /** 증빙 확인 대기 중인 집행액 (기성 처리 시 아직 반영 불가) */
    unconfirmedExecutedTotal: number;
    unexecutedBalance: number;
    suspiciousOverageAmount: number;
}

/**
 * 협력사별 산안비 배정·집행·잔액을 요약한다 (F4).
 * 기성 처리를 위해서는 evidenceConfirmed === true 인 집행만 "확정"으로 집계한다.
 * @param subcontractors 프로젝트의 협력사 목록
 * @param expenses 프로젝트의 전체 집행 목록
 */
export function summarizeSubcontractorBudgets(
    subcontractors: readonly Subcontractor[],
    expenses: readonly Expense[]
): SubcontractorBudgetSummary[] {
    return subcontractors.map((sub) => {
        const subExpenses = expenses.filter((e) => e.subcontractorId === sub.id);
        const reconciliation = reconcileLedger(
            sub.allocatedSafetyBudget,
            subExpenses.map((e) => e.amount)
        );
        const confirmedExecutedTotal = subExpenses
            .filter((e) => e.evidenceConfirmed)
            .reduce((sum, e) => sum + e.amount, 0);

        return {
            subcontractorId: sub.id,
            name: sub.name,
            allocated: sub.allocatedSafetyBudget,
            executedTotal: reconciliation.executedTotal,
            confirmedExecutedTotal,
            unconfirmedExecutedTotal: reconciliation.executedTotal - confirmedExecutedTotal,
            unexecutedBalance: reconciliation.unexecutedBalance,
            suspiciousOverageAmount: reconciliation.suspiciousOverageAmount,
        };
    });
}
