import { describe, it, expect } from 'vitest';
import { summarizeSubcontractorBudgets } from '../domain/subcontractorSummary';
import type { Subcontractor } from '../schemas/subcontractor.schema';
import type { Expense } from '../schemas/expense.schema';

function makeExpense(overrides: Partial<Expense>): Expense {
    return {
        id: 'exp-1',
        projectId: 'siteA',
        date: '2026-01-01',
        amount: 100,
        itemCode: 'PPE',
        eligibility: { status: 'APPROVED', reason: '인정 항목입니다.' },
        evidenceConfirmed: false,
        ...overrides,
    };
}

describe('summarizeSubcontractorBudgets', () => {
    const subcontractors: Subcontractor[] = [
        { id: 'sub-1', projectId: 'siteA', name: 'A협력사', allocatedSafetyBudget: 1000 },
        { id: 'sub-2', projectId: 'siteA', name: 'B협력사', allocatedSafetyBudget: 500 },
    ];

    it('협력사별로 배정/집행/잔액을 분리 집계한다', () => {
        const expenses: Expense[] = [
            makeExpense({ id: 'e1', subcontractorId: 'sub-1', amount: 300, evidenceConfirmed: true }),
            makeExpense({ id: 'e2', subcontractorId: 'sub-1', amount: 200, evidenceConfirmed: false }),
            makeExpense({ id: 'e3', subcontractorId: 'sub-2', amount: 100, evidenceConfirmed: true }),
            makeExpense({ id: 'e4', subcontractorId: undefined, amount: 999 }), // 협력사 미지정 지출은 제외
        ];

        const result = summarizeSubcontractorBudgets(subcontractors, expenses);

        expect(result[0].executedTotal).toBe(500);
        expect(result[0].confirmedExecutedTotal).toBe(300);
        expect(result[0].unconfirmedExecutedTotal).toBe(200);
        expect(result[0].unexecutedBalance).toBe(500);

        expect(result[1].executedTotal).toBe(100);
        expect(result[1].confirmedExecutedTotal).toBe(100);
        expect(result[1].unexecutedBalance).toBe(400);
    });

    it('협력사에 배정된 지출이 없으면 전부 0이다', () => {
        const result = summarizeSubcontractorBudgets(subcontractors, []);
        expect(result[0].executedTotal).toBe(0);
        expect(result[0].unexecutedBalance).toBe(1000);
    });
});
