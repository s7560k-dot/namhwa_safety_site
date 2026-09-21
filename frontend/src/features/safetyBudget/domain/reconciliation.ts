export interface LedgerReconciliationResult {
    /** 계상액 (수입 측 원장) */
    allocated: number;
    /** 집행 원장 합계 원본값 (상한 처리 이전) */
    executedTotal: number;
    /** 집계 단계에서 계상액을 상한으로 잘라낸 집행 합계. 원본 executedTotal은 건드리지 않는다. */
    cappedExecutedTotal: number;
    /** executedTotal이 allocated를 초과해 상한이 적용됐는지 여부 */
    capApplied: boolean;
    /** 미집행 잔액 = max(계상 - 집행, 0) */
    unexecutedBalance: number;
    /** 목적 외 의심 금액 = max(집행 - 계상, 0). 0보다 크면 검토 대상. */
    suspiciousOverageAmount: number;
}

/**
 * 계상 원장과 집행 원장을 대사(對査)한다.
 * 초과분은 원본 지출 데이터를 깎지 않고, 집계 단계에서만 상한(cap) 처리한다.
 * @param allocated 계상액(계약 금액 기준)
 * @param expenseAmounts 집행 원장의 개별 지출 금액 목록
 */
export function reconcileLedger(
    allocated: number,
    expenseAmounts: readonly number[]
): LedgerReconciliationResult {
    // 1. 계획: 원본 집행 합계를 먼저 구하고, 상한 처리는 별도 파생값으로만 계산한다.
    // 2. 검증: 집행이 계상보다 적을 때/많을 때/정확히 같을 때 경계값을 테스트에서 확인.
    // 3. 구현:
    const executedTotal = expenseAmounts.reduce((sum, amount) => sum + amount, 0);
    const cappedExecutedTotal = Math.min(executedTotal, allocated);
    const capApplied = executedTotal > allocated;

    return {
        allocated,
        executedTotal,
        cappedExecutedTotal,
        capApplied,
        unexecutedBalance: Math.max(allocated - executedTotal, 0),
        suspiciousOverageAmount: Math.max(executedTotal - allocated, 0),
    };
}
