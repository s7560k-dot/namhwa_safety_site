import { describe, it, expect } from 'vitest';
import { reconcileLedger } from '../domain/reconciliation';

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
