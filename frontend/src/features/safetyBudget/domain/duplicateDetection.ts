export interface ExpenseIdentityFields {
    date: string;
    itemCode: string;
    amount: number;
}

/**
 * 두 지출이 중복 등록으로 의심되는지 판정한다 (F14).
 * 같은 프로젝트 내에서 날짜·비목·금액이 전부 동일하면 중복으로 본다 — 특히 같은 사용내역서 PDF를
 * 실수로 다시 업로드해 일괄등록했을 때 동일 항목이 반복 등록되는 상황을 막기 위함이다.
 */
export function isDuplicateExpense(candidate: ExpenseIdentityFields, existing: ExpenseIdentityFields): boolean {
    return candidate.date === existing.date && candidate.itemCode === existing.itemCode && candidate.amount === existing.amount;
}

/** candidate와 중복되는 기존 지출을 찾는다. 없으면 undefined. */
export function findDuplicateExpense<T extends ExpenseIdentityFields>(candidate: ExpenseIdentityFields, existing: readonly T[]): T | undefined {
    return existing.find((e) => isDuplicateExpense(candidate, e));
}
