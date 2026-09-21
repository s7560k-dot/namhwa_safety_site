import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject } from '../services/projectService';
import { listWorkPackages } from '../services/workPackageService';
import { listBudgetItems } from '../services/budgetItemService';
import { listSubcontractors } from '../services/subcontractorService';
import { listExpenses, addExpense } from '../services/expenseService';
import { listSafetyPlusExpenses, addSafetyPlusExpense } from '../services/safetyPlusExpenseService';
import type { ExpenseInput } from '../schemas/expense.schema';
import type { SafetyPlusExpenseInput } from '../schemas/safetyPlusExpense.schema';

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

export function useAddSafetyPlusExpense(projectId: string, createdBy: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: SafetyPlusExpenseInput) => addSafetyPlusExpense(input, createdBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.safetyPlusExpenses(projectId) });
        },
    });
}
