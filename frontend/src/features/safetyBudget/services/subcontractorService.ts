import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase-modular';
import { COLLECTIONS } from './collections';
import { SubcontractorSchema } from '../schemas/subcontractor.schema';
import type { Subcontractor } from '../schemas/subcontractor.schema';

/**
 * 프로젝트에 속한 협력사 목록을 조회한다.
 * @param projectId 프로젝트 id
 */
export async function listSubcontractors(projectId: string): Promise<Subcontractor[]> {
    const q = query(collection(db, COLLECTIONS.SUBCONTRACTORS), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => SubcontractorSchema.parse({ id: docSnap.id, ...docSnap.data() }));
}
