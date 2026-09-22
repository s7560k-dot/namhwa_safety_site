import { BUDGET_ITEM_CODE_LABELS } from '../config/constants';
import type { BudgetItemCode } from '../config/constants';

const LABEL_TO_CODE: Record<string, BudgetItemCode> = Object.fromEntries(
    Object.entries(BUDGET_ITEM_CODE_LABELS).map(([code, label]) => [label, code as BudgetItemCode])
);

/**
 * 사용내역서 PDF 파싱 결과의 itemLabel(한글 라벨)을 앱의 BudgetItemCode로 변환한다.
 * 사용내역서는 고시 별지서식의 고정된 라벨만 쓰므로 정확매칭만으로 충분하다 (공사비 내역서의 공종명과 달리
 * 퍼지매칭/위험계수 같은 보정 로직이 필요 없음).
 * @param label Gemini가 추출한 itemLabel. null이거나 알 수 없는 라벨이면 null 반환.
 */
export function matchItemLabelToBudgetCode(label: string | null | undefined): BudgetItemCode | null {
    if (!label) {
        return null;
    }
    return LABEL_TO_CODE[label] ?? null;
}
