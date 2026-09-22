import { describe, it, expect } from 'vitest';
import { deriveRiskWeights, matchWorkTypeToRiskCoefficient, partitionWorkItemsByEligibility } from '../domain/riskWeightAllocation';
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

    it('임시소방시설은 산안비로 집행할 수 없는 항목이라 위험가중치 산정에서 제외된다', () => {
        const items = [
            makeItem({ code: 'A', name: '철근콘크리트공사', amount: 700 }),
            makeItem({ code: 'B', name: '임시소방시설', amount: 300 }),
        ];
        const result = deriveRiskWeights(items);
        expect(result.map((r) => r.name)).not.toContain('임시소방시설');
        expect(result).toHaveLength(1);
        // 제외 대상 금액이 정규화 분모에서도 빠져야 하므로 남은 항목의 가중치는 1이다.
        expect(result[0].riskWeight).toBeCloseTo(1);
    });

    it('제외 대상만 있으면(산안비 배분 대상 없음) 예외를 던진다', () => {
        expect(() => deriveRiskWeights([makeItem({ code: 'A', name: '임시소방시설', amount: 100 })])).toThrow();
    });

    it.each(['골재비', '주요자재비', '관로표시테이프', '하수관내CCTV조사'])(
        '%s는 시공 작업이 아닌 자재비/용역비 항목이라 위험가중치 산정에서 제외된다',
        (name) => {
            const items = [
                makeItem({ code: 'A', name: '철근콘크리트공사', amount: 700 }),
                makeItem({ code: 'B', name, amount: 300 }),
            ];
            const result = deriveRiskWeights(items);
            expect(result.map((r) => r.name)).not.toContain(name);
        }
    );

    it('같은 이름의 제외 대상이 여러 개(코드가 달라도)라도 모두 제외된다', () => {
        // 실제 내역서에서 "하수관내CCTV조사"가 서로 다른 코드로 3번 등장하는 사례를 재현
        const items = [
            makeItem({ code: 'A', name: '철근콘크리트공사', amount: 700 }),
            makeItem({ code: 'B1', name: '하수관내CCTV조사', amount: 10 }),
            makeItem({ code: 'B2', name: '하수관내CCTV조사', amount: 20 }),
            makeItem({ code: 'B3', name: '하수관내CCTV조사', amount: 30 }),
        ];
        const result = deriveRiskWeights(items);
        expect(result).toHaveLength(1);
        expect(result[0].riskWeight).toBeCloseTo(1);
    });
});

describe('partitionWorkItemsByEligibility', () => {
    it('산안비 집행 불가 항목(임시소방시설)을 사유와 함께 분리한다', () => {
        const items = [
            makeItem({ code: 'A', name: '철근콘크리트공사', amount: 700 }),
            makeItem({ code: 'B', name: '임시소방시설', amount: 300 }),
        ];
        const { eligible, excluded } = partitionWorkItemsByEligibility(items);
        expect(eligible.map((i) => i.name)).toEqual(['철근콘크리트공사']);
        expect(excluded).toHaveLength(1);
        expect(excluded[0].name).toBe('임시소방시설');
        expect(excluded[0].reason).toContain('산안비로 집행할 수 없다');
    });

    it('제외 대상이 없으면 excluded는 빈 배열이다', () => {
        const { excluded } = partitionWorkItemsByEligibility([makeItem({ name: '철골공사' })]);
        expect(excluded).toEqual([]);
    });
});
