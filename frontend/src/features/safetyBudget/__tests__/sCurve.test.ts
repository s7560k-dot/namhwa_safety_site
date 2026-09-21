import { describe, it, expect } from 'vitest';
import { getTargetCumulativeExecutionRate, calculateDeviation, getAlertLevel } from '../domain/sCurve';

describe('getTargetCumulativeExecutionRate', () => {
    it('공정률 0% → 목표 집행률 0%', () => {
        expect(getTargetCumulativeExecutionRate(0)).toBe(0);
    });

    it('공정률 100% → 목표 집행률 100%', () => {
        expect(getTargetCumulativeExecutionRate(100)).toBeCloseTo(100);
    });

    it('초기 집중형(exponent<1)에서는 중간 진행률의 목표 집행률이 진행률보다 높다', () => {
        const target = getTargetCumulativeExecutionRate(50, { frontLoadExponent: 0.7 });
        expect(target).toBeGreaterThan(50);
    });

    it('범위를 벗어난 입력은 0~100으로 클램프한다', () => {
        expect(getTargetCumulativeExecutionRate(-10)).toBe(0);
        expect(getTargetCumulativeExecutionRate(150)).toBeCloseTo(100);
    });
});

describe('calculateDeviation', () => {
    it('실제 - 목표를 반환한다', () => {
        expect(calculateDeviation(60, 50)).toBe(10);
        expect(calculateDeviation(40, 50)).toBe(-10);
    });
});

describe('getAlertLevel', () => {
    const thresholds = { CAUTION: 5, WARNING: 10 };

    it('편차가 CAUTION 미만이면 정상', () => {
        expect(getAlertLevel(4.9, thresholds)).toBe('normal');
        expect(getAlertLevel(-4.9, thresholds)).toBe('normal');
    });

    it('편차가 CAUTION 경계값이면 주의', () => {
        expect(getAlertLevel(5, thresholds)).toBe('caution');
    });

    it('편차가 WARNING 미만 CAUTION 이상이면 주의', () => {
        expect(getAlertLevel(9.9, thresholds)).toBe('caution');
    });

    it('편차가 WARNING 경계값 이상이면 경고', () => {
        expect(getAlertLevel(10, thresholds)).toBe('warning');
        expect(getAlertLevel(-15, thresholds)).toBe('warning');
    });
});
