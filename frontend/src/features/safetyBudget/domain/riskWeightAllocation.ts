import { WORK_TYPE_RISK_COEFFICIENTS, DEFAULT_RISK_COEFFICIENT } from '../config/riskCoefficient.config';
import { NON_ELIGIBLE_WORK_TYPES } from '../config/nonEligibleWorkTypes.config';
import type { DetailWorkItem } from './costBreakdownImport';

export interface ExcludedWorkItem extends DetailWorkItem {
    /** 산안비 집행 대상에서 제외된 사유. */
    reason: string;
}

function findExclusionReason(name: string): string | undefined {
    return NON_ELIGIBLE_WORK_TYPES.find((entry) => entry.name === name)?.reason;
}

/**
 * 세부공종 목록을 "산안비 위험가중 배분 대상"과 "제외 대상"(산안비로 집행할 수 없는 공종)으로 나눈다.
 * 제외 대상은 위험가중치 산정에 포함되지 않지만, 대상액·계상금액 계산에는 영향을 주지 않는다
 * (대상액은 재료비+노무비 총액 기준으로, 산안비 집행 가능 여부와 무관하기 때문).
 */
export function partitionWorkItemsByEligibility(items: readonly DetailWorkItem[]): {
    eligible: DetailWorkItem[];
    excluded: ExcludedWorkItem[];
} {
    const eligible: DetailWorkItem[] = [];
    const excluded: ExcludedWorkItem[] = [];
    for (const item of items) {
        const reason = findExclusionReason(item.name);
        if (reason) {
            excluded.push({ ...item, reason });
        } else {
            eligible.push(item);
        }
    }
    return { eligible, excluded };
}

/** 위험계수 매칭 결과가 포함된 세부공종별 위험가중치 산정 결과. */
export interface RiskWeightAllocationItem {
    discipline: string;
    code: string;
    name: string;
    amount: number;
    riskCoefficient: number;
    /** 위험계수 테이블에 정확히 매칭됐는지 여부. false면 기본계수가 적용된 것이므로 화면에서 검토를 유도해야 한다. */
    matched: boolean;
    /** 정규화된 위험가중치 (0~1, 전체 합=1). */
    riskWeight: number;
}

/** 세부공종명(이미 공백 제거된 정규화 이름)에 대해 위험계수를 찾는다. 실패 시 기본계수를 반환한다. */
export function matchWorkTypeToRiskCoefficient(name: string): { coefficient: number; matched: boolean } {
    const coefficient = WORK_TYPE_RISK_COEFFICIENTS[name];
    if (coefficient === undefined) {
        return { coefficient: DEFAULT_RISK_COEFFICIENT, matched: false };
    }
    return { coefficient, matched: true };
}

/**
 * 세부공종별 위험가중치를 2단계로 산정한다 (F13-2):
 *   1단계(대공종 간 배분): 건축/토목/기계/철탑/전기/통신/소방 같은 대공종 사이의 배분은 원가계산서
 *     (원가(건축)/원가(토목)/... 시트)가 실제로 쓰는 방식과 동일하게 **대상액(재료비+노무비) 비례**로 나눈다.
 *     이 시트들은 대공종마다 위험도를 구분하지 않고 금액 비례로만 산안비를 나누므로, 대공종 레벨에서는
 *     위험계수를 적용하지 않는다 — 그래야 대공종별 배분 합계가 원본 내역서의 원가계산서 금액과 일치한다.
 *   2단계(대공종 내부 배분): 같은 대공종에 속한 세부공종끼리는 기존처럼 금액 × 위험계수로 배분한다.
 * riskWeight_i = disciplineShare(discipline_i) × (amount_i × coefficient_i) / Σ_{j∈같은 대공종}(amount_j × coefficient_j)
 * NON_ELIGIBLE_WORK_TYPES(산안비로 집행할 수 없는 공종, 예: 임시소방시설)는 자동으로 제외하고 계산한다.
 * @param disciplineTargetAmounts 대공종별 대상액(재료비+노무비). costBreakdownImport의 결과를 그대로 넘기면 된다.
 * @param overrides 사용자가 미리보기 화면에서 수동으로 지정한 위험계수 (코드 기준, 매칭 실패 항목 보정용)
 * @throws {Error} 산안비 배분 대상 공종이 없거나, 배분 가능한 대공종의 대상액 합이 0일 때
 */
export function deriveRiskWeights(
    detailWorkItems: readonly DetailWorkItem[],
    disciplineTargetAmounts: Readonly<Record<string, number>>,
    overrides: Readonly<Record<string, number>> = {}
): RiskWeightAllocationItem[] {
    const { eligible } = partitionWorkItemsByEligibility(detailWorkItems);
    if (eligible.length === 0) {
        throw new Error('세부공종 데이터가 없어 위험가중치를 산정할 수 없습니다.');
    }

    const withCoefficients = eligible.map((item) => {
        if (item.code in overrides) {
            return { ...item, coefficient: overrides[item.code], matched: true };
        }
        const { coefficient, matched } = matchWorkTypeToRiskCoefficient(item.name);
        return { ...item, coefficient, matched };
    });

    const byDiscipline = new Map<string, typeof withCoefficients>();
    for (const item of withCoefficients) {
        const list = byDiscipline.get(item.discipline);
        if (list) {
            list.push(item);
        } else {
            byDiscipline.set(item.discipline, [item]);
        }
    }

    // 대공종 내부 가중합(금액×계수)이 0보다 큰 대공종만 배분 대상으로 삼는다. 그래야 1단계 재정규화 분모와
    // 2단계 내부 배분 분모가 항상 짝을 이뤄, 전체 riskWeight 합이 정확히 1이 된다(가중합 0인 대공종을
    // 분모엔 넣고 분자는 못 만드는 상황을 막음).
    const disciplineWeightedSums = new Map<string, number>();
    for (const [discipline, items] of byDiscipline) {
        const sum = items.reduce((acc, item) => acc + item.amount * item.coefficient, 0);
        if (sum > 0) {
            disciplineWeightedSums.set(discipline, sum);
        }
    }

    const totalDisciplineTargetAmount = [...disciplineWeightedSums.keys()].reduce(
        (sum, discipline) => sum + Math.max(disciplineTargetAmounts[discipline] ?? 0, 0),
        0
    );
    if (totalDisciplineTargetAmount <= 0) {
        throw new Error('배분 대상 대공종의 대상액 정보가 없거나 0입니다. 위험가중치를 산정할 수 없습니다.');
    }

    const result: RiskWeightAllocationItem[] = [];
    for (const [discipline, weightedSum] of disciplineWeightedSums) {
        const items = byDiscipline.get(discipline) ?? [];
        const disciplineShare = Math.max(disciplineTargetAmounts[discipline] ?? 0, 0) / totalDisciplineTargetAmount;

        for (const item of items) {
            const withinDisciplineShare = (item.amount * item.coefficient) / weightedSum;
            result.push({
                discipline: item.discipline,
                code: item.code,
                name: item.name,
                amount: item.amount,
                riskCoefficient: item.coefficient,
                matched: item.matched,
                riskWeight: disciplineShare * withinDisciplineShare,
            });
        }
    }

    return result;
}
