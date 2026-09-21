import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase-modular';
import { COLLECTIONS } from './collections';
import { WorkPackageSchema } from '../schemas/workPackage.schema';
import type { WorkPackage } from '../schemas/workPackage.schema';

/**
 * 프로젝트에 속한 공종(WorkPackage) 목록을 조회한다.
 * @param projectId 프로젝트 id
 */
export async function listWorkPackages(projectId: string): Promise<WorkPackage[]> {
    const q = query(collection(db, COLLECTIONS.WORK_PACKAGES), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => WorkPackageSchema.parse({ id: docSnap.id, ...docSnap.data() }));
}
