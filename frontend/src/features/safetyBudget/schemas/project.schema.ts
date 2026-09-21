import { z } from 'zod';

/** 계약유형: 도급 | 자기공사 */
export const ContractTypeSchema = z.enum(['CONTRACT', 'SELF_BUILD']);
export type ContractType = z.infer<typeof ContractTypeSchema>;

/** 정산 규칙 유형: 공공 반환·감액형 | 민간 계약형 */
export const SettlementRuleTypeSchema = z.enum(['PUBLIC_REFUND', 'PRIVATE_CONTRACT']);
export type SettlementRuleType = z.infer<typeof SettlementRuleTypeSchema>;

export const ProjectSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    totalContractAmount: z.number().nonnegative(),
    contractType: ContractTypeSchema,
    allocatedSafetyBudget: z.number().nonnegative(),
    settlementRuleType: SettlementRuleTypeSchema,
});

export type Project = z.infer<typeof ProjectSchema>;
