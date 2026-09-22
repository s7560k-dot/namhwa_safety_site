import { BUDGET_ITEM_CODES } from '../config/constants';
import type { Expense } from '../schemas/expense.schema';

const ITEM_CODE_ORDER = new Map(BUDGET_ITEM_CODES.map((code, index) => [code, index]));

/**
 * 현황 대시보드 "집행 내역" 표시 순서: 월(오래된 달부터) → 비목(고시 별지서식 ①~⑧ 순서, 스마트장비는 마지막) → 날짜(오래된 날짜부터).
 * 원본 배열은 변경하지 않는다.
 */
export function sortExpensesForDisplay(expenses: readonly Expense[]): Expense[] {
    return [...expenses].sort((a, b) => {
        const monthA = a.date.slice(0, 7);
        const monthB = b.date.slice(0, 7);
        if (monthA !== monthB) {
            return monthA < monthB ? -1 : 1;
        }

        const orderA = ITEM_CODE_ORDER.get(a.itemCode) ?? Number.MAX_SAFE_INTEGER;
        const orderB = ITEM_CODE_ORDER.get(b.itemCode) ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) {
            return orderA - orderB;
        }

        if (a.date !== b.date) {
            return a.date < b.date ? -1 : 1;
        }
        return 0;
    });
}
