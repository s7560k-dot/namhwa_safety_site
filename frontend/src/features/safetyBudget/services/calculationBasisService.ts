import { addDoc, collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../../firebase-modular';
import { COLLECTIONS } from './collections';
import { CalculationBasisSchema } from '../schemas/calculationBasis.schema';
import type { CalculationBasis } from '../schemas/calculationBasis.schema';

/**
 * 산안비 계상금액 자동계산 근거를 저장한다. 덮어쓰지 않고 이력으로 쌓는다.
 */
export async function saveCalculationBasis(input: Omit<CalculationBasis, 'id'>): Promise<string> {
    const toSave = CalculationBasisSchema.omit({ id: true }).parse(input);
    const docRef = await addDoc(collection(db, COLLECTIONS.CALCULATION_BASIS), toSave);
    return docRef.id;
}

/**
 * 프로젝트의 계산 근거 이력을 최신순으로 조회한다.
 */
export async function listCalculationBasis(projectId: string): Promise<CalculationBasis[]> {
    const q = query(
        collection(db, COLLECTIONS.CALCULATION_BASIS),
        where('projectId', '==', projectId),
        orderBy('calculatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => CalculationBasisSchema.parse({ id: docSnap.id, ...docSnap.data() }));
}
