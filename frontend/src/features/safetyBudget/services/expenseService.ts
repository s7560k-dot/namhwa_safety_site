import { addDoc, collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../firebase-modular';
import { COLLECTIONS } from './collections';
import { ExpenseSchema, ExpenseInputSchema } from '../schemas/expense.schema';
import type { Expense, ExpenseInput } from '../schemas/expense.schema';
import { checkEligibility, checkHeadquartersUsageCap } from '../domain/eligibility';
import { getProject } from './projectService';
import { HEADQUARTERS_USAGE_CAP_RATIO } from '../config/regulation.config';

/**
 * 프로젝트의 집행(Expense) 목록을 조회한다. 최신 일자 순으로 정렬해 반환한다.
 * @param projectId 프로젝트 id
 */
export async function listExpenses(projectId: string): Promise<Expense[]> {
    const q = query(collection(db, COLLECTIONS.EXPENSES), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    const expenses = snapshot.docs.map((docSnap) => ExpenseSchema.parse({ id: docSnap.id, ...docSnap.data() }));
    return expenses.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export type AddExpenseResult =
    | { status: 'APPROVED'; id: string }
    | { status: 'REJECTED'; reason: string };

/**
 * 집행을 등록한다. 등록 전 결제 적격성을 사전 심사하고, 불인정 항목이면 저장하지 않고 사유를 반환한다.
 * @param input 등록할 집행 정보 (id 제외)
 * @param createdBy 등록자 식별자 (uid 또는 email)
 */
export async function addExpense(input: ExpenseInput, createdBy: string): Promise<AddExpenseResult> {
    // 1. 계획: 저장 전 (a) 비목 적격성 심사, (b) 본사 사용분이면 상한 심사 → 둘 중 하나라도 불인정이면 저장하지 않는다.
    // 2. 검증: 각 분기는 domain/eligibility.test.ts에서 검증됨. 여기서는 Firestore 조회/저장만 담당.
    // 3. 구현:
    const validatedInput = ExpenseInputSchema.parse(input);
    const eligibility = checkEligibility(validatedInput.itemCode);

    if (eligibility.status === 'REJECTED') {
        return { status: 'REJECTED', reason: eligibility.reason };
    }

    if (validatedInput.itemCode === 'HEADQUARTERS_USAGE') {
        const [project, existingExpenses] = await Promise.all([
            getProject(validatedInput.projectId),
            listExpenses(validatedInput.projectId),
        ]);
        const existingHqUsage = existingExpenses
            .filter((e) => e.itemCode === 'HEADQUARTERS_USAGE')
            .reduce((sum, e) => sum + e.amount, 0);
        const capCheck = checkHeadquartersUsageCap(
            existingHqUsage + validatedInput.amount,
            project?.allocatedSafetyBudget ?? 0,
            HEADQUARTERS_USAGE_CAP_RATIO
        );
        if (!capCheck.allowed) {
            return { status: 'REJECTED', reason: capCheck.reason };
        }
    }

    const expenseToSave = ExpenseSchema.omit({ id: true }).parse({
        ...validatedInput,
        eligibility,
        createdAt: new Date().toISOString(),
        createdBy,
    });

    const docRef = await addDoc(collection(db, COLLECTIONS.EXPENSES), expenseToSave);
    return { status: 'APPROVED', id: docRef.id };
}

/**
 * 기성 처리를 위한 증빙 확인 상태를 변경한다 (F4). 관리자만 호출 가능 — Firestore Rules에서도 강제한다.
 * @param expenseId 집행 문서 id
 * @param confirmed 증빙 확인 완료 여부
 */
export async function setExpenseEvidenceConfirmed(expenseId: string, confirmed: boolean): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.EXPENSES, expenseId), { evidenceConfirmed: confirmed });
}
