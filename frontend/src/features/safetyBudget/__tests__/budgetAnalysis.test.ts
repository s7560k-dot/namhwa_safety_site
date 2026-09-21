import { describe, it, expect } from 'vitest';
import { computeBudgetAnalysis } from '../domain/budgetAnalysis';
import type { Project } from '../schemas/project.schema';
import type { WorkPackage } from '../schemas/workPackage.schema';
import type { Expense } from '../schemas/expense.schema';

const project: Project = {
    id: 'siteA',
    name: '테스트 현장',
    totalContractAmount: 100000,
    contractType: 'CONTRACT',
    allocatedSafetyBudget: 1000,
    settlementRuleType: 'PUBLIC_REFUND',
};

function makeExpense(amount: number): Expense {
    return {
        id: 'e',
        projectId: 'siteA',
        date: '2026-01-01',
        amount,
        itemCode: 'PPE',
        eligibility: { status: 'APPROVED', reason: '인정 항목입니다.' },
        evidenceConfirmed: false,
    };
}

describe('computeBudgetAnalysis', () => {
    it('가중치 합이 1이 아니면 ok:false를 반환한다', () => {
        const workPackages: WorkPackage[] = [
            { id: 'wp1', projectId: 'siteA', name: 'A', riskWeight: 0.3, plannedProgressCurve: [], currentProgressPct: 50 },
        ];
        const result = computeBudgetAnalysis(project, workPackages, []);
        expect(result.ok).toBe(false);
    });

    it('정상 입력이면 편차와 경보 단계를 계산한다', () => {
        const workPackages: WorkPackage[] = [
            { id: 'wp1', projectId: 'siteA', name: 'A', riskWeight: 1, plannedProgressCurve: [], currentProgressPct: 50 },
        ];
        const expenses = [makeExpense(500)];
        const result = computeBudgetAnalysis(project, workPackages, expenses);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.data.weightedProgressPct).toBe(50);
            expect(result.data.reconciliation.executedTotal).toBe(500);
        }
    });
});
