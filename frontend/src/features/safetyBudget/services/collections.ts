/** 산안비 모듈이 사용하는 Firestore 컬렉션 이름. 기존 컬렉션과 충돌하지 않도록 접두어를 둔다. */
export const COLLECTIONS = {
    PROJECTS: 'safetyBudget_projects',
    WORK_PACKAGES: 'safetyBudget_workPackages',
    BUDGET_ITEMS: 'safetyBudget_budgetItems',
    EXPENSES: 'safetyBudget_expenses',
    SUBCONTRACTORS: 'safetyBudget_subcontractors',
    SAFETY_PLUS_EXPENSES: 'safetyBudget_safetyPlusExpenses',
    CALCULATION_BASIS: 'safetyBudget_calculationBasis',
} as const;
