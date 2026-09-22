import type { WorkPackage } from '../schemas/workPackage.schema';

/** 공종의 위험가중치를 계상금액에 적용한 배분 금액 (예산 품의서 F15용). */
export function calculateAllocatedAmount(riskWeight: number, allocatedSafetyBudget: number): number {
    return riskWeight * allocatedSafetyBudget;
}

/** 예산 품의서 표시 순서: 배분 금액(위험가중치)이 큰 공종부터. 동률이면 이름순으로 안정 정렬. */
export function sortWorkPackagesForProposal(workPackages: readonly WorkPackage[]): WorkPackage[] {
    return [...workPackages].sort((a, b) => {
        if (b.riskWeight !== a.riskWeight) {
            return b.riskWeight - a.riskWeight;
        }
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
}

export interface DisciplineGroup {
    /** discipline이 없는(수동 생성 등) 공종은 "기타"로 묶는다. */
    discipline: string;
    workPackages: WorkPackage[];
    riskWeight: number;
}

/**
 * 예산 품의서용 대공종 그룹핑. 대공종 간 배분은 위험계수와 무관하게 대상액 비례로 정해지므로
 * (deriveRiskWeights 참고), 대공종별 소계를 보여주면 그 배분 근거가 눈에 보인다.
 * 그룹 순서는 대공종 소계(riskWeight)가 큰 순서, 그룹 내부는 sortWorkPackagesForProposal과 동일하게 정렬한다.
 */
export function groupWorkPackagesByDiscipline(workPackages: readonly WorkPackage[]): DisciplineGroup[] {
    const byDiscipline = new Map<string, WorkPackage[]>();
    for (const wp of workPackages) {
        const key = wp.discipline ?? '기타';
        const list = byDiscipline.get(key);
        if (list) {
            list.push(wp);
        } else {
            byDiscipline.set(key, [wp]);
        }
    }

    return [...byDiscipline.entries()]
        .map(([discipline, items]) => ({
            discipline,
            workPackages: sortWorkPackagesForProposal(items),
            riskWeight: items.reduce((sum, wp) => sum + wp.riskWeight, 0),
        }))
        .sort((a, b) => b.riskWeight - a.riskWeight);
}
