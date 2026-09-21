import { z } from 'zod';
import { BudgetItemCodeSchema } from './shared.schema';

export const EligibilityStatusSchema = z.enum(['APPROVED', 'REJECTED']);

export const EligibilityResultSchema = z.object({
    status: EligibilityStatusSchema,
    reason: z.string().min(1),
});
export type EligibilityResult = z.infer<typeof EligibilityResultSchema>;

export const ExpenseSchema = z.object({
    id: z.string().min(1),
    projectId: z.string().min(1),
    date: z.string().datetime().or(z.string().date()),
    amount: z.number().positive(),
    itemCode: BudgetItemCodeSchema,
    subcontractorId: z.string().min(1).optional(),
    evidenceUrl: z.string().url().optional(),
    eligibility: EligibilityResultSchema,
    ptwId: z.string().min(1).optional(),
    tbmId: z.string().min(1).optional(),
    /** 정정 기록: 기존 지출을 수정하는 대신 이 필드로 원본 id를 참조하는 새 문서를 추가한다 (감사 추적). */
    correctionOfExpenseId: z.string().min(1).optional(),
    /** 기성 처리를 위한 증빙 확인 완료 여부. 관리자만 변경 가능 (F4). 미설정 시 false로 간주. */
    evidenceConfirmed: z.boolean().optional().default(false),
    createdAt: z.string().datetime().optional(),
    createdBy: z.string().min(1).optional(),
});

export type Expense = z.infer<typeof ExpenseSchema>;

/** Firestore 등록 전, 클라이언트에서 아직 id/createdAt 등이 없는 입력 형태. */
export const ExpenseInputSchema = ExpenseSchema.omit({
    id: true,
    eligibility: true,
    createdAt: true,
    evidenceConfirmed: true,
});
export type ExpenseInput = z.infer<typeof ExpenseInputSchema>;
