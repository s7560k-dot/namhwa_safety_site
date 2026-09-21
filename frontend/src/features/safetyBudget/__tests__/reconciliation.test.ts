import { describe, it, expect } from 'vitest';
import { reconcileLedger, countOverageExpenses } from '../domain/reconciliation';

describe('reconcileLedger', () => {
    it('집행이 계상보다 적으면 미집행 잔액만 발생한다', () => {
        const result = reconcileLedger(1000, [200, 300]);
        expect(result.executedTotal).toBe(500);
        expect(result.cappedExecutedTotal).toBe(500);
        expect(result.capApplied).toBe(false);
        expect(result.unexecutedBalance).toBe(500);
        expect(result.suspiciousOverageAmount).toBe(0);
    });

    it('집행이 계상을 초과하면 상한이 적용되고 의심 금액이 계산된다', () => {
        const result = reconcileLedger(1000, [700, 500]);
        expect(result.executedTotal).toBe(1200); // 원본 값은 깎이지 않음
        expect(result.cappedExecutedTotal).toBe(1000); // 집계 단계에서만 상한
        expect(result.capApplied).toBe(true);
        expect(result.unexecutedBalance).toBe(0);
        expect(result.suspiciousOverageAmount).toBe(200);
    });

    it('집행과 계상이 정확히 같으면 잔액과 의심 금액 모두 0이다', () => {
        const result = reconcileLedger(1000, [1000]);
        expect(result.capApplied).toBe(false);
        expect(result.unexecutedBalance).toBe(0);
        expect(result.suspiciousOverageAmount).toBe(0);
    });

    it('지출이 없으면 계상액 전체가 미집행 잔액이다', () => {
        const result = reconcileLedger(1000, []);
        expect(result.executedTotal).toBe(0);
        expect(result.unexecutedBalance).toBe(1000);
    });
});

describe('countOverageExpenses', () => {
    it('초과가 없으면 0건이다', () => {
        const count = countOverageExpenses(1000, [
            { date: '2026-01-01', amount: 300 },
            { date: '2026-01-02', amount: 300 },
        ]);
        expect(count).toBe(0);
    });

    it('초과가 시작된 건부터 이후 전부를 센다 (일자 오름차순 무관하게 정렬 후 계산)', () => {
        const count = countOverageExpenses(1000, [
            { date: '2026-01-03', amount: 400 }, // 누적 1200 (3번째 입력이지만 날짜순으론 마지막)
            { date: '2026-01-01', amount: 500 }, // 누적 500
            { date: '2026-01-02', amount: 400 }, // 누적 900
        ]);
        // 날짜순: 500(누적500) -> 400(누적900) -> 400(누적1300, 초과) = 1건
        expect(count).toBe(1);
    });

    it('지출이 없으면 0건이다', () => {
        expect(countOverageExpenses(1000, [])).toBe(0);
    });
});
