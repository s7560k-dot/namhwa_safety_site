import { describe, it, expect } from 'vitest';
import { deriveRiskWeights, matchWorkTypeToRiskCoefficient } from '../domain/riskWeightAllocation';
import { validateRiskWeightSum } from '../domain/weightedProgress';
import type { DetailWorkItem } from '../domain/costBreakdownImport';
import type { WorkPackage } from '../schemas/workPackage.schema';

function makeItem(overrides: Partial<DetailWorkItem>): DetailWorkItem {
    return { discipline: '건축', code: '01010105', name: '철근콘크리트공사', amount: 100, ...overrides };
}

describe('matchWorkTypeToRiskCoefficient', () => {
    it('등록된 공종명은 매칭되고 matched=true를 반환한다', () => {
        const result = matchWorkTypeToRiskCoefficient('철골공사');
        expect(result.matched).toBe(true);
        expect(result.coefficient).toBeGreaterThan(1);
    });

    it('등록되지 않은 공종명은 기본계수와 matched=false를 반환한다', () => {
        const result = matchWorkTypeToRiskCoefficient('존재하지않는공종');
        expect(result.matched).toBe(false);
        expect(result.coefficient).toBe(1.0);
    });
});

describe('deriveRiskWeights', () => {
    it('정규화된 위험가중치의 합은 1이다', () => {
        const items = [
            makeItem({ code: 'A', name: '철근콘크리트공사', amount: 500 }),
            makeItem({ code: 'B', name: '철골공사', amount: 300 }),
            makeItem({ code: 'C', name: '칠공사', amount: 200 }),
        ];
        const result = deriveRiskWeights(items);
        const sum = result.reduce((acc, r) => acc + r.riskWeight, 0);
        expect(sum).toBeCloseTo(1);
    });

    it('위험계수가 클수록 같은 금액이라도 더 큰 가중치를 받는다', () => {
        const items = [
            makeItem({ code: 'A', name: '철골공사', amount: 100 }), // 고위험
            makeItem({ code: 'B', name: '칠공사', amount: 100 }), // 저위험
        ];
        const [a, b] = deriveRiskWeights(items);
        expect(a.riskWeight).toBeGreaterThan(b.riskWeight);
    });

    it('deriveRiskWeights 결과를 WorkPackage로 변환하면 validateRiskWeightSum을 통과한다', () => {
        const items = [
            makeItem({ code: 'A', name: '철근콘크리트공사', amount: 764_246_127 }),
            makeItem({ code: 'B', name: '철골공사', amount: 376_856_180 }),
            makeItem({ code: 'C', name: '방수공사', amount: 41_937_746 }),
        ];
        const allocations = deriveRiskWeights(items);
        const workPackages: WorkPackage[] = allocations.map((a, i) => ({
            id: `wp-${i}`,
            projectId: 'siteA',
            name: a.name,
            riskWeight: a.riskWeight,
            plannedProgressCurve: [],
            currentProgressPct: 0,
        }));
        expect(validateRiskWeightSum(workPackages)).toBe(true);
    });

    it('매칭 실패 항목은 override로 보정할 수 있다', () => {
        const items = [makeItem({ code: 'A', name: '존재하지않는공종', amount: 100 })];
        const withoutOverride = deriveRiskWeights(items);
        expect(withoutOverride[0].matched).toBe(false);

        const withOverride = deriveRiskWeights(items, { A: 2.0 });
        expect(withOverride[0].matched).toBe(true);
        expect(withOverride[0].riskCoefficient).toBe(2.0);
    });

    it('입력이 비어있으면 예외를 던진다', () => {
        expect(() => deriveRiskWeights([])).toThrow();
    });

    it('모든 금액이 0이면 예외를 던진다', () => {
        expect(() => deriveRiskWeights([makeItem({ amount: 0 })])).toThrow();
    });
});
