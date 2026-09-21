import { z } from 'zod';

/**
 * 산안비 인정 범위를 넘는 자체 안전투자.
 * 산안비 원장(Expense)과는 별도 컬렉션에 저장하며, 두 금액은 절대 합산하지 않는다.
 */
export const SafetyPlusExpenseSchema = z.object({
    id: z.string().min(1),
    projectId: z.string().min(1),
    date: z.string().datetime().or(z.string().date()),
    amount: z.number().positive(),
    description: z.string().min(1),
    evidenceUrl: z.string().url().optional(),
    createdAt: z.string().datetime().optional(),
    createdBy: z.string().min(1).optional(),
});

export type SafetyPlusExpense = z.infer<typeof SafetyPlusExpenseSchema>;

export const SafetyPlusExpenseInputSchema = SafetyPlusExpenseSchema.omit({
    id: true,
    createdAt: true,
});
export type SafetyPlusExpenseInput = z.infer<typeof SafetyPlusExpenseInputSchema>;
