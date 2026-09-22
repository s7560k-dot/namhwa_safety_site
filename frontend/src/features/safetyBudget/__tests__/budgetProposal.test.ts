import { describe, it, expect } from 'vitest';
import { calculateAllocatedAmount, sortWorkPackagesForProposal } from '../domain/budgetProposal';
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
