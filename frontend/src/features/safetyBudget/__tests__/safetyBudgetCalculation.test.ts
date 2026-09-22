import { describe, it, expect } from 'vitest';
import { calculateSafetyBudgetAmount, determineConstructionCategory } from '../domain/safetyBudgetCalculation';
import { CALCULATION_RATE_TABLE } from '../config/regulation.config';
import type { MajorWorkTypeTotal } from '../domain/costBreakdownImport';

describe('calculateSafetyBudgetAmount', () => {
    it('대상액 5억원 미만이면 대상액×요율만 적용한다', () => {
        const result = calculateSafetyBudgetAmount(499_999_999, '건축공사');
        expect(result.tier).toBe('UNDER_5억');
        expect(result.baseAmount).toBe(0);
        expect(result.amount).toBeCloseTo(499_999_999 * 0.0311);
    });

    it('대상액 정확히 5억원이면 5억~50억 구간(기초액 포함)을 적용한다', () => {
        const result = calculateSafetyBudgetAmount(500_000_000, '건축공사');
        expect(result.tier).toBe('BETWEEN_5_AND_50억');
        expect(result.baseAmount).toBe(4_325_000);
        expect(result.amount).toBeCloseTo(500_000_000 * 0.0228 + 4_325_000);
    });

    it('대상액 50억원 미만 경계값에서 5억~50억 구간을 적용한다', () => {
        const result = calculateSafetyBudgetAmount(4_999_999_999, '건축공사');
        expect(result.tier).toBe('BETWEEN_5_AND_50억');
    });

    it('대상액 정확히 50억원이면 50억원 이상 구간(기초액 없음)을 적용한다', () => {
        const result = calculateSafetyBudgetAmount(5_000_000_000, '건축공사');
        expect(result.tier).toBe('OVER_50억');
        expect(result.baseAmount).toBe(0);
        expect(result.amount).toBeCloseTo(5_000_000_000 * 0.0237);
    });

    it('실사용 샘플(대광새마을금고 골프연습장) 대상액으로 계산하면 내역서 자체 계산값과 근접하게 일치한다', () => {
        // 원가(총괄) 시트: 재료비 소계 4,091,939,525 + 직접노무비 1,351,947,076 = 5,443,886,601
        const targetAmount = 4_091_939_525 + 1_351_947_076;
        const result = calculateSafetyBudgetAmount(targetAmount, '건축공사');
        expect(result.tier).toBe('OVER_50억');
        // 내역서 자체 계산값: 129,020,108원
        expect(result.amount).toBeCloseTo(129_020_108, -2);
    });

    it.each(Object.keys(CALCULATION_RATE_TABLE) as (keyof typeof CALCULATION_RATE_TABLE)[])(
        '%s는 요율표에 정의된 요율을 그대로 사용한다',
        (category) => {
            const rates = CALCULATION_RATE_TABLE[category];
            const result = calculateSafetyBudgetAmount(10_000_000_000, category);
            expect(result.appliedRatePercent).toBe(rates.over50억Rate);
        }
    );

    it('대상액이 음수면 예외를 던진다', () => {
        expect(() => calculateSafetyBudgetAmount(-1, '건축공사')).toThrow();
    });
});

describe('determineConstructionCategory', () => {
    function makeTotal(overrides: Partial<MajorWorkTypeTotal>): MajorWorkTypeTotal {
        return { code: '0101', name: '건축공사', amount: 0, ...overrides };
    }

    it('금액이 가장 큰 대공종을 기준으로 공사종류를 판정한다', () => {
        const totals = [
            makeTotal({ name: '건축공사', amount: 3_303_222_057 }),
            makeTotal({ name: '토목공사', amount: 1_239_996_206 }),
            makeTotal({ name: '철탑공사', amount: 1_259_547_223 }),
        ];
        const result = determineConstructionCategory(totals);
        expect(result.category).toBe('건축공사');
        expect(result.majorWorkType).toBe('건축공사');
    });

    it('매핑표에 없는 대공종명이면 기본값을 적용하고 그 사실을 근거 문구에 남긴다', () => {
        const totals = [makeTotal({ name: '알수없는공종', amount: 100 })];
        const result = determineConstructionCategory(totals);
        expect(result.rationale).toContain('매핑표에 없어');
    });

    it('대공종 목록이 비어있으면 예외를 던진다', () => {
        expect(() => determineConstructionCategory([])).toThrow();
    });
});
