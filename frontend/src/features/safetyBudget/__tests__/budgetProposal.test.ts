import { describe, it, expect } from 'vitest';
import { calculateAllocatedAmount, sortWorkPackagesForProposal, groupWorkPackagesByDiscipline } from '../domain/budgetProposal';
import type { WorkPackage } from '../schemas/workPackage.schema';

function makeWorkPackage(overrides: Partial<WorkPackage>): WorkPackage {
    return {
        id: 'wp-1',
        projectId: 'siteA',
        name: '테스트 공종',
        riskWeight: 0.1,
        plannedProgressCurve: [],
        currentProgressPct: 0,
        ...overrides,
    };
}

describe('calculateAllocatedAmount', () => {
    it('위험가중치 × 계상금액을 계산한다', () => {
        expect(calculateAllocatedAmount(0.1, 129_020_112)).toBeCloseTo(12_902_011.2);
    });

    it('위험가중치 0이면 배분 금액도 0이다', () => {
        expect(calculateAllocatedAmount(0, 100_000_000)).toBe(0);
    });
});

describe('sortWorkPackagesForProposal', () => {
    it('위험가중치가 큰 공종부터 정렬한다', () => {
        const items = [
            makeWorkPackage({ id: 'a', name: 'A', riskWeight: 0.1 }),
            makeWorkPackage({ id: 'b', name: 'B', riskWeight: 0.5 }),
            makeWorkPackage({ id: 'c', name: 'C', riskWeight: 0.3 }),
        ];
        const result = sortWorkPackagesForProposal(items);
        expect(result.map((w) => w.id)).toEqual(['b', 'c', 'a']);
    });

    it('위험가중치가 같으면 이름순으로 정렬한다', () => {
        const items = [
            makeWorkPackage({ id: 'z', name: '철골공사', riskWeight: 0.2 }),
            makeWorkPackage({ id: 'a', name: '가설공사', riskWeight: 0.2 }),
        ];
        const result = sortWorkPackagesForProposal(items);
        expect(result.map((w) => w.id)).toEqual(['a', 'z']);
    });

    it('원본 배열을 변경하지 않는다', () => {
        const items = [makeWorkPackage({ id: 'a', riskWeight: 0.1 }), makeWorkPackage({ id: 'b', riskWeight: 0.5 })];
        const original = [...items];
        sortWorkPackagesForProposal(items);
        expect(items).toEqual(original);
    });
});

describe('groupWorkPackagesByDiscipline', () => {
    it('discipline별로 묶고 대공종 소계(riskWeight 합)를 계산한다', () => {
        const items = [
            makeWorkPackage({ id: 'a', discipline: '건축', riskWeight: 0.3 }),
            makeWorkPackage({ id: 'b', discipline: '토목', riskWeight: 0.2 }),
            makeWorkPackage({ id: 'c', discipline: '건축', riskWeight: 0.5 }),
        ];
        const groups = groupWorkPackagesByDiscipline(items);
        expect(groups.map((g) => g.discipline)).toEqual(['건축', '토목']); // 소계 큰 순서(0.8 > 0.2)
        expect(groups[0].riskWeight).toBeCloseTo(0.8);
        expect(groups[0].workPackages.map((w) => w.id)).toEqual(['c', 'a']); // 그룹 내부는 riskWeight 내림차순
        expect(groups[1].riskWeight).toBeCloseTo(0.2);
    });

    it('discipline이 없는 공종은 "기타"로 묶는다', () => {
        const items = [makeWorkPackage({ id: 'a', discipline: undefined, riskWeight: 0.1 })];
        const groups = groupWorkPackagesByDiscipline(items);
        expect(groups).toHaveLength(1);
        expect(groups[0].discipline).toBe('기타');
    });

    it('전체 그룹의 riskWeight 합은 원본 전체 합과 같다', () => {
        const items = [
            makeWorkPackage({ id: 'a', discipline: '건축', riskWeight: 0.3 }),
            makeWorkPackage({ id: 'b', discipline: '토목', riskWeight: 0.2 }),
            makeWorkPackage({ id: 'c', discipline: '철탑', riskWeight: 0.5 }),
        ];
        const groups = groupWorkPackagesByDiscipline(items);
        const total = groups.reduce((sum, g) => sum + g.riskWeight, 0);
        expect(total).toBeCloseTo(1);
    });
});
