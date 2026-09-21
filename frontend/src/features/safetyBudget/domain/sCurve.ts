import { DEFAULT_S_CURVE_SHAPE, DEVIATION_ALERT_THRESHOLDS } from '../config/constants';
import type { AlertLevel } from '../config/constants';

export interface SCurveShape {
    /** 0~1 사이 지수. 1보다 작을수록 초기 구간에 집행을 앞당겨 배분(초기 집중형). */
    frontLoadExponent: number;
}

/**
 * 위험 가중 공정률로부터 목표 누적 집행률을 계산한다.
 * target = 100 * (progress/100)^frontLoadExponent
 * exponent < 1 이면 초기 집중형(같은 진행률에서 목표 집행률이 진행률보다 높게 잡힘).
 * @param weightedProgressPct 0~100 사이 위험 가중 공정률
 * @param shape S-곡선 형태 설정 (미지정 시 기본 초기 집중형 사용)
 * @returns 0~100 사이 목표 누적 집행률(%)
 */
export function getTargetCumulativeExecutionRate(
    weightedProgressPct: number,
    shape: SCurveShape = DEFAULT_S_CURVE_SHAPE
): number {
    // 1. 계획: 진행률을 0~1로 정규화 후 지수 곡선 적용, 0~100으로 환산.
    // 2. 검증: 진행률 0%→목표 0%, 진행률 100%→목표 100% 경계값을 테스트에서 확인.
    // 3. 구현:
    const clampedProgress = Math.min(100, Math.max(0, weightedProgressPct));
    const normalized = clampedProgress / 100;
    return Math.pow(normalized, shape.frontLoadExponent) * 100;
}

/**
 * 실제 누적 집행률과 목표 누적 집행률의 편차를 계산한다.
 * @returns 실제 - 목표 (양수면 목표보다 더 많이 집행, 음수면 목표보다 덜 집행)
 */
export function calculateDeviation(actualCumulativeExecutionPct: number, targetCumulativeExecutionPct: number): number {
    return actualCumulativeExecutionPct - targetCumulativeExecutionPct;
}

/**
 * 편차(%p)의 절대값을 기준으로 경보 단계를 판정한다.
 * @param deviationPct calculateDeviation()의 결과
 */
export interface DeviationThresholds {
    CAUTION: number;
    WARNING: number;
}

export function getAlertLevel(
    deviationPct: number,
    thresholds: DeviationThresholds = DEVIATION_ALERT_THRESHOLDS
): AlertLevel {
    const absDeviation = Math.abs(deviationPct);
    if (absDeviation >= thresholds.WARNING) return 'warning';
    if (absDeviation >= thresholds.CAUTION) return 'caution';
    return 'normal';
}
