import { RebarDiameter, CalculationInput, CalculationResult } from '../types/material';

const REBAR_UNIT_WEIGHTS: Record<RebarDiameter, number> = {
    'D10': 0.560,
    'D13': 0.995,
    'D16': 1.560,
    'D19': 2.250,
    'D22': 3.040,
    'D25': 3.980,
};

/**
 * 골조공사 물량 산출 클래스
 */
export class FrameworkCalc {
    /**
     * 입력된 제원을 바탕으로 자재 물량을 산출합니다.
     * // 1. 계획 -> 2. 검증 -> 3. 구현 단계로 진행
     */
    static calculate(input: CalculationInput): CalculationResult {
        const { length, width, height, rebarDiameter, totalRebarLength, projectName } = input;

        // --- 1. 콘크리트 산출 (할증 1%) ---
        const rawConcreteVol = length * width * height;
        const remicon_m3 = Number((rawConcreteVol * 1.01).toFixed(2));
        const waterstop_m = Number((length * 2).toFixed(2)); // 임의 산칭: 연장의 2배
        const curing_agent_m2 = Number((length * width).toFixed(2)); // 상부 면적 기준

        // --- 2. 철근 산출 (할증 3%) ---
        const unitWeight = REBAR_UNIT_WEIGHTS[rebarDiameter];
        const rebar_ton = Number(((totalRebarLength * unitWeight / 1000) * 1.03).toFixed(3));
        const tie_wire_kg = Number((rebar_ton * 4).toFixed(2)); // 톤당 4kg 기준
        const spacers_ea = Math.ceil(rawConcreteVol * 20); // m3당 20개 기준

        // --- 3. 거푸집 산출 (할증 5%) ---
        // 접촉면적: 측면 4면 기준 (2 * (L+W) * H)
        const rawFormArea = 2 * (length + width) * height;
        const form_area_m2 = Number((rawFormArea * 1.05).toFixed(2));
        const form_oil_liter = Number((form_area_m2 * 0.1).toFixed(2)); // m2당 0.1L 기준
        const flat_tie_ea = Math.ceil(form_area_m2 * 3); // m2당 3개 기준

        return {
            concrete: { remicon_m3, waterstop_m, curing_agent_m2 },
            rebar: { rebar_ton, tie_wire_kg, spacers_ea },
            formwork: { form_area_m2, form_oil_liter, flat_tie_ea },
            metadata: {
                timestamp: new Date().toISOString(),
                projectName
            }
        };
    }
}
