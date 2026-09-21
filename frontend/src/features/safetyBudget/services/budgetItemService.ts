import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase-modular';
import { COLLECTIONS } from './collections';
import { BudgetItemSchema } from '../schemas/budgetItem.schema';
import type { BudgetItem } from '../schemas/budgetItem.schema';

/**
 * 프로젝트에 속한 비목 배정(BudgetItem) 목록을 조회한다.
 * @param projectId 프로젝트 id
 */
export async function listBudgetItems(projectId: string): Promise<BudgetItem[]> {
    const q = query(collection(db, COLLECTIONS.BUDGET_ITEMS), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => BudgetItemSchema.parse({ id: docSnap.id, ...docSnap.data() }));
}
