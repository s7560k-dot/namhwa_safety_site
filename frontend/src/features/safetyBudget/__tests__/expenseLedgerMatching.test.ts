import { describe, it, expect } from 'vitest';
import { matchItemLabelToBudgetCode } from '../domain/expenseLedgerMatching';
import { BUDGET_ITEM_CODE_LABELS } from '../config/constants';
import type { BudgetItemCode } from '../config/constants';

describe('matchItemLabelToBudgetCode', () => {
    it.each(Object.entries(BUDGET_ITEM_CODE_LABELS) as [BudgetItemCode, string][])(
        '"%s" 코드의 공식 라벨 "%s"은 정확히 매칭된다',
        (code, label) => {
            expect(matchItemLabelToBudgetCode(label)).toBe(code);
        }
    );

    it('알 수 없는 라벨은 null을 반환한다', () => {
        expect(matchItemLabelToBudgetCode('알수없는비목')).toBeNull();
    });

    it('null 또는 undefined 라벨은 null을 반환한다', () => {
        expect(matchItemLabelToBudgetCode(null)).toBeNull();
        expect(matchItemLabelToBudgetCode(undefined)).toBeNull();
    });
});
