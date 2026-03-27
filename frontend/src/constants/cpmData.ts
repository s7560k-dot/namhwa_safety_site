export interface NetworkTask {
    id: string;
    name: string;
    start: number;
    duration: number;
    cost: number;
}

export interface NetworkProjectConfig {
    startDate: string; // "YYYY-MM-DD"
    totalDays: number;
    totalContractAmount: number;
    projectName: string;
}

export const ALLOWED_SITE_IDS = ['siteA', 'siteC'];

export const CPM_CONFIGS: Record<string, NetworkProjectConfig> = {
    'siteA': {
        projectName: "대광새마을금고 골프연습장 신축공사",
        startDate: "2025-12-12",
        totalDays: 300,
        totalContractAmount: 6630033084
    },
    'siteC': {
        projectName: "평택 세탁소 현장 (Humphreys)",
        startDate: "2024-04-15",
        totalDays: 1128,
        totalContractAmount: 35351797800
    }
};

export const CPM_TASK_LISTS: Record<string, NetworkTask[]> = {
    'siteA': [
        { id: 'A', name: "가설 및 토공사", start: 0, duration: 40, cost: 341275348 },
        { id: 'B', name: "기초 및 파일공사", start: 30, duration: 40, cost: 52232520 },
        { id: 'C', name: "RC 구조물 공사", start: 60, duration: 70, cost: 764246127 },
        { id: 'D', name: "철골 구조물 공사", start: 80, duration: 60, cost: 376856180 },
        { id: 'E', name: "철탑 및 주요설비", start: 130, duration: 80, cost: 889267231 },
        { id: 'F', name: "그물망 및 시스템", start: 200, duration: 50, cost: 370279992 },
        { id: 'G', name: "내외장 및 MEP", start: 160, duration: 100, cost: 2595879480 },
        { id: 'H', name: "부대토목 및 조경", start: 250, duration: 50, cost: 1239996206 }
    ],
    'siteC': [
        { id: 'M1010', name: "착공 통보 (NTP)", start: 0, duration: 0, cost: 0 },
        { id: 'D1030', name: "품질관리계획서 제출", start: 0, duration: 30, cost: 0 },
        { id: 'D1035', name: "G/A - 품질관리계획 승인", start: 30, duration: 30, cost: 0 },
        { id: 'D1040', name: "안전보건관리계획서 제출", start: 0, duration: 25, cost: 0 },
        { id: 'D1045', name: "G/A - 안전보건관리계획 승인", start: 25, duration: 30, cost: 0 },
        { id: 'D1150', name: "환경관리계획서 제출", start: 0, duration: 48, cost: 0 },
        { id: 'D1160', name: "G/A - 환경관리계획 승인", start: 48, duration: 30, cost: 0 },
        { id: 'D1050', name: "폐기물처리계획서 제출", start: 0, duration: 41, cost: 0 },
        { id: 'D1055', name: "G/A - 폐기물처리계획 승인", start: 41, duration: 41, cost: 0 },
        { id: 'D1110', name: "예비 프로젝트 공정표 제출", start: 0, duration: 61, cost: 0 },
        { id: 'D1120', name: "G/A - 예비 공정표 승인", start: 61, duration: 61, cost: 0 },
        { id: 'D1130', name: "초기 프로젝트 공정표 제출", start: 0, duration: 34, cost: 0 },
        { id: 'D1140', name: "G/A - 초기 공정표 승인", start: 34, duration: 34, cost: 0 },
        { id: 'D1075', name: "교통통제계획서 제출", start: 0, duration: 41, cost: 0 },
        { id: 'D1076', name: "G/A - 교통통제계획 승인", start: 41, duration: 41, cost: 0 },
        { id: 'D1210', name: "사전공사회의(Pre-Con)", start: 0, duration: 60, cost: 0 },
        { id: 'D1230', name: "가설전력 공급계획 제출", start: 60, duration: 60, cost: 0 },
        { id: 'D1240', name: "G/A - 가설전력 계획 승인", start: 120, duration: 60, cost: 0 },
        { id: 'D1280', name: "현장사무실 설치계획 제출", start: 60, duration: 60, cost: 0 },
        { id: 'D1290', name: "G/A - 현장사무실 계획 승인", start: 120, duration: 60, cost: 0 },
        { id: 'D1010', name: "행정인허가(ENG 4288) 제출", start: 0, duration: 30, cost: 0 },
        { id: 'D1020', name: "G/A - 행정인허가 승인", start: 30, duration: 30, cost: 0 },
        { id: 'P1010', name: "로컬 자재 승인 요청서 제출", start: 60, duration: 30, cost: 0 },
        { id: 'P1020', name: "G/A - 로컬 자재 승인", start: 90, duration: 30, cost: 0 },
        { id: 'O1010', name: "해외 자재 승인 요청서 제출", start: 60, duration: 30, cost: 0 },
        { id: 'O1020', name: "G/A - 해외 자재 승인", start: 90, duration: 30, cost: 0 },
        { id: 'O1030', name: "해외 자재 조달(Procurement)", start: 120, duration: 180, cost: 13686985821 },
        { id: 'C1010', name: "가설 울타리 및 방진막 설치", start: 91, duration: 7, cost: 14800000 },
        { id: 'C1020', name: "지장물 철거 및 대지 정리", start: 98, duration: 15, cost: 95575979 },
        { id: 'C1120', name: "본공사 및 건축/설비 시공", start: 300, duration: 632, cost: 20700237000 },
        { id: 'S9040', name: "검사 및 준공 인수인계", start: 932, duration: 71, cost: 507963000 },
        { id: 'M1020', name: "최종 준공 및 운영 (CCD)", start: 1128, duration: 0, cost: 0 }
    ]
};
