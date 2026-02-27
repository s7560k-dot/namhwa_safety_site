import { WbsNode, BoQItem, ScheduleItem, ProjectProfile } from '../types/wbs';

/**
 * WBS 자동 생성 코어 엔진 (Auto-WBS Generator)
 * NotebookLM 기획안에 기반한 4단계 자동화 로직 구현
 */
export class WbsAutoGenerator {

    // 1단계: 프로젝트 프로파일링 및 과거 템플릿 반환 매칭 로직
    public static extractPattern(profile: ProjectProfile): WbsNode[] {
        console.log("Phase 1: 프로파일링 기반 템플릿 매칭", profile);
        // TODO: 실제 사내 DB 연동 시나리오 (현재는 Mock 데이터로 구성)
        // 용도에 따른 기본 WBS 뼈대 생성
        const baseWbs: WbsNode[] = [
            { id: 'wbs_root', parentId: null, name: '프로젝트 전체', pnsCode: '', level: 1, children: [] },
            { id: 'wbs_100', parentId: 'wbs_root', name: '가설 및 토공사', pnsCode: '', level: 2, children: [] },
            { id: 'wbs_200', parentId: 'wbs_root', name: '골조공사', pnsCode: '', level: 2, children: [] },
            { id: 'wbs_300', parentId: 'wbs_root', name: '마감공사', pnsCode: '', level: 2, children: [] },
        ];
        return baseWbs;
    }

    // 2단계: 3D 패싯 매트릭스 결합 로직
    // 내역서(BoQ)의 분류(공간, 부위, 공종)를 조합하여 하위 WBS 노드를 동적으로 생성
    public static generateFacetMatrix(baseWbs: WbsNode[], boqItems: BoQItem[]): WbsNode[] {
        console.log("Phase 2: 패싯 매트릭스 결합 (하위 노드 확장)");
        const root = baseWbs.find(n => n.parentId === null);
        if (!root) return baseWbs;

        // 임시 로직: BoQ 아이템의 속성을 조합해 최하위 노드 생성
        let tempIdCounter = 1;
        boqItems.forEach(item => {
            if (item.facetElement && item.facetWorkType) {
                // 부위 + 공종 조합 명칭
                const nodeName = `${item.facetSpace || '공통'} - ${item.facetElement} - ${item.facetWorkType}`;

                const newNode: WbsNode = {
                    id: `wbs_leaf_${tempIdCounter++}`,
                    parentId: 'wbs_200', // 임시로 골조공사 등의 부모에 매핑 (향후 개선)
                    name: nodeName,
                    pnsCode: '',
                    level: 3,
                    assignedCost: item.totalCost
                };
                baseWbs.push(newNode);
            }
        });

        return baseWbs;
    }

    // 3단계: 식별 번호(PNS) 자동 채번 로직
    // 규칙: 숫자 우선, 공통/일반은 '0', 기타는 'Z', [E, I, O] 제외
    public static generateSmartNumbering(nodes: WbsNode[]): WbsNode[] {
        console.log("Phase 3: 식별 번호 정규식 및 패턴 기반 자동 채번");

        // 간단한 Mock 채번 알고리즘
        const baseProjectCode = "PRJ26";

        return nodes.map((node, index) => {
            let pns = `${baseProjectCode}-`;

            if (node.name.includes("공통") || node.name.includes("일반")) {
                pns += "00-0";
            } else if (node.name.includes("기타") || node.name.includes("미분류")) {
                pns += "ZZ-Z";
            } else {
                // 계층과 인덱스를 기반으로 번호 생성 (E, I, O 알파벳 제외 규칙이 필요할 경우 여기에 정규식 필터 적용)
                const seq = (index + 1).toString().padStart(3, '0');
                pns += `A${node.level}-${seq}`;
            }

            return {
                ...node,
                pnsCode: pns
            };
        });
    }

    // 4단계: 공정-내역 1:1 자동 롤업 (Integration) 로직
    // 공정표와 WBS 코드를 매핑하여 일정/비용 데이터를 통합
    public static integrateScheduleAndCost(wbsNodes: WbsNode[], schedules: ScheduleItem[]): WbsNode[] {
        console.log("Phase 4: EVMS 기준선 생성을 위한 공정-내역 1:1 매핑");
        // Mock 로직: 스케줄 배열의 데이터와 WBS 노드를 순차 매핑
        return wbsNodes.map((node, idx) => {
            const matchedSchedule = schedules[idx % schedules.length]; // 단순히 모의 데이터 할당 (실제론 이름/공종/코드 매핑 기반)
            if (matchedSchedule && node.level > 1) {
                return {
                    ...node,
                    startDate: matchedSchedule.startDate,
                    endDate: matchedSchedule.endDate,
                    durationDays: matchedSchedule.durationDays,
                };
            }
            return node;
        });
    }

    // 전체 파이프라인(1~4단계) 모음 실행
    public static runFullPipeline(profile: ProjectProfile, boq: BoQItem[], schedule: ScheduleItem[]): WbsNode[] {
        let wbs = this.extractPattern(profile);
        wbs = this.generateFacetMatrix(wbs, boq);
        wbs = this.generateSmartNumbering(wbs);
        wbs = this.integrateScheduleAndCost(wbs, schedule);
        return wbs;
    }
}
