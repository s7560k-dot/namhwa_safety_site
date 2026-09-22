import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject, updateAllocatedSafetyBudget } from '../services/projectService';
import { listWorkPackages, upsertWorkPackages } from '../services/workPackageService';
import type { WorkPackageUpsertInput } from '../services/workPackageService';
import { listBudgetItems } from '../services/budgetItemService';
import { listSubcontractors } from '../services/subcontractorService';
import { listExpenses, addExpense, setExpenseEvidenceConfirmed } from '../services/expenseService';
import type { AddExpenseResult } from '../services/expenseService';
import { listSafetyPlusExpenses, addSafetyPlusExpense } from '../services/safetyPlusExpenseService';
import { saveCalculationBasis } from '../services/calculationBasisService';
import type { ExpenseInput } from '../schemas/expense.schema';
import type { SafetyPlusExpenseInput } from '../schemas/safetyPlusExpense.schema';
import type { CalculationBasis } from '../schemas/calculationBasis.schema';

const queryKeys = {
    project: (projectId: string) => ['safetyBudget', 'project', projectId] as const,
    workPackages: (projectId: string) => ['safetyBudget', 'workPackages', projectId] as const,
    budgetItems: (projectId: string) => ['safetyBudget', 'budgetItems', projectId] as const,
    subcontractors: (projectId: string) => ['safetyBudget', 'subcontractors', projectId] as const,
    expenses: (projectId: string) => ['safetyBudget', 'expenses', projectId] as const,
    safetyPlusExpenses: (projectId: string) => ['safetyBudget', 'safetyPlusExpenses', projectId] as const,
};

export function useProject(projectId: string) {
    return useQuery({ queryKey: queryKeys.project(projectId), queryFn: () => getProject(projectId) });
}

export function useWorkPackages(projectId: string) {
    return useQuery({ queryKey: queryKeys.workPackages(projectId), queryFn: () => listWorkPackages(projectId) });
}

export function useBudgetItems(projectId: string) {
    return useQuery({ queryKey: queryKeys.budgetItems(projectId), queryFn: () => listBudgetItems(projectId) });
}

export function useSubcontractors(projectId: string) {
    return useQuery({ queryKey: queryKeys.subcontractors(projectId), queryFn: () => listSubcontractors(projectId) });
}

export function useExpenses(projectId: string) {
    return useQuery({ queryKey: queryKeys.expenses(projectId), queryFn: () => listExpenses(projectId) });
}

export function useSafetyPlusExpenses(projectId: string) {
    return useQuery({
        queryKey: queryKeys.safetyPlusExpenses(projectId),
        queryFn: () => listSafetyPlusExpenses(projectId),
    });
}

/** 집행 등록 뮤테이션. 성공/거부 여부와 무관하게 결과를 그대로 반환하고, 승인된 경우에만 목록을 갱신한다. */
export function useAddExpense(projectId: string, createdBy: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: ExpenseInput) => addExpense(input, createdBy),
        onSuccess: (result) => {
            if (result.status === 'APPROVED') {
                queryClient.invalidateQueries({ queryKey: queryKeys.expenses(projectId) });
            }
        },
    });
}

/** 기성 처리를 위한 증빙 확인 플래그 변경 뮤테이션 (F4, 관리자 전용). */
export function useSetExpenseEvidenceConfirmed(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ expenseId, confirmed }: { expenseId: string; confirmed: boolean }) =>
            setExpenseEvidenceConfirmed(expenseId, confirmed),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.expenses(projectId) });
        },
    });
}

export interface ConfirmCostBreakdownImportInput {
    allocatedSafetyBudget: number;
    workPackages: readonly WorkPackageUpsertInput[];
    calculationBasis: Omit<CalculationBasis, 'id'>;
}

/**
 * 내역서 가져오기 미리보기 화면의 "확정" 액션. 계상금액·공종별 위험가중치·계산 근거를 함께 반영한다.
 */
export function useConfirmCostBreakdownImport(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: ConfirmCostBreakdownImportInput) => {
            await updateAllocatedSafetyBudget(projectId, input.allocatedSafetyBudget);
            await upsertWorkPackages(projectId, input.workPackages);
            await saveCalculationBasis(input.calculationBasis);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.workPackages(projectId) });
        },
    });
}

/**
 * 사용내역서 PDF 가져오기 미리보기의 "일괄 등록" 액션.
 * 본사 사용분 누적 한도 검사가 이전 행의 등록 결과를 반영해야 정확하므로 반드시 순차(for...of)로 처리한다
 * (Promise.all 등으로 병렬 처리하면 안 됨).
 */
export function useAddExpensesBulk(projectId: string, createdBy: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (inputs: readonly ExpenseInput[]) => {
            const results: AddExpenseResult[] = [];
            for (const input of inputs) {
                results.push(await addExpense(input, createdBy));
            }
            return results;
        },
        onSuccess: (results) => {
            if (results.some((r) => r.status === 'APPROVED')) {
                queryClient.invalidateQueries({ queryKey: queryKeys.expenses(projectId) });
            }
        },
    });
}

export function useAddSafetyPlusExpense(projectId: string, createdBy: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: SafetyPlusExpenseInput) => addSafetyPlusExpense(input, createdBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.safetyPlusExpenses(projectId) });
        },
    });
}
