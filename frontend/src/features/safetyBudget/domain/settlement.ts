import type { SettlementRuleType } from '../schemas/project.schema';
import type { SettlementRefundRule } from '../config/regulation.config';
import { PUBLIC_SETTLEMENT_RULE, PRIVATE_SETTLEMENT_RULE } from '../config/regulation.config';

export interface SettlementContext {
    allocatedSafetyBudget: number;
    /** reconcileLedger().unexecutedBalance */
    unexecutedBalance: number;
}

export type SettlementResult =
    | { status: 'CALCULATED'; refundAmount: number; explanation: string }
    | { status: 'CONFIG_MISSING'; reason: string };

export interface SettlementStrategy {
    calculate(ctx: SettlementContext): SettlementResult;
}

/**
 * 미집행 잔액에 반환 비율을 곱해 반환/감액 금액을 계산하는 전략을 만든다.
 * 공공 반환·감액형과 민간 계약형 모두 "비율 × 미집행 잔액" 구조는 같고, 비율의 출처(고시/계약)만 다르다.
 * @param rule 반환 비율 설정. 미확정(undefined)이면 계산을 거부한다.
 * @param ruleLabel 설정 미비 시 안내 메시지에 쓸 규칙 이름
 */
export function createRefundRatioStrategy(rule: SettlementRefundRule | undefined, ruleLabel: string): SettlementStrategy {
    return {
        calculate(ctx: SettlementContext): SettlementResult {
            if (!rule) {
                return { status: 'CONFIG_MISSING', reason: `${ruleLabel} 반환 비율이 아직 설정되지 않았습니다 (확인 필요).` };
            }
            const refundAmount = (ctx.unexecutedBalance * rule.refundRatioOfUnexecuted) / 100;
            return {
                status: 'CALCULATED',
                refundAmount,
                explanation: `미집행 잔액 ${ctx.unexecutedBalance.toLocaleString()}원 × 반환비율 ${rule.refundRatioOfUnexecuted}% = ${refundAmount.toLocaleString()}원`,
            };
        },
    };
}

const publicRefundSettlementStrategy = createRefundRatioStrategy(PUBLIC_SETTLEMENT_RULE, '공공 반환·감액형');
const privateContractSettlementStrategy = createRefundRatioStrategy(PRIVATE_SETTLEMENT_RULE, '민간 계약형');

/** 정산 규칙 유형에 맞는 전략을 반환한다 (전략 패턴, F7). */
export function getSettlementStrategy(ruleType: SettlementRuleType): SettlementStrategy {
    switch (ruleType) {
        case 'PUBLIC_REFUND':
            return publicRefundSettlementStrategy;
        case 'PRIVATE_CONTRACT':
            return privateContractSettlementStrategy;
    }
}
