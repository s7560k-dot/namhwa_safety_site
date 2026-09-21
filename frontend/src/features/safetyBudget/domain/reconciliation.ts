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

export interface DatedAmount {
    date: string;
    amount: number;
}

/**
 * 계상액을 초과시킨 "건수"를 센다 (F11 감사 준비도 산식용).
 * 일자 오름차순으로 누적 집행액을 쌓아가다가, 누적액이 계상액을 처음 넘어선 시점부터의
 * 지출 건수를 목적 외 의심 건수로 본다.
 * @param allocated 계상액
 * @param expenses 일자(date)를 가진 지출 목록 (정렬되지 않아도 됨)
 */
export function countOverageExpenses(allocated: number, expenses: readonly DatedAmount[]): number {
    // 1. 계획: 일자순 정렬 → 누적합 → 누적합이 계상액을 넘은 이후의 건수를 카운트.
    // 2. 검증: 초과가 없을 때 0건, 초과 시작 건부터 이후 전부 포함되는지 테스트에서 확인.
    // 3. 구현:
    const sorted = [...expenses].sort((a, b) => (a.date < b.date ? -1 : 1));
    let cumulative = 0;
    let overageCount = 0;
    for (const expense of sorted) {
        cumulative += expense.amount;
        if (cumulative > allocated) {
            overageCount += 1;
        }
    }
    return overageCount;
}
