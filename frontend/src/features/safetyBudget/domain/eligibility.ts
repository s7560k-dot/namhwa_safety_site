import { ELIGIBLE_ITEM_CODES, FALLBACK_NON_SAFETY_ITEM_CODE } from '../config/constants';
import type { BudgetItemCode } from '../config/constants';
import type { EligibilityResult } from '../schemas/expense.schema';

/**
 * 결제 전 적격성 사전 심사. 규칙(인정 항목 목록)은 config에서 데이터로 주입되므로,
 * 고시 개정 시 이 함수 코드를 바꾸지 않고 config만 갱신하면 된다.
 * @param itemCode 심사할 비목 코드
 * @param eligibleCodes 인정 항목 코드 목록 (기본값: config의 ELIGIBLE_ITEM_CODES)
 */
export function checkEligibility(
    itemCode: BudgetItemCode,
    eligibleCodes: readonly BudgetItemCode[] = ELIGIBLE_ITEM_CODES
): EligibilityResult {
    if (eligibleCodes.includes(itemCode)) {
        return { status: 'APPROVED', reason: '인정 항목입니다.' };
    }

    return {
        status: 'REJECTED',
        reason: `'${itemCode}'는 산안비 인정 항목이 아닙니다. '${FALLBACK_NON_SAFETY_ITEM_CODE}'(현장경비 등) 비목으로 등록해주세요.`,
    };
}

export interface HeadquartersUsageCheckResult {
    allowed: boolean;
    reason: string;
}

/**
 * 본사 사용분이 상한 비율을 초과하는지 검사한다 (F12).
 * 한도 비율이 아직 설정되지 않았으면(TODO) 초과 여부를 판단할 근거가 없으므로 등록을 막는다.
 * @param currentHeadquartersUsage 이미 등록된 본사 사용분 누계 (신규 등록분 포함)
 * @param allocatedSafetyBudget 프로젝트 계상 산안비 총액
 * @param capRatioPercent regulation.config.ts의 HEADQUARTERS_USAGE_CAP_RATIO (0~100, % 단위)
 */
export function checkHeadquartersUsageCap(
    currentHeadquartersUsage: number,
    allocatedSafetyBudget: number,
    capRatioPercent: number | undefined
): HeadquartersUsageCheckResult {
    if (capRatioPercent === undefined) {
        return {
            allowed: false,
            reason: '본사 사용 상한 비율이 아직 설정되지 않았습니다 (고시 확인 필요). 확정 전까지 본사 사용분 등록이 제한됩니다.',
        };
    }

    const capAmount = (allocatedSafetyBudget * capRatioPercent) / 100;
    if (currentHeadquartersUsage > capAmount) {
        return {
            allowed: false,
            reason: `본사 사용분(${currentHeadquartersUsage.toLocaleString()}원)이 상한(${capAmount.toLocaleString()}원, ${capRatioPercent}%)을 초과합니다.`,
        };
    }

    return { allowed: true, reason: '상한 이내입니다.' };
}
