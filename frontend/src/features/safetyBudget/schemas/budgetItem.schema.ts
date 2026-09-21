import { z } from 'zod';
import { BudgetItemCodeSchema } from './shared.schema';

/** 배정 소속: 현장 | 본사 | 협력사 */
export const BudgetOwnerSchema = z.enum(['SITE', 'HEADQUARTERS', 'SUBCONTRACTOR']);
export type BudgetOwner = z.infer<typeof BudgetOwnerSchema>;

export const BudgetItemSchema = z
    .object({
        id: z.string().min(1),
        projectId: z.string().min(1),
        itemCode: BudgetItemCodeSchema,
        allocatedAmount: z.number().nonnegative(),
        owner: BudgetOwnerSchema,
        subcontractorId: z.string().min(1).optional(),
    })
    .refine((item) => item.owner !== 'SUBCONTRACTOR' || !!item.subcontractorId, {
        message: '협력사 배정 항목은 subcontractorId가 필요합니다.',
        path: ['subcontractorId'],
    });

export type BudgetItem = z.infer<typeof BudgetItemSchema>;
