import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase-modular';

const COLLECTION_NAME = 'layer_mappings';

export interface LayerMappingData {
    standardItemId: string;
    params?: Record<string, number>;
    customName?: string;
    customUnit?: string;
    updatedAt?: string;
}

/**
 * CAD 레이어 이름을 받아 이전에 매핑된 표준 아이템 데이터를 반환합니다.
 */
export const getMapping = async (layerName: string): Promise<LayerMappingData | null> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, layerName);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as LayerMappingData;
        }
        return null;
    } catch (error) {
        console.error("Error retrieving layer mapping:", error);
        return null;
    }
};

/**
 * CAD 레이어 이름과 매핑 관련 전체 정보(매핑 ID, 파라미터 등)를 파이어베이스에 저장합니다.
 */
export const saveMapping = async (layerName: string, mappingData: Partial<LayerMappingData>): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, layerName);
        await setDoc(docRef, {
            ...mappingData,
            updatedAt: new Date().toISOString()
        }, { merge: true }); // 기존 매핑 정보는 살린 채로 병합
    } catch (error) {
        console.error("Error saving layer mapping:", error);
    }
};
