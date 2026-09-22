import { CALCULATION_RATE_TABLE } from '../config/regulation.config';
import type { ConstructionCategory } from '../config/regulation.config';
import { MAJOR_WORK_TYPE_TO_CONSTRUCTION_CATEGORY, DEFAULT_CONSTRUCTION_CATEGORY } from '../config/constructionCategoryMapping.config';
import type { MajorWorkTypeTotal } from './costBreakdownImport';

const TIER_BOUNDARY_5억 = 500_000_000;
const TIER_BOUNDARY_50억 = 5_000_000_000;

export type RateTier = 'UNDER_5억' | 'BETWEEN_5_AND_50억' | 'OVER_50억';

export interface ConstructionCategoryDetermination {
    category: ConstructionCategory;
    /** 판정 기준이 된 대공종명 (금액이 가장 큰 대공종). */
    majorWorkType: string;
    /** 판정 근거 설명 (화면 표시용). */
    rationale: string;
}

/**
 * 대공종별 합계 중 금액이 가장 큰 공종을 찾아 산안비 요율표상 공사종류를 판정한다.
 * 고시 원칙: "공사종류가 둘 이상이면(분리발주 제외) 공사금액이 가장 큰 공사종류를 적용".
 * @throws {Error} 대공종 목록이 비어있을 때
 */
export function determineConstructionCategory(majorWorkTypeTotals: readonly MajorWorkTypeTotal[]): ConstructionCategoryDetermination {
    if (majorWorkTypeTotals.length === 0) {
        throw new Error('대공종별 합계 데이터가 없어 공사종류를 판정할 수 없습니다.');
    }

    const largest = majorWorkTypeTotals.reduce((max, cur) => (cur.amount > max.amount ? cur : max));
    const category = MAJOR_WORK_TYPE_TO_CONSTRUCTION_CATEGORY[largest.name] ?? DEFAULT_CONSTRUCTION_CATEGORY;
    const mapped = largest.name in MAJOR_WORK_TYPE_TO_CONSTRUCTION_CATEGORY;

    return {
        category,
        majorWorkType: largest.name,
        rationale: mapped
            ? `금액이 가장 큰 대공종("${largest.name}", ${largest.amount.toLocaleString()}원) 기준으로 "${category}"로 판정했습니다.`
            : `금액이 가장 큰 대공종("${largest.name}")이 매핑표에 없어 기본값 "${category}"를 적용했습니다. 확인이 필요합니다.`,
    };
}

export interface SafetyBudgetCalculationResult {
    amount: number;
    tier: RateTier;
    appliedRatePercent: number;
    baseAmount: number;
}

/**
 * 대상액과 공사종류로 산안비 계상금액을 계산한다.
 * 5억 미만: 대상액×요율 / 5억~50억 미만: 대상액×요율+기초액 / 50억 이상: 대상액×요율(기초액 없음).
 * @throws {Error} 대상액이 음수일 때
 */
export function calculateSafetyBudgetAmount(targetAmount: number, category: ConstructionCategory): SafetyBudgetCalculationResult {
    if (targetAmount < 0) {
        throw new Error('대상액은 0 이상이어야 합니다.');
    }

    const rates = CALCULATION_RATE_TABLE[category];

    if (targetAmount < TIER_BOUNDARY_5억) {
        return { amount: targetAmount * (rates.under5억Rate / 100), tier: 'UNDER_5억', appliedRatePercent: rates.under5억Rate, baseAmount: 0 };
    }
    if (targetAmount < TIER_BOUNDARY_50억) {
        const amount = targetAmount * (rates.between5And50억Rate / 100) + rates.between5And50억BaseAmount;
        return { amount, tier: 'BETWEEN_5_AND_50억', appliedRatePercent: rates.between5And50억Rate, baseAmount: rates.between5And50억BaseAmount };
    }
    return { amount: targetAmount * (rates.over50억Rate / 100), tier: 'OVER_50억', appliedRatePercent: rates.over50억Rate, baseAmount: 0 };
}
