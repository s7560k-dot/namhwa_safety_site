import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    orderBy
} from 'firebase/firestore';
import { db } from '../firebase-modular';
import { CalculationInput, CalculationResult, StoredCalculation } from '../types/material';

const COLLECTION_NAME = 'material_calculations';

/**
 * 골조공사 물량 산출 관련 Firebase 서비스
 */
export const materialService = {
    /**
     * 산출 결과를 Firestore에 저장합니다.
     */
    saveCalculation: async (input: CalculationInput, result: CalculationResult): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...result,
                input,
                createdAt: serverTimestamp(),
            });
            console.log("Document written with ID: ", docRef.id);
            return docRef.id;
        } catch (e) {
            console.error("Error adding document: ", e);
            throw e;
        }
    },

    /**
     * 모든 산출 이력을 가져옵니다.
     */
    getCalculations: async (): Promise<StoredCalculation[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as StoredCalculation[];
        } catch (e) {
            console.error("Error getting documents: ", e);
            throw e;
        }
    },

    /**
     * 특정 산출 이력을 삭제합니다.
     */
    deleteCalculation: async (id: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
            console.log("Document deleted: ", id);
        } catch (e) {
            console.error("Error deleting document: ", e);
            throw e;
        }
    }
};
