import { z } from 'zod';

/** 계획 공정률 곡선의 한 시점(period). period는 임의 단위(주차/월차)의 정수 인덱스. */
export const ProgressCurvePointSchema = z.object({
    period: z.number().int().nonnegative(),
    plannedProgressPct: z.number().min(0).max(100),
});
export type ProgressCurvePoint = z.infer<typeof ProgressCurvePointSchema>;

export const WorkPackageSchema = z.object({
    id: z.string().min(1),
    projectId: z.string().min(1),
    name: z.string().min(1),
    /**
     * 내역서 가져오기로 생성된 경우의 원본 세부공종 코드(예: "01010105"). 내역서에는 같은 이름의 공종이
     * 여러 구간에 반복 등장할 수 있어(예: "철근콘크리트공사"가 골프연습장/철탑기초공사에 각각 존재), name은
     * 고유 식별자가 될 수 없다 — upsertWorkPackages는 이 필드로 매칭한다. 수동 생성된 WorkPackage는 없을 수 있다.
     */
    sourceCode: z.string().min(1).optional(),
    /** 위험 가중치. 같은 프로젝트에 속한 공종들의 합이 1이어야 한다 (domain 계층에서 검증). */
    riskWeight: z.number().min(0).max(1),
    /** Phase 1/2 화면에서는 아직 사용하지 않는 계획값 — 없으면 빈 배열로 간주. */
    plannedProgressCurve: z.array(ProgressCurvePointSchema).optional().default([]),
    currentProgressPct: z.number().min(0).max(100),
});

export type WorkPackage = z.infer<typeof WorkPackageSchema>;
