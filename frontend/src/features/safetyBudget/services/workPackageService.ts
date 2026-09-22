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
    /** 내역서상 원본 세부공종 코드(예: "01010105"). 같은 이름이 여러 번 등장할 수 있어 매칭 키로 name 대신 이걸 쓴다. */
    sourceCode: string;
    name: string;
    riskWeight: number;
}

/**
 * 내역서 기반 자동 산정 결과(F13)로 공종별 위험가중치를 반영한다. 미리보기 화면에서 사용자가 "확정"을 눌렀을 때만 호출된다.
 * 이번 확정에 포함된 sourceCode 집합을 "현재 유효한 공종 전체"로 간주하는 authoritative 갱신이다.
 *
 * 매칭 키로 name이 아닌 sourceCode를 쓰는 이유: 내역서에는 같은 이름의 세부공종이 서로 다른 구간에
 * 반복 등장할 수 있다(예: "철근콘크리트공사"가 골프연습장 구간과 철탑기초공사 구간에 각각 별도 항목으로 존재).
 * name으로 매칭하면 이런 동명 항목들이 하나의 문서로 뒤섞여 덮어써지고 나머지는 고아 문서로 남아
 * riskWeight 합이 깨진다 — 실제로 이 문제가 발생해 sourceCode 기반으로 고쳤다.
 *
 * - 같은 sourceCode의 기존 WorkPackage는 name/riskWeight를 갱신한다 (currentProgressPct 등은 보존).
 * - 없으면 새로 생성한다 (currentProgressPct 0으로 시작).
 * - 이번 items 목록에 없는 sourceCode를 가진 기존 WorkPackage는 삭제한다.
 * - sourceCode가 없는 기존 WorkPackage(name 기반 매칭을 쓰던 예전 버전이 만든 문서)는 전부 삭제한다 —
 *   더 이상 신뢰할 수 있는 매칭 키가 없는 오염된 데이터이기 때문.
 * 하나의 배치로 처리해 일부만 반영되는 상황을 피한다.
 * @param projectId 프로젝트 id
 * @param items 세부공종별 산정된 위험가중치 (합이 1이어야 함은 호출 전 domain 계층에서 보장)
 */
export async function upsertWorkPackages(projectId: string, items: readonly WorkPackageUpsertInput[]): Promise<void> {
    const existing = await listWorkPackages(projectId);
    const existingByCode = new Map(existing.filter((wp) => wp.sourceCode).map((wp) => [wp.sourceCode as string, wp]));
    const incomingCodes = new Set(items.map((item) => item.sourceCode));

    const batch = writeBatch(db);
    for (const item of items) {
        const found = existingByCode.get(item.sourceCode);
        if (found) {
            batch.update(doc(db, COLLECTIONS.WORK_PACKAGES, found.id), { name: item.name, riskWeight: item.riskWeight });
        } else {
            const newRef = doc(collection(db, COLLECTIONS.WORK_PACKAGES));
            const newWorkPackage = WorkPackageSchema.omit({ id: true }).parse({
                projectId,
                name: item.name,
                sourceCode: item.sourceCode,
                riskWeight: item.riskWeight,
                plannedProgressCurve: [],
                currentProgressPct: 0,
            });
            batch.set(newRef, newWorkPackage);
        }
    }
    for (const wp of existing) {
        if (!wp.sourceCode || !incomingCodes.has(wp.sourceCode)) {
            batch.delete(doc(db, COLLECTIONS.WORK_PACKAGES, wp.id));
        }
    }
    await batch.commit();
}
