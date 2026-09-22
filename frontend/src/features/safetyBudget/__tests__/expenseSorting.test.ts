import { describe, it, expect } from 'vitest';
import { sortExpensesForDisplay } from '../domain/expenseSorting';
import type { Expense } from '../schemas/expense.schema';

function makeExpense(overrides: Partial<Expense>): Expense {
    return {
        id: 'e1',
        projectId: 'siteA',
        date: '2026-01-01',
        amount: 1000,
        itemCode: 'LABOR',
        eligibility: { status: 'APPROVED', reason: '인정 항목입니다.' },
        evidenceConfirmed: false,
        ...overrides,
    };
}

describe('sortExpensesForDisplay', () => {
    it('월이 다르면 오래된 달이 먼저 온다', () => {
        const march = makeExpense({ id: 'march', date: '2026-03-05' });
        const january = makeExpense({ id: 'january', date: '2026-01-20' });
        const result = sortExpensesForDisplay([march, january]);
        expect(result.map((e) => e.id)).toEqual(['january', 'march']);
    });

    it('같은 달이면 비목(고시 순서)이 앞선 쪽이 먼저 온다', () => {
        // 고시 순서: LABOR(①) → SAFETY_FACILITY(②) → ... → SMART_EQUIPMENT(마지막)
        const smartEquipment = makeExpense({ id: 'smart', date: '2026-03-10', itemCode: 'SMART_EQUIPMENT' });
        const labor = makeExpense({ id: 'labor', date: '2026-03-01', itemCode: 'LABOR' });
        const safetyFacility = makeExpense({ id: 'facility', date: '2026-03-15', itemCode: 'SAFETY_FACILITY' });
        const result = sortExpensesForDisplay([smartEquipment, labor, safetyFacility]);
        expect(result.map((e) => e.id)).toEqual(['labor', 'facility', 'smart']);
    });

    it('같은 달·같은 비목이면 오래된 날짜가 먼저 온다', () => {
        const late = makeExpense({ id: 'late', date: '2026-03-25', itemCode: 'PPE' });
        const early = makeExpense({ id: 'early', date: '2026-03-03', itemCode: 'PPE' });
        const result = sortExpensesForDisplay([late, early]);
        expect(result.map((e) => e.id)).toEqual(['early', 'late']);
    });

    it('월 → 비목 → 날짜 순으로 복합 정렬한다', () => {
        const items = [
            makeExpense({ id: 'apr-labor', date: '2026-04-05', itemCode: 'LABOR' }),
            makeExpense({ id: 'mar-ppe-20', date: '2026-03-20', itemCode: 'PPE' }),
            makeExpense({ id: 'mar-labor-10', date: '2026-03-10', itemCode: 'LABOR' }),
            makeExpense({ id: 'mar-labor-01', date: '2026-03-01', itemCode: 'LABOR' }),
        ];
        const result = sortExpensesForDisplay(items);
        expect(result.map((e) => e.id)).toEqual(['mar-labor-01', 'mar-labor-10', 'mar-ppe-20', 'apr-labor']);
    });

    it('원본 배열을 변경하지 않는다', () => {
        const items = [makeExpense({ id: 'b', date: '2026-02-01' }), makeExpense({ id: 'a', date: '2026-01-01' })];
        const original = [...items];
        sortExpensesForDisplay(items);
        expect(items).toEqual(original);
    });
});
