import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
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

export interface WorkPackageUpsertInput {
    name: string;
    riskWeight: number;
}

/**
 * 내역서 기반 자동 산정 결과(F13)로 공종별 위험가중치를 반영한다. 미리보기 화면에서 사용자가 "확정"을 눌렀을 때만 호출된다.
 * 이번 확정에 포함된 이름 집합을 "현재 유효한 공종 전체"로 간주하는 authoritative 갱신이다:
 * - 같은 이름의 기존 WorkPackage는 riskWeight만 갱신한다 (currentProgressPct 등 다른 필드는 보존).
 * - 없으면 새로 생성한다 (currentProgressPct 0으로 시작).
 * - 이번 items 목록에 없는 기존 WorkPackage는 삭제한다. 그렇지 않으면 이전 확정 때 포함됐다가 이후
 *   위험가중치 산정 로직이 바뀌어(예: 제외 대상 추가) 더 이상 배분 대상이 아니게 된 공종이 Firestore에
 *   그대로 남아 riskWeight 합이 1을 넘게 되는 문제가 생긴다.
 * 하나의 배치로 처리해 일부만 반영되는 상황을 피한다.
 * @param projectId 프로젝트 id
 * @param items 세부공종별 산정된 위험가중치 (합이 1이어야 함은 호출 전 domain 계층에서 보장)
 */
export async function upsertWorkPackages(projectId: string, items: readonly WorkPackageUpsertInput[]): Promise<void> {
    const existing = await listWorkPackages(projectId);
    const existingByName = new Map(existing.map((wp) => [wp.name, wp]));
    const incomingNames = new Set(items.map((item) => item.name));

    const batch = writeBatch(db);
    for (const item of items) {
        const found = existingByName.get(item.name);
        if (found) {
            batch.update(doc(db, COLLECTIONS.WORK_PACKAGES, found.id), { riskWeight: item.riskWeight });
        } else {
            const newRef = doc(collection(db, COLLECTIONS.WORK_PACKAGES));
            const newWorkPackage = WorkPackageSchema.omit({ id: true }).parse({
                projectId,
                name: item.name,
                riskWeight: item.riskWeight,
                plannedProgressCurve: [],
                currentProgressPct: 0,
            });
            batch.set(newRef, newWorkPackage);
        }
    }
    for (const wp of existing) {
        if (!incomingNames.has(wp.name)) {
            batch.delete(doc(db, COLLECTIONS.WORK_PACKAGES, wp.id));
        }
    }
    await batch.commit();
}
