import { describe, it, expect } from 'vitest';
import { deriveRiskWeights, matchWorkTypeToRiskCoefficient, partitionWorkItemsByEligibility } from '../domain/riskWeightAllocation';
import { validateRiskWeightSum } from '../domain/weightedProgress';
import type { DetailWorkItem } from '../domain/costBreakdownImport';
import type { WorkPackage } from '../schemas/workPackage.schema';

function makeItem(overrides: Partial<DetailWorkItem>): DetailWorkItem {
    return { discipline: '건축', code: '01010105', name: '철근콘크리트공사', amount: 100, ...overrides };
}

/** 단일 대공종("건축") 테스트용 — 값은 disciplineShare=1이 되기만 하면 되므로 어떤 양수든 무방하다. */
const SINGLE_DISCIPLINE_TARGET_AMOUNTS = { 건축: 1 };

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

describe('deriveRiskWeights (단일 대공종 — 기존 평탄 분배와 동일하게 동작해야 함)', () => {
    it('정규화된 위험가중치의 합은 1이다', () => {
        const items = [
            makeItem({ code: 'A', name: '철근콘크리트공사', amount: 500 }),
            makeItem({ code: 'B', name: '철골공사', amount: 300 }),
            makeItem({ code: 'C', name: '칠공사', amount: 200 }),
        ];
        const result = deriveRiskWeights(items, SINGLE_DISCIPLINE_TARGET_AMOUNTS);
        const sum = result.reduce((acc, r) => acc + r.riskWeight, 0);
        expect(sum).toBeCloseTo(1);
    });

    it('위험계수가 클수록 같은 금액이라도 더 큰 가중치를 받는다', () => {
        const items = [
            makeItem({ code: 'A', name: '철골공사', amount: 100 }), // 고위험
            makeItem({ code: 'B', name: '칠공사', amount: 100 }), // 저위험
        ];
        const [a, b] = deriveRiskWeights(items, SINGLE_DISCIPLINE_TARGET_AMOUNTS);
        expect(a.riskWeight).toBeGreaterThan(b.riskWeight);
    });

    it('deriveRiskWeights 결과를 WorkPackage로 변환하면 validateRiskWeightSum을 통과한다', () => {
        const items = [
            makeItem({ code: 'A', name: '철근콘크리트공사', amount: 764_246_127 }),
            makeItem({ code: 'B', name: '철골공사', amount: 376_856_180 }),
            makeItem({ code: 'C', name: '방수공사', amount: 41_937_746 }),
        ];
        const allocations = deriveRiskWeights(items, SINGLE_DISCIPLINE_TARGET_AMOUNTS);
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
        const withoutOverride = deriveRiskWeights(items, SINGLE_DISCIPLINE_TARGET_AMOUNTS);
        expect(withoutOverride[0].matched).toBe(false);

        const withOverride = deriveRiskWeights(items, SINGLE_DISCIPLINE_TARGET_AMOUNTS, { A: 2.0 });
        expect(withOverride[0].matched).toBe(true);
        expect(withOverride[0].riskCoefficient).toBe(2.0);
    });

    it('입력이 비어있으면 예외를 던진다', () => {
        expect(() => deriveRiskWeights([], SINGLE_DISCIPLINE_TARGET_AMOUNTS)).toThrow();
    });

    it('모든 금액이 0이면 예외를 던진다', () => {
        expect(() => deriveRiskWeights([makeItem({ amount: 0 })], SINGLE_DISCIPLINE_TARGET_AMOUNTS)).toThrow();
    });

    it('임시소방시설은 산안비로 집행할 수 없는 항목이라 위험가중치 산정에서 제외된다', () => {
        const items = [
            makeItem({ code: 'A', name: '철근콘크리트공사', amount: 700 }),
            makeItem({ code: 'B', name: '임시소방시설', amount: 300 }),
        ];
        const result = deriveRiskWeights(items, SINGLE_DISCIPLINE_TARGET_AMOUNTS);
        expect(result.map((r) => r.name)).not.toContain('임시소방시설');
        expect(result).toHaveLength(1);
        // 제외 대상 금액이 정규화 분모에서도 빠져야 하므로 남은 항목의 가중치는 1이다.
        expect(result[0].riskWeight).toBeCloseTo(1);
    });

    it('제외 대상만 있으면(산안비 배분 대상 없음) 예외를 던진다', () => {
        expect(() =>
            deriveRiskWeights([makeItem({ code: 'A', name: '임시소방시설', amount: 100 })], SINGLE_DISCIPLINE_TARGET_AMOUNTS)
        ).toThrow();
    });

    it.each(['골재비', '주요자재비', '관로표시테이프', '하수관내CCTV조사'])(
        '%s는 시공 작업이 아닌 자재비/용역비 항목이라 위험가중치 산정에서 제외된다',
        (name) => {
            const items = [
                makeItem({ code: 'A', name: '철근콘크리트공사', amount: 700 }),
                makeItem({ code: 'B', name, amount: 300 }),
            ];
            const result = deriveRiskWeights(items, SINGLE_DISCIPLINE_TARGET_AMOUNTS);
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
        const result = deriveRiskWeights(items, SINGLE_DISCIPLINE_TARGET_AMOUNTS);
        expect(result).toHaveLength(1);
        expect(result[0].riskWeight).toBeCloseTo(1);
    });
});

describe('deriveRiskWeights (다중 대공종 — 2단계 배분)', () => {
    it('대공종 간 배분은 위험계수와 무관하게 대상액(disciplineTargetAmounts) 비례로만 이루어진다', () => {
        // 건축(대상액 900)은 저위험 항목 1개, 철탑(대상액 100)은 고위험 항목 1개 — 위험계수 차이가
        // 대공종 간 배분 비율(900:100 = 9:1)에 영향을 주면 안 된다.
        const items = [
            makeItem({ code: 'A', discipline: '건축', name: '칠공사', amount: 500 }), // 저위험
            makeItem({ code: 'B', discipline: '철탑', name: '철탑공사', amount: 500 }), // 특고위험
        ];
        const result = deriveRiskWeights(items, { 건축: 900, 철탑: 100 });
        const archItem = result.find((r) => r.discipline === '건축')!;
        const towerItem = result.find((r) => r.discipline === '철탑')!;
        // 각 대공종에 항목이 1개뿐이므로, 그 항목의 riskWeight = disciplineShare 그대로여야 한다.
        expect(archItem.riskWeight).toBeCloseTo(0.9);
        expect(towerItem.riskWeight).toBeCloseTo(0.1);
    });

    it('같은 대공종 내부에서는 여전히 위험계수가 반영된다', () => {
        const items = [
            makeItem({ code: 'A', discipline: '건축', name: '철골공사', amount: 100 }), // 고위험
            makeItem({ code: 'B', discipline: '건축', name: '칠공사', amount: 100 }), // 저위험
            makeItem({ code: 'C', discipline: '토목', name: '토공', amount: 100 }),
        ];
        const result = deriveRiskWeights(items, { 건축: 500, 토목: 500 });
        const steel = result.find((r) => r.code === 'A')!;
        const paint = result.find((r) => r.code === 'B')!;
        // 같은 대공종("건축") 내부에서는 금액이 같아도 위험계수가 큰 철골공사가 더 큰 가중치를 받는다.
        expect(steel.riskWeight).toBeGreaterThan(paint.riskWeight);
    });

    it('여러 대공종에 걸쳐도 전체 위험가중치 합은 1이다', () => {
        const items = [
            makeItem({ code: 'A', discipline: '건축', name: '철근콘크리트공사', amount: 300 }),
            makeItem({ code: 'B', discipline: '건축', name: '철골공사', amount: 200 }),
            makeItem({ code: 'C', discipline: '토목', name: '토공', amount: 150 }),
            makeItem({ code: 'D', discipline: '철탑', name: '망공사', amount: 80 }),
            makeItem({ code: 'E', discipline: '전기', name: '옥외배관공사', amount: 40 }),
        ];
        const result = deriveRiskWeights(items, { 건축: 1_000_000, 토목: 400_000, 철탑: 300_000, 전기: 50_000 });
        const sum = result.reduce((acc, r) => acc + r.riskWeight, 0);
        expect(sum).toBeCloseTo(1);
    });

    it('한 대공종의 배분 대상 항목이 전부 제외 대상이면, 남은 대공종끼리 재정규화되어 합은 여전히 1이다', () => {
        const items = [
            makeItem({ code: 'A', discipline: '건축', name: '철근콘크리트공사', amount: 500 }),
            makeItem({ code: 'B', discipline: '토목', name: '골재비', amount: 500 }), // 대공종 전체가 제외 대상
        ];
        const result = deriveRiskWeights(items, { 건축: 500, 토목: 500 });
        expect(result).toHaveLength(1);
        expect(result[0].discipline).toBe('건축');
        expect(result[0].riskWeight).toBeCloseTo(1);
    });

    it('disciplineTargetAmounts에 없는 대공종은 대상액 0으로 간주해 배분에서 사실상 제외된다', () => {
        const items = [
            makeItem({ code: 'A', discipline: '건축', name: '철근콘크리트공사', amount: 500 }),
            makeItem({ code: 'B', discipline: '미상공종', name: '기타공사', amount: 500 }),
        ];
        // '미상공종'은 disciplineTargetAmounts에 없음 → 0으로 취급
        const result = deriveRiskWeights(items, { 건축: 900 });
        const unknown = result.find((r) => r.discipline === '미상공종')!;
        expect(unknown.riskWeight).toBeCloseTo(0);
    });

    it('배분 가능한 대공종의 대상액 합이 0이면 예외를 던진다', () => {
        const items = [makeItem({ code: 'A', discipline: '미상공종', name: '기타공사', amount: 500 })];
        expect(() => deriveRiskWeights(items, {})).toThrow();
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
