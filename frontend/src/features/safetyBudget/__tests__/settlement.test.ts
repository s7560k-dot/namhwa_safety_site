import { describe, it, expect } from 'vitest';
import { getSettlementStrategy, createRefundRatioStrategy } from '../domain/settlement';

describe('getSettlementStrategy', () => {
    it('법령 수치(반환 비율)가 설정되지 않은 동안에는 공공형 계산을 거부한다', () => {
        const strategy = getSettlementStrategy('PUBLIC_REFUND');
        const result = strategy.calculate({ allocatedSafetyBudget: 1000, unexecutedBalance: 300 });
        expect(result.status).toBe('CONFIG_MISSING');
    });

    it('법령 수치(반환 비율)가 설정되지 않은 동안에는 민간형 계산도 거부한다', () => {
        const strategy = getSettlementStrategy('PRIVATE_CONTRACT');
        const result = strategy.calculate({ allocatedSafetyBudget: 1000, unexecutedBalance: 300 });
        expect(result.status).toBe('CONFIG_MISSING');
    });
});

describe('createRefundRatioStrategy', () => {
    it('비율이 주어지면 미집행 잔액 × 비율로 반환액을 계산한다', () => {
        const strategy = createRefundRatioStrategy({ refundRatioOfUnexecuted: 50 }, '테스트 규칙');
        const result = strategy.calculate({ allocatedSafetyBudget: 1000, unexecutedBalance: 400 });
        expect(result.status).toBe('CALCULATED');
        if (result.status === 'CALCULATED') {
            expect(result.refundAmount).toBe(200);
        }
    });

    it('미집행 잔액이 0이면 반환액도 0이다', () => {
        const strategy = createRefundRatioStrategy({ refundRatioOfUnexecuted: 100 }, '테스트 규칙');
        const result = strategy.calculate({ allocatedSafetyBudget: 1000, unexecutedBalance: 0 });
        expect(result.status).toBe('CALCULATED');
        if (result.status === 'CALCULATED') {
            expect(result.refundAmount).toBe(0);
        }
    });
});
