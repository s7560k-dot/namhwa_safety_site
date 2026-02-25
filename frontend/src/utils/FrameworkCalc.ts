import { RebarDiameter, CalculationInput, CalculationResult } from '../types/material';

export interface ParamRequirement {
    id: string;
    name: string;
    unit: string;
    defaultValue: number;
}

export interface StandardItem {
    id: string;               // 품셈 코드 (예: "2-1-1")
    group?: string;           // 공종 그룹 (예: "관로공사 (S-PIPE)")
    name: string;             // 표준 공종 이름 (예: "인력터파기 및 되메우기")
    basisText: string;        // 출력용 근거 텍스트
    requirements: ParamRequirement[];
    outputUnit?: string;      // 최종 결과 단위
}

export const STANDARD_ITEMS: StandardItem[] = [
    // --- 토공사 ---
    {
        id: "2-1-1",
        group: "토공사 (EARTHWORK)",
        name: "일반 흙 굴착 (인력)",
        basisText: "토목공사 표준품셈 [2-1-1]",
        requirements: [
            { id: "width", name: "작업폭", unit: "m", defaultValue: 0.8 },
            { id: "depth", name: "굴착깊이", unit: "m", defaultValue: 1.2 },
        ],
        outputUnit: "m3"
    },
    {
        id: "2-1-2",
        group: "토공사 (EARTHWORK)",
        name: "노상 굴착 및 법면 (기계)",
        basisText: "토목공사 표준품셈 [2-1-2]",
        requirements: [
            { id: "width", name: "작업폭", unit: "m", defaultValue: 0.8 },
            { id: "depth", name: "굴착깊이", unit: "m", defaultValue: 1.2 },
            { id: "slope", name: "법면폭", unit: "m", defaultValue: 0.3 },
        ],
        outputUnit: "m3"
    },
    // --- 관로공사 (S-PIPE) ---
    {
        id: "3-1-1",
        group: "관로공사 (S-PIPE)",
        name: "관 부설",
        basisText: "토목공사 표준품셈 [3-1-1]",
        requirements: [
            { id: "unit_len", name: "본당길이", unit: "m", defaultValue: 2.5 },
        ],
        outputUnit: "본"
    },
    {
        id: "3-1-2",
        group: "관로공사 (S-PIPE)",
        name: "관 접합",
        basisText: "토목공사 표준품셈 [3-1-2]",
        requirements: [
            { id: "unit_len", name: "본당길이", unit: "m", defaultValue: 2.5 },
        ],
        outputUnit: "개소"
    },
    // --- 포장공사 (S-PAVE) ---
    {
        id: "s-pave-1",
        group: "포장공사 (S-PAVE)",
        name: "아스콘 표층 포장",
        basisText: "전문시방서 / 표준품셈 [포장]",
        requirements: [
            { id: "width", name: "포장폭", unit: "m", defaultValue: 3.0 },
            { id: "thickness", name: "포장두께", unit: "m", defaultValue: 0.05 },
        ],
        outputUnit: "m3"
    },
    {
        id: "s-conc-1",
        group: "골조공사 (S-CONC)",
        name: "콘크리트 측구 (L형/U형)",
        basisText: "토목공사 표준품셈 [4-2-1]",
        requirements: [
            { id: "width", name: "구조물폭", unit: "m", defaultValue: 1.0 },
            { id: "height", name: "구조물높이", unit: "m", defaultValue: 1.0 },
        ],
        outputUnit: "m3"
    },
    // --- 수동 입력 ---
    {
        id: "manual_input",
        group: "기타 (CUSTOM)",
        name: "[MANUAL] 직접 입력",
        basisText: "사용자 커스텀 산출",
        requirements: [
            { id: "custom_val", name: "적용계수", unit: "", defaultValue: 1.0 }
        ],
        outputUnit: "식"
    }
];

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

    /**
     * 표준 아이템(품셈)과 도면 추출 수량, 그리고 사용자가 입력한 변수(params)를 받아
     * 최종 수식 문자열(derivation)과 결과값(finalQty)을 산출하여 반환합니다.
     */
    static generateDerivation(
        itemCode: string,
        params: Record<string, number>,
        baseQty: number,
        baseUnit: string
    ): { derivation: string, finalQty: number } {
        const standardItem = STANDARD_ITEMS.find(item => item.id === itemCode);

        let derivation = "";
        let finalQty = baseQty;
        const outUnit = standardItem?.outputUnit || baseUnit;

        const formatNum = (num: number) => num.toLocaleString(undefined, { maximumFractionDigits: 3 });

        if (!standardItem || standardItem.requirements.length === 0) {
            return { derivation: `도면수량 ${formatNum(baseQty)}${baseUnit}`, finalQty: baseQty };
        }

        if (standardItem.group?.includes("토공사")) {
            const w = params.width || 0;
            const d = params.depth || 1;
            const s = params.slope || 0;

            if (s > 0) {
                finalQty = (w + s) * d * baseQty;
                derivation = `(폭 ${w}m + 법면 ${s}m) * 깊이 ${d}m * 연장 ${formatNum(baseQty)}m`;
            } else {
                finalQty = w * d * baseQty;
                derivation = `폭 ${w}m * 깊이 ${d}m * 연장 ${formatNum(baseQty)}m`;
            }
        }
        else if (standardItem.group?.includes("관로공사")) {
            const u = params.unit_len || 1;
            finalQty = baseQty / u;
            derivation = `연장 ${formatNum(baseQty)}m / 본당길이 ${u}m`;
        }
        else if (standardItem.group?.includes("포장공사")) {
            const w = params.width || 1;
            const t = params.thickness || 1;
            finalQty = w * t * baseQty;
            derivation = `폭 ${w}m * 두께 ${t}m * 연장 ${formatNum(baseQty)}m`;
        }
        else if (standardItem.group?.includes("골조공사")) {
            const w = params.width || 1;
            const h = params.height || 1;
            finalQty = w * h * baseQty;
            derivation = `폭 ${w}m * 높이 ${h}m * 연장 ${formatNum(baseQty)}m`;
        }
        else if (itemCode === "manual_input") {
            const cv = params.custom_val || 1;
            finalQty = baseQty * cv;
            derivation = `도면수량 ${formatNum(baseQty)}${baseUnit} * 적용계수 ${cv}`;
        }
        else {
            const paramsStr = standardItem.requirements.map(req => `${req.name} ${params[req.id] || 0}${req.unit}`).join(" * ");
            finalQty = standardItem.requirements.reduce((acc, req) => acc * (params[req.id] || 1), baseQty);
            derivation = `${paramsStr} * 도면수량 ${formatNum(baseQty)}${baseUnit}`;
        }

        return {
            derivation,
            finalQty: Number(finalQty.toFixed(3))
        };
    }
}
