// WBS 관련 타입 정의

// 내역서(BoQ) 항목
export interface BoQItem {
    id: string; // 항목 ID
    name: string; // 공종/품목 명칭
    unit: string; // 단위
    quantity: number; // 수량
    unitPrice: number; // 단가
    totalCost: number; // 총 금액 (재료비 + 노무비 + 경비 등)
    facetSpace?: string; // 공간 패싯 (예: 1층)
    facetElement?: string; // 부위 패싯 (예: 골조)
    facetWorkType?: string; // 공종 패싯 (예: 철근콘크리트)
}

// 공정표 항목
export interface ScheduleItem {
    id: string; // 액티비티 ID
    name: string; // 작업명
    startDate: string; // 시작일 (YYYY-MM-DD)
    endDate: string; // 종료일 (YYYY-MM-DD)
    durationDays: number; // 기간
    dependencies?: string[]; // 선행 작업 ID 배열
}

// 자동 생성되는 WBS 노드
export interface WbsNode {
    id: string; // 고유 ID
    parentId: string | null; // 상위 노드 ID (최상위는 null)
    name: string; // WBS 명칭
    pnsCode: string; // 부여된 식별번호 (PNS)
    level: number; // 계층 레벨

    // 매핑된 공정 및 원가 정보 (최하위 패키지인 경우)
    startDate?: string;
    endDate?: string;
    durationDays?: number;
    assignedCost?: number; // 할당된 원가

    children?: WbsNode[]; // 하위 노드
}

// 신규 프로젝트 프로파일 (템플릿 추출용)
export interface ProjectProfile {
    projectType: string; // 시설물 용도 (예: 아파트, 오피스, 도로)
    scale: string;       // 규모 (대형, 중형, 소형)
    contractType: string; // 계약 형태 (예: 총액계약, 단가계약)
}
