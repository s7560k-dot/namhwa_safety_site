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
