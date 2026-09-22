import { z } from 'zod';
import { CONSTRUCTION_CATEGORIES } from '../config/regulation.config';

/**
 * 내역서 기반 산안비 계상금액 자동계산 근거 기록 (F13). 감사 준비도의 "근거 투명성" 원칙에 따라
 * 확정할 때마다 새 문서로 쌓아 이력을 유지한다 (덮어쓰지 않음).
 */
export const CalculationBasisSchema = z.object({
    id: z.string().min(1),
    projectId: z.string().min(1),
    sourceFileName: z.string().min(1),
    targetAmount: z.number().nonnegative(),
    constructionCategory: z.enum(CONSTRUCTION_CATEGORIES),
    majorWorkType: z.string().min(1),
    appliedRatePercent: z.number().nonnegative(),
    baseAmount: z.number().nonnegative(),
    calculatedAmount: z.number().nonnegative(),
    calculatedAt: z.string().min(1),
    calculatedBy: z.string().min(1),
});

export type CalculationBasis = z.infer<typeof CalculationBasisSchema>;
