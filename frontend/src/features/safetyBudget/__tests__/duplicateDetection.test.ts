import { describe, it, expect } from 'vitest';
import { isDuplicateExpense, findDuplicateExpense } from '../domain/duplicateDetection';

describe('isDuplicateExpense', () => {
    it('날짜·비목·금액이 전부 같으면 중복이다', () => {
        const a = { date: '2026-03-31', itemCode: 'SAFETY_FACILITY', amount: 936500 };
        const b = { date: '2026-03-31', itemCode: 'SAFETY_FACILITY', amount: 936500 };
        expect(isDuplicateExpense(a, b)).toBe(true);
    });

    it('날짜가 다르면 중복이 아니다', () => {
        const a = { date: '2026-03-31', itemCode: 'SAFETY_FACILITY', amount: 936500 };
        const b = { date: '2026-04-01', itemCode: 'SAFETY_FACILITY', amount: 936500 };
        expect(isDuplicateExpense(a, b)).toBe(false);
    });

    it('비목이 다르면 중복이 아니다', () => {
        const a = { date: '2026-03-31', itemCode: 'SAFETY_FACILITY', amount: 936500 };
        const b = { date: '2026-03-31', itemCode: 'PPE', amount: 936500 };
        expect(isDuplicateExpense(a, b)).toBe(false);
    });

    it('금액이 다르면 중복이 아니다', () => {
        const a = { date: '2026-03-31', itemCode: 'SAFETY_FACILITY', amount: 936500 };
        const b = { date: '2026-03-31', itemCode: 'SAFETY_FACILITY', amount: 1000 };
        expect(isDuplicateExpense(a, b)).toBe(false);
    });
});

describe('findDuplicateExpense', () => {
    it('목록 중 중복되는 항목을 찾아 반환한다', () => {
        const candidate = { date: '2026-03-31', itemCode: 'SAFETY_FACILITY', amount: 936500 };
        const existing = [
            { id: 'e1', date: '2026-03-01', itemCode: 'LABOR', amount: 100 },
            { id: 'e2', date: '2026-03-31', itemCode: 'SAFETY_FACILITY', amount: 936500 },
        ];
        expect(findDuplicateExpense(candidate, existing)?.id).toBe('e2');
    });

    it('중복이 없으면 undefined를 반환한다', () => {
        const candidate = { date: '2026-03-31', itemCode: 'SAFETY_FACILITY', amount: 936500 };
        const existing = [{ id: 'e1', date: '2026-03-01', itemCode: 'LABOR', amount: 100 }];
        expect(findDuplicateExpense(candidate, existing)).toBeUndefined();
    });
});
