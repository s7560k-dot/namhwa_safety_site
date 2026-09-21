import {
    AUDIT_READINESS_WEIGHTS,
    SUSPICIOUS_EXPENSE_PENALTY_PER_CASE,
    DEVIATION_PENALTY_PER_PERCENT_POINT,
} from '../config/constants';
import { countOverageExpenses } from './reconciliation';
import type { LedgerReconciliationResult, DatedAmount } from './reconciliation';

export interface AuditReadinessWeights {
    documentation: number;
    evidenceAttachment: number;
    suspiciousCount: number;
    deviationControl: number;
}

export interface AuditReadinessBreakdown {
    /** PTW 또는 TBM 중 하나 이상 연결된 지출 비율 (0~100) */
    documentationRate: number;
    /** 증빙 링크가 첨부된 지출 비율 (0~100) */
    evidenceAttachmentRate: number;
    /** 목적 외 의심 건수 */
    suspiciousCount: number;
    /** 의심 건수 기반 점수 (0~100, 건당 감점) */
    suspiciousScore: number;
    /** S-곡선 편차 절대값 (%p) */
    deviationPct: number;
    /** 편차 기반 점수 (0~100, %p당 감점) */
    deviationScore: number;
    /** 가중 합산 최종 점수 (0~100) */
    weightedScore: number;
    weights: AuditReadinessWeights;
}

interface AuditableExpense extends DatedAmount {
    ptwId?: string;
    tbmId?: string;
    evidenceUrl?: string;
}

/**
 * 감사 준비도 점수를 계산한다 (F11).
 * 각 하위 지표를 0~100으로 정규화한 뒤, config에 정의된 가중치로 합산한다.
 * @param expenses 프로젝트의 집행 목록
 * @param reconciliation reconcileLedger()의 결과 (의심 건수 계산에 계상액 필요)
 * @param deviationPct calculateDeviation()의 결과 (S-곡선 편차)
 * @param weights 가중치 (기본값: config의 AUDIT_READINESS_WEIGHTS)
 */
export function calculateAuditReadiness(
    expenses: readonly AuditableExpense[],
    reconciliation: LedgerReconciliationResult,
    deviationPct: number,
    weights: AuditReadinessWeights = AUDIT_READINESS_WEIGHTS
): AuditReadinessBreakdown {
    // 1. 계획: 하위 지표 4개를 각각 0~100으로 정규화 → 가중 평균으로 최종 점수 산출.
    // 2. 검증: 지출이 없을 때(0건), 모든 지표가 만점/0점인 경계값을 테스트에서 확인.
    // 3. 구현:
    const totalCount = expenses.length;

    const documentedCount = expenses.filter((e) => e.ptwId || e.tbmId).length;
    const documentationRate = totalCount === 0 ? 100 : (documentedCount / totalCount) * 100;

    const evidenceCount = expenses.filter((e) => e.evidenceUrl).length;
    const evidenceAttachmentRate = totalCount === 0 ? 100 : (evidenceCount / totalCount) * 100;

    const suspiciousCount = countOverageExpenses(reconciliation.allocated, expenses);
    const suspiciousScore = Math.max(0, 100 - suspiciousCount * SUSPICIOUS_EXPENSE_PENALTY_PER_CASE);

    const absDeviationPct = Math.abs(deviationPct);
    const deviationScore = Math.max(0, 100 - absDeviationPct * DEVIATION_PENALTY_PER_PERCENT_POINT);

    const weightSum = weights.documentation + weights.evidenceAttachment + weights.suspiciousCount + weights.deviationControl;
    const weightedScore =
        (documentationRate * weights.documentation +
            evidenceAttachmentRate * weights.evidenceAttachment +
            suspiciousScore * weights.suspiciousCount +
            deviationScore * weights.deviationControl) /
        weightSum;

    return {
        documentationRate,
        evidenceAttachmentRate,
        suspiciousCount,
        suspiciousScore,
        deviationPct: absDeviationPct,
        deviationScore,
        weightedScore,
        weights,
    };
}
