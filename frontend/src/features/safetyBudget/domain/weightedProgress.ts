import { RISK_WEIGHT_SUM_TOLERANCE } from '../config/constants';
import type { WorkPackage } from '../schemas/workPackage.schema';

/**
 * 공종별 위험 가중치의 합이 1(오차 허용범위 내)인지 검증한다.
 * @param workPackages 검증할 공종 목록
 * @returns 가중치 합이 유효하면 true
 */
export function validateRiskWeightSum(workPackages: readonly WorkPackage[]): boolean {
    const sum = workPackages.reduce((acc, wp) => acc + wp.riskWeight, 0);
    return Math.abs(sum - 1) <= RISK_WEIGHT_SUM_TOLERANCE;
}

/**
 * 위험 가중 공정률을 계산한다: Σ(공종 위험 가중치 × 공종 공정률).
 * 가중치 합이 1이 아니면 계산을 거부한다 (잘못된 입력으로 잘못된 목표선을 만들지 않기 위함).
 * @param workPackages 공종 목록 (riskWeight 합이 1이어야 함)
 * @returns 0~100 사이의 위험 가중 공정률(%)
 * @throws {Error} 위험 가중치 합이 1이 아닐 때
 */
export function calculateWeightedProgress(workPackages: readonly WorkPackage[]): number {
    // 1. 계획: 빈 배열은 0%로 처리. 가중치 합 오류는 예외로 막는다. 이후 가중합을 반환한다.
    // 2. 검증: 경계값(0%, 100% 공정률), 가중치 합 오류는 __tests__/weightedProgress.test.ts 에서 확인.
    // 3. 구현:
    if (workPackages.length === 0) {
        return 0;
    }

    if (!validateRiskWeightSum(workPackages)) {
        throw new Error('공종 위험 가중치의 합이 1이 아닙니다. 데이터를 확인하세요.');
    }

    return workPackages.reduce((acc, wp) => acc + wp.riskWeight * wp.currentProgressPct, 0);
}
