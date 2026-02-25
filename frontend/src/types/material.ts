export type RebarDiameter = 'D10' | 'D13' | 'D16' | 'D19' | 'D22' | 'D25';

export interface CalculationInput {
    projectName: string;
    length: number; // L (m)
    width: number;  // W (m)
    height: number; // H (m)
    rebarDiameter: RebarDiameter;
    totalRebarLength: number; // 총 연장 (m)
}

export interface CalculationResult {
    concrete: {
        remicon_m3: number;
        waterstop_m: number;
        curing_agent_m2: number;
    };
    rebar: {
        rebar_ton: number;
        tie_wire_kg: number;
        spacers_ea: number;
    };
    formwork: {
        form_area_m2: number;
        form_oil_liter: number;
        flat_tie_ea: number;
    };
    metadata: {
        timestamp: string;
        projectName: string;
    };
}

export interface StoredCalculation extends CalculationResult {
    id?: string;
    input: CalculationInput;
    createdAt: any; // Firestore serverTimestamp
}
