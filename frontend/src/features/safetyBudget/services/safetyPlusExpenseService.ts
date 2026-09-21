import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase-modular';
import { COLLECTIONS } from './collections';
import { SafetyPlusExpenseSchema, SafetyPlusExpenseInputSchema } from '../schemas/safetyPlusExpense.schema';
import type { SafetyPlusExpense, SafetyPlusExpenseInput } from '../schemas/safetyPlusExpense.schema';

/**
 * 산안비 인정 범위를 넘는 자체 안전투자 목록을 조회한다. 산안비 원장과는 완전히 별도로 다룬다.
 * @param projectId 프로젝트 id
 */
export async function listSafetyPlusExpenses(projectId: string): Promise<SafetyPlusExpense[]> {
    const q = query(collection(db, COLLECTIONS.SAFETY_PLUS_EXPENSES), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((docSnap) => SafetyPlusExpenseSchema.parse({ id: docSnap.id, ...docSnap.data() }));
    return items.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * 안전 플러스 지출을 등록한다.
 * @param input 등록할 지출 정보 (id 제외)
 * @param createdBy 등록자 식별자
 */
export async function addSafetyPlusExpense(input: SafetyPlusExpenseInput, createdBy: string): Promise<string> {
    const validatedInput = SafetyPlusExpenseInputSchema.parse(input);
    const toSave = SafetyPlusExpenseSchema.omit({ id: true }).parse({
        ...validatedInput,
        createdAt: new Date().toISOString(),
        createdBy,
    });
    const docRef = await addDoc(collection(db, COLLECTIONS.SAFETY_PLUS_EXPENSES), toSave);
    return docRef.id;
}
