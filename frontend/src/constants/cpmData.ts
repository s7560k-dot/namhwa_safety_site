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

export const CPM_CONFIG: NetworkProjectConfig = {
    projectName: "대광새마을금고 골프연습장 신축공사",
    startDate: "2025-12-12",
    totalDays: 300,
    totalContractAmount: 6630033084
};

export const CPM_TASKS: NetworkTask[] = [
    { id: 'A', name: "가설 및 토공사", start: 0, duration: 40, cost: 341275348 },
    { id: 'B', name: "기초 및 파일공사", start: 30, duration: 40, cost: 52232520 },
    { id: 'C', name: "RC 구조물 공사", start: 60, duration: 70, cost: 764246127 },
    { id: 'D', name: "철골 구조물 공사", start: 80, duration: 60, cost: 376856180 },
    { id: 'E', name: "철탑 및 주요설비", start: 130, duration: 80, cost: 889267231 },
    { id: 'F', name: "그물망 및 시스템", start: 200, duration: 50, cost: 370279992 },
    { id: 'G', name: "내외장 및 MEP", start: 160, duration: 100, cost: 2595879480 },
    { id: 'H', name: "부대토목 및 조경", start: 250, duration: 50, cost: 1239996206 }
];
