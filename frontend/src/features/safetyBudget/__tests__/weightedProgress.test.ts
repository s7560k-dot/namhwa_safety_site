import { describe, it, expect } from 'vitest';
import { calculateWeightedProgress, validateRiskWeightSum } from '../domain/weightedProgress';
import type { WorkPackage } from '../schemas/workPackage.schema';

function makeWorkPackage(overrides: Partial<WorkPackage>): WorkPackage {
    return {
        id: 'wp-1',
        projectId: 'siteA',
        name: '테스트 공종',
        riskWeight: 0.5,
        plannedProgressCurve: [],
        currentProgressPct: 0,
        ...overrides,
    };
}

describe('validateRiskWeightSum', () => {
    it('가중치 합이 1이면 true', () => {
        const wps = [makeWorkPackage({ riskWeight: 0.4 }), makeWorkPackage({ riskWeight: 0.6 })];
        expect(validateRiskWeightSum(wps)).toBe(true);
    });

    it('가중치 합이 1이 아니면 false', () => {
        const wps = [makeWorkPackage({ riskWeight: 0.4 }), makeWorkPackage({ riskWeight: 0.5 })];
        expect(validateRiskWeightSum(wps)).toBe(false);
    });
});

describe('calculateWeightedProgress', () => {
    it('빈 배열이면 0%를 반환한다', () => {
        expect(calculateWeightedProgress([])).toBe(0);
    });

    it('모든 공종이 0% 진행이면 0%를 반환한다', () => {
        const wps = [
            makeWorkPackage({ riskWeight: 0.3, currentProgressPct: 0 }),
            makeWorkPackage({ riskWeight: 0.7, currentProgressPct: 0 }),
        ];
        expect(calculateWeightedProgress(wps)).toBe(0);
    });

    it('모든 공종이 100% 진행이면 100%를 반환한다', () => {
        const wps = [
            makeWorkPackage({ riskWeight: 0.3, currentProgressPct: 100 }),
            makeWorkPackage({ riskWeight: 0.7, currentProgressPct: 100 }),
        ];
        expect(calculateWeightedProgress(wps)).toBe(100);
    });

    it('가중 평균을 정확히 계산한다', () => {
        const wps = [
            makeWorkPackage({ riskWeight: 0.4, currentProgressPct: 50 }),
            makeWorkPackage({ riskWeight: 0.6, currentProgressPct: 20 }),
        ];
        // 0.4*50 + 0.6*20 = 20 + 12 = 32
        expect(calculateWeightedProgress(wps)).toBeCloseTo(32);
    });

    it('가중치 합이 1이 아니면 예외를 던진다', () => {
        const wps = [makeWorkPackage({ riskWeight: 0.3 }), makeWorkPackage({ riskWeight: 0.3 })];
        expect(() => calculateWeightedProgress(wps)).toThrow();
    });
});
