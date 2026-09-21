import type { Expense } from '../schemas/expense.schema';

/**
 * 증빙이 약한 지출인지 판정한다 (F10).
 * 증빙 링크가 없거나, PTW/TBM 어느 쪽에도 연결되지 않은 경우 약한 증빙으로 본다.
 */
export function hasWeakEvidence(expense: Pick<Expense, 'evidenceUrl' | 'ptwId' | 'tbmId'>): boolean {
    const missingEvidenceUrl = !expense.evidenceUrl;
    const missingPtwAndTbm = !expense.ptwId && !expense.tbmId;
    return missingEvidenceUrl || missingPtwAndTbm;
}
