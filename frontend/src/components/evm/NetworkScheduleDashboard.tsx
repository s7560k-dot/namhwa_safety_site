import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Network, Activity, Layout, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import EvmDashboard from './EvmDashboard';
import EvmSCurveChart from './EvmSCurveChart';
import { CPM_CONFIGS, CPM_TASK_LISTS, ALLOWED_SITE_IDS, NetworkTask, NetworkProjectConfig } from '../../constants/cpmData';
import { WbsAutoGenerator } from '../../utils/wbsAutoGenerator';
import { ProjectProfile, BoQItem, ScheduleItem, WbsNode } from '../../types/wbs';
import WbsDataUploader from './WbsDataUploader';

interface NetworkScheduleDashboardProps {
    config?: NetworkProjectConfig;
    tasks?: NetworkTask[];
    projectId?: string; 
}

// Mermaid 차트 구성을 동적으로 생성
const getMermaidGraph = (siteId: string) => {
    if (siteId === 'siteC') {
        return `
graph LR
    classDef normal fill:#fff, stroke:#333, stroke-width:1px, rx:5, ry:5;
    classDef critical fill:#fff5f5, stroke:#e74c3c, stroke-width:3px, rx:5, ry:5;
    classDef milestone fill:#2c3e50, stroke:#333, stroke-width:2px, color:#fff, rx:20, ry:20;
    classDef sub fill:#f8f9fa, stroke:#dee2e6, stroke-dasharray: 5 5;

    Start([🚀 착공통보 NTP]):::milestone
    End([🏆 최종준공 CCD]):::milestone

    subgraph Admin ["📂 행정 및 일반계획"]
        D1030[D1030.품질관리계획]:::normal
        D1035[D1035.품질승인]:::normal
        D1040[D1040.안전보건계획]:::normal
        D1045[D1045.안전승인]:::normal
        D1150[D1150.환경관리계획]:::normal
        D1160[D1160.환경승인]:::normal
        D1110[D1110.예비공정표]:::normal
        D1120[D1120.예비공정승인]:::normal
        D1210[D1210.사전회의]:::normal
    end

    subgraph Submittals ["📑 자재승인 및 인허가"]
        D1010[D1010.인허가 ENG 4288]:::critical
        D1020[D1020.인허가 승인]:::critical
        P1010[P1010.로컬자재제출]:::normal
        O1010[O1010.해외자재제출]:::critical
        O1020[O1020.해외자재승인]:::critical
    end

    subgraph Procurement ["🚢 자재조달"]
        O1030[O1030.해외자재조달]:::critical
    end

    subgraph Construction ["🏗️ 현장 시공"]
        C1010[C1010.가설울타리]:::normal
        C1020[C1020.지장물철거]:::normal
        C1120[C1120.본공사시공]:::critical
        S9040[S9040.검사/준공]:::critical
    end

    %% Critical Path (Red Line)
    Start === D1010
    D1010 === D1020
    D1020 === O1010
    O1010 === O1020
    O1020 === O1030
    O1030 === C1120
    C1120 === S9040
    S9040 === End

    %% Parallel Paths
    Start -.-> D1030 -.-> D1035 -.-> C1120
    Start -.-> D1040 -.-> D1045 -.-> C1120
    Start -.-> D1150 -.-> D1160 -.-> C1120
    Start -.-> D1110 -.-> D1120 -.-> C1120
    Start -.-> D1210 -.-> C1010 -.-> C1020 -.-> C1120
    D1020 -.-> P1010 -.-> C1120
`;
    }

    // Default: siteA (대광)
    return `
graph LR
    classDef normal fill:#fff, stroke:#333, stroke-width:1px, rx:5, ry:5;
    classDef critical fill:#fff5f5, stroke:#e74c3c, stroke-width:3px, rx:5, ry:5;
    classDef milestone fill:#2c3e50, stroke:#333, stroke-width:2px, color:#fff, rx:20, ry:20;

    Start([🚀 착공]):::milestone
    End([🏆 준공]):::milestone

    A[A.가설 / 토공사 <br/> 40일]:::critical
    B[B.기초 / 파일 <br/> 40일]:::critical
    C[C.RC 골조 <br/> 70일]:::critical
    D[D.철골 골조 <br/> 60일]:::normal
    E[E.철탑 / 설비 <br/> 80일]:::critical
    F[F.망 / 시스템 <br/> 50일]:::normal
    G[G.내외장 / MEP <br/> 100일]:::critical
    H[H.부대토목 <br/> 50일]:::critical

    Start --> A
    A === B
    B === C
    C === E
    E === G
    G === H
    H === End

    B -.- D
    D -.- E
    E -.- F
    F -.- H
`;
};

// 유틸리티 포맷 함수
const formatMoney = (amount: number) => {
    if (amount === 0) return "-";
    return Math.floor(amount).toLocaleString('ko-KR');
};

const formatMoneyShort = (amount: number) => {
    return (amount / 100000000).toFixed(1);
};

const NetworkScheduleDashboard: React.FC<NetworkScheduleDashboardProps> = ({
    config: propsConfig,
    tasks: propsTasks,
    projectId 
}) => {

    const { siteId } = useParams(); 
    const targetSiteId = projectId || siteId || 'siteA';

    // 해당 사이트의 설정과 태스크 목록 가져오기
    const config = propsConfig || CPM_CONFIGS[targetSiteId] || CPM_CONFIGS['siteA'];
    const tasks = propsTasks || CPM_TASK_LISTS[targetSiteId] || CPM_TASK_LISTS['siteA'];

    // [BUG FIX] CPM 공정표 현장별 노출 제한
    if (!ALLOWED_SITE_IDS.includes(targetSiteId)) {
        return null;
    }

    const [currentDay, setCurrentDay] = useState<number>(0);
    const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(true);
    const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
    const [isEvmOpen, setIsEvmOpen] = useState<boolean>(false);

    // WBS 자동화 제너레이터 상태
    const [isWbsGeneratorOpen, setIsWbsGeneratorOpen] = useState<boolean>(false);
    const [isGeneratingWbs, setIsGeneratingWbs] = useState<boolean>(false);
    const [generatedWbs, setGeneratedWbs] = useState<WbsNode[] | null>(null);
    const [isUploaderOpen, setIsUploaderOpen] = useState<boolean>(false);

    const mermaidRef = useRef<HTMLDivElement>(null);
    const chartId = useRef(`mermaid - ${Math.random().toString(36).substr(2, 9)} `);

    // 날짜 연산 계산
    const currentDateString = useMemo(() => {
        const date = new Date(config.startDate);
        date.setDate(date.getDate() + currentDay);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y} -${m} -${d} `;
    }, [config.startDate, currentDay]);

    // 공정별 및 전체 EVM 계산 로직 - currentDay 가 변할때마다 자동계산
    const computedStatus = useMemo(() => {
        let currentTotalEarned = 0;

        const tasksInfo = tasks.map(task => {
            let taskProgress = 0;
            let status = 'waiting'; // waiting | active | done

            if (currentDay >= task.start + task.duration) {
                taskProgress = 1.0;
                status = 'done';
            } else if (currentDay >= task.start) {
                taskProgress = (currentDay - task.start) / task.duration;
                status = 'active';
            }

            const earned = task.cost * taskProgress;
            currentTotalEarned += earned;

            return {
                ...task,
                status,
                progressPct: Math.round(taskProgress * 100),
                cost: task.cost,
                earned
            };
        });

        const totalProgressPct = (currentTotalEarned / config.totalContractAmount) * 100;
        const finalProgress = Math.min(totalProgressPct, 100).toFixed(2);

        return {
            tasksInfo,
            currentTotalEarned,
            finalProgress
        };
    }, [currentDay, tasks, config.totalContractAmount]);

    // WBS 자동 생성 시뮬레이션 함수
    const handleGenerateWbs = () => {
        setIsGeneratingWbs(true);
        setTimeout(() => {
            // Mock 프로파일 및 기초 데이터 (현장 및 도급 내역서 등)
            const profile: ProjectProfile = { projectType: '도심지 업무시설', scale: '대형', contractType: '총액계약' };

            const boqItems: BoQItem[] = [
                { id: 'bq1', name: '철근 가공조립', unit: 'TON', quantity: 500, unitPrice: 800000, totalCost: 400000000, facetSpace: '1층', facetElement: '골조', facetWorkType: '철근콘크리트' },
                { id: 'bq2', name: '레미콘 타설', unit: 'M3', quantity: 1500, unitPrice: 90000, totalCost: 135000000, facetSpace: '1층', facetElement: '골조', facetWorkType: '철근콘크리트' },
                { id: 'bq3', name: '내부 수성페인트', unit: 'M2', quantity: 3000, unitPrice: 15000, totalCost: 45000000, facetSpace: '지하1층', facetElement: '마감', facetWorkType: '도장공사' }
            ];

            const scheduleItems: ScheduleItem[] = [
                { id: 's1', name: '1층 골조공사', startDate: '2026-03-01', endDate: '2026-03-30', durationDays: 30 },
                { id: 's2', name: '지하 도장공사', startDate: '2026-04-01', endDate: '2026-04-15', durationDays: 15 },
                { id: 's3', name: '내장 공사', startDate: '2026-04-16', endDate: '2026-05-15', durationDays: 30 }
            ];

            // WbsAutoGenerator의 4단계 파이프라인(추출,매핑,채번,롤업) 실행
            const result = WbsAutoGenerator.runFullPipeline(profile, boqItems, scheduleItems);
            setGeneratedWbs(result);
            setIsGeneratingWbs(false);
        }, 800); // 로딩 시뮬레이션
    };

    // Mermaid 차트 초기화 및 렌더링 (Lazy Loading 적용으로 빌드 안정화)
    useEffect(() => {
        let isMounted = true;

        const renderMermaid = async () => {
            if (!mermaidRef.current || !isMounted) return;

            try {
                // Mermaid 동적 임포트 및 초기화
                const { default: mm } = await import('mermaid');
                mm.initialize({
                    startOnLoad: false,
                    flowchart: { curve: 'basis' },
                    theme: 'default'
                });

                // 렌더링 중 표시
                mermaidRef.current.innerHTML = '<div class="flex items-center text-gray-400 text-xs animate-pulse font-black tracking-widest uppercase italic">Preparing Chart Engine...</div>';

                const tempId = `mermaid-svg-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mm.render(tempId, getMermaidGraph(targetSiteId));

                if (isMounted && mermaidRef.current) {
                    mermaidRef.current.innerHTML = svg;
                    const svgElement = mermaidRef.current.querySelector('svg');
                    if (svgElement) {
                        svgElement.style.maxWidth = '100%';
                        svgElement.style.height = 'auto';
                    }
                }
            } catch (err) {
                console.error("Mermaid Render Error:", err);
                if (isMounted && mermaidRef.current) {
                    mermaidRef.current.innerHTML = '<div class="text-red-400 text-[10px] font-black p-4 border border-red-100 bg-red-50 rounded-xl italic">공정표 렌더링 준비 중...</div>';
                }
            }
        };

        const timer = setTimeout(renderMermaid, 500);
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    const { tasksInfo, currentTotalEarned, finalProgress } = computedStatus;

    return (
        <div className="flex flex-col h-full w-full bg-gray-50 p-5 font-sans box-border text-gray-800 rounded-xl">
            {/* 상단 헤더 영역 */}
            <header className="flex flex-col md:flex-row justify-between md:items-center bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-5">
                <h1 className="flex items-center m-0 text-xl font-bold text-gray-800 tracking-tight">
                    <span className="bg-blue-100 p-2 rounded-lg text-blue-600 mr-3">
                        <Network size={24} />
                    </span>
                    {config.projectName}
                </h1>
                <div className="text-right text-sm text-gray-500 mt-3 md:mt-0 font-medium">
                    <div>총 공사기간: {config.totalDays}일 | 착공일: {config.startDate}</div>
                    <div className="text-lg font-bold text-emerald-600 mt-1">
                        총 도급액: {config.totalContractAmount.toLocaleString()}원
                    </div>
                </div>
            </header>

            {/* 메인 컨텐츠 영역: 상하 구조로 변경 */}
            <div className="flex flex-col gap-8 flex-1 min-h-0">

                {/* 1. 상단: 네트워크 차트 패널 (전폭 배치) */}
                <div className="w-full bg-white rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col min-h-[500px] animate-fade-in">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
                        <h3 className="m-0 text-lg font-black text-gray-900 uppercase tracking-tight flex items-center">
                            <span className="w-1.5 h-5 bg-blue-600 mr-3 rounded-full"></span>
                            CPM Network Schedule
                        </h3>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">Baseline Visualization</span>
                    </div>
                    <div
                        ref={mermaidRef}
                        className="mermaid flex-1 flex justify-center items-center overflow-auto bg-gray-50/30 rounded-xl border border-dashed border-gray-100"
                    >
                        {/* Mermaid Render Target (React non-managed zone) */}
                    </div>
                </div>

                {/* 1.5 Auto-WBS Generator 도입 섹션 (새로운 모듈) */}
                <div className="flex flex-col gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <button
                        onClick={() => setIsWbsGeneratorOpen(!isWbsGeneratorOpen)}
                        className="flex items-center justify-between w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 rounded-2xl shadow-md border hover:shadow-lg transition-all group border-transparent"
                    >
                        <div className="flex items-center">
                            <span className="w-1.5 h-6 bg-white mr-4 rounded-full opacity-70"></span>
                            <h3 className="m-0 text-base font-black text-white uppercase tracking-tight flex items-center">
                                <Network size={20} className="mr-3 text-white" />
                                Auto-WBS Generator (AI Pipeline)
                            </h3>
                        </div>
                        {isWbsGeneratorOpen ? <ChevronUp size={20} className="text-white" /> : <ChevronDown size={20} className="text-white" />}
                    </button>

                    {isWbsGeneratorOpen && (
                        <div className="bg-white rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 animate-slide-down">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-5 mb-5">
                                <div>
                                    <h4 className="text-gray-800 font-bold m-0 flex items-center gap-2">
                                        스마트 코어 엔진 구동 (Phase 1 ~ Phase 4)
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        과거 프로젝트 패턴 매칭 및 BoQ-공정 데이터를 결합하여 식별번호(PNS) 기반 WBS 트리를 자동 생성합니다.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setIsUploaderOpen(true)}
                                        className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all bg-white border-2 border-violet-100 text-violet-600 hover:bg-violet-50 hover:border-violet-200"
                                    >
                                        <Layers size={16} /> 원시 데이터 업로드 (Ingestion)
                                    </button>
                                    <button
                                        onClick={handleGenerateWbs}
                                        disabled={isGeneratingWbs}
                                        className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${isGeneratingWbs ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-200'}`}
                                    >
                                        {isGeneratingWbs ? (
                                            <><span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span> 제너레이팅 중...</>
                                        ) : (
                                            <><Network size={16} /> 템플릿 매핑 기반 WBS 생성</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {generatedWbs && (
                                <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-medium">
                                            <tr>
                                                <th className="px-4 py-3">PNS Code</th>
                                                <th className="px-4 py-3">Level</th>
                                                <th className="px-4 py-3">WBS Name / Activity</th>
                                                <th className="px-4 py-3 text-right">Cost Info</th>
                                                <th className="px-4 py-3">Duration (D)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {generatedWbs.map((node) => (
                                                <tr key={node.id} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-3 font-mono text-xs text-violet-600 font-bold">{node.pnsCode || '-'}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${node.level === 1 ? 'bg-gray-800 text-white font-bold' : node.level === 2 ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'}`}>
                                                            L{node.level}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center" style={{ marginLeft: `${(node.level - 1) * 16}px` }}>
                                                            {node.level > 1 && <span className="text-gray-300 mr-2">└</span>}
                                                            <span className="font-semibold text-gray-800">{node.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">{node.assignedCost ? formatMoney(node.assignedCost) : '-'}</td>
                                                    <td className="px-4 py-3 text-gray-600">{node.durationDays ? `${node.durationDays} Days` : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. 중단: 프로젝트 대시보드 토글 섹션 */}
                < div className="flex flex-col gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <button
                        onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                        className="flex items-center justify-between w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all group"
                    >
                        <div className="flex items-center">
                            <span className="w-1.5 h-6 bg-blue-600 mr-4 rounded-full"></span>
                            <h3 className="m-0 text-base font-black text-gray-900 uppercase tracking-tight flex items-center">
                                <Activity size={20} className="mr-3 text-blue-600" />
                                Project Summary & Task Status
                            </h3>
                        </div>
                        {isDashboardOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                    </button>

                    {
                        isDashboardOpen && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-down">
                                {/* 왼쪽 열: 주요 현황 지표 카드 */}
                                <div className="bg-white rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 border-l-8 border-l-blue-600 flex flex-col justify-between">
                                    <h3 className="m-0 mb-8 text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                                        Metrics Overview
                                    </h3>

                                    <div className="space-y-6">
                                        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 flex justify-between items-center group/card hover:bg-white hover:shadow-lg transition-all duration-300">
                                            <div>
                                                <div className="text-[10px] text-gray-400 font-black mb-1 uppercase tracking-widest">Current Project Date</div>
                                                <div className="text-2xl font-black text-gray-900 tabular-nums tracking-tighter">{currentDateString}</div>
                                            </div>
                                            <div className="text-blue-600 font-black text-xl italic group-hover/card:scale-110 transition-transform">D+{currentDay}</div>
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl border border-gray-200 border-l-8 border-l-red-500 shadow-sm hover:shadow-xl transition-all duration-300">
                                            <div className="text-[10px] text-gray-400 font-black mb-2 uppercase tracking-widest">Target Progress (계획 공정률)</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-black text-gray-900 tabular-nums">{finalProgress}</span>
                                                <span className="text-xl font-black text-gray-400">%</span>
                                            </div>
                                            <div className="bg-gray-100 h-3 rounded-full mt-5 overflow-hidden ring-4 ring-gray-50">
                                                <div
                                                    className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all duration-700 ease-out"
                                                    style={{ width: `${finalProgress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl border border-gray-200 border-l-8 border-l-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300">
                                            <div className="text-[10px] text-gray-400 font-black mb-2 uppercase tracking-widest">Baseline Earned Value (누적 기성액)</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-emerald-600 tabular-nums">{formatMoney(currentTotalEarned)}</span>
                                                <span className="text-lg font-black text-emerald-600/60 uppercase">KRW</span>
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-bold mt-3 border-t border-gray-50 pt-3 flex items-center italic">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                                                Actual Baseline synchronized with SSOT Data
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 오른쪽 열: 공종별 세부 현황 테이블 */}
                                <div className="bg-white rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="m-0 text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                                            Live Status Matrix
                                        </h3>
                                        <span className="text-[9px] font-black text-white bg-gray-900 px-3 py-1 rounded-full uppercase tracking-widest">Total: {tasksInfo.length}</span>
                                    </div>

                                    <div className="overflow-x-auto rounded-2xl border border-gray-100 flex-1">
                                        <table className="w-full text-sm text-left align-middle border-collapse">
                                            <thead className="bg-gray-50/80 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                                                <tr>
                                                    <th className="py-4 px-4">Description</th>
                                                    <th className="py-4 px-4 text-center">Status</th>
                                                    <th className="py-4 px-4 text-center">Prog.</th>
                                                    <th className="py-4 px-4 text-right">Cost(億)</th>
                                                    <th className="py-4 px-4 text-right">Value (KRW)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tasksInfo.map((t) => (
                                                    <tr key={t.id} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/80 transition-colors ${t.status === 'active' ? 'bg-blue-50/40 translate-x-1 border-l-2 border-l-blue-600' : ''}`}>
                                                        <td className="py-4 px-4">
                                                            <span className="text-[11px] font-black text-gray-900 truncate block max-w-[150px]" title={t.name}>
                                                                {t.name}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 text-center">
                                                            {t.status === 'done' ? (
                                                                <span className="inline-block bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap">Done</span>
                                                            ) : t.status === 'active' ? (
                                                                <span className="inline-block bg-blue-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap animate-pulse">Live</span>
                                                            ) : (
                                                                <span className="inline-block bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap">Idle</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4 text-center text-[11px] font-black text-blue-600 tabular-nums">{t.progressPct}%</td>
                                                        <td className="py-4 px-4 text-right text-[11px] font-black text-gray-400 tabular-nums">{formatMoneyShort(t.cost)}</td>
                                                        <td className="py-4 px-4 text-right text-[11px] font-black text-indigo-900 tabular-nums whitespace-nowrap">{formatMoney(t.earned)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div >
            </div >

            {/* 3. 타임라인 컨트롤 토글 섹션 */}
            < div className="flex flex-col gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <button
                    onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
                    className="flex items-center justify-between w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all group"
                >
                    <div className="flex items-center">
                        <span className="w-1.5 h-6 bg-emerald-500 mr-4 rounded-full"></span>
                        <h3 className="m-0 text-base font-black text-gray-900 uppercase tracking-tight flex items-center">
                            <Activity size={20} className="mr-3 text-emerald-500" />
                            Time Simulation Controller
                        </h3>
                    </div>
                    {isSimulatorOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </button>

                {
                    isSimulatorOpen && (
                        <div className="bg-white rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 animate-slide-down relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>

                            <div className="flex justify-between items-end mb-6 font-bold">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Baseline Day 0</span>
                                <div className="text-center">
                                    <span className="text-[10px] text-gray-400 block mb-2 uppercase font-black tracking-[0.3em]">Temporal Positioning</span>
                                    <div className="text-3xl font-black text-blue-600 tabular-nums">
                                        Day {currentDay} <span className="text-gray-300 text-lg mx-1">/</span> <span className="text-gray-400 text-xl font-medium">{config.totalDays}</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completion Day {config.totalDays}</span>
                            </div>

                            <input
                                type="range"
                                min="0"
                                max={config.totalDays}
                                value={currentDay}
                                onChange={(e) => setCurrentDay(Number(e.target.value))}
                                className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-600 focus:outline-none ring-8 ring-gray-50/50"
                            />

                            <div className="text-center mt-6">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest m-0 flex items-center justify-center opacity-60">
                                    <span className="w-4 h-[1px] bg-gray-300 mr-3"></span>
                                    Drag to simulate project progression and cash flow
                                    <span className="w-4 h-[1px] bg-gray-300 ml-3"></span>
                                </p>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* 4. EVM 분석 토글 섹션 */}
            {
                targetSiteId && (
                    <div className="flex flex-col gap-4 animate-fade-in pb-10" style={{ animationDelay: '0.4s' }}>
                        <button
                            onClick={() => setIsEvmOpen(!isEvmOpen)}
                            className="flex items-center justify-between w-full bg-gray-900 p-6 rounded-2xl shadow-xl hover:bg-black transition-all group"
                        >
                            <div className="flex items-center">
                                <span className="w-1.5 h-6 bg-indigo-500 mr-4 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)]"></span>
                                <h3 className="m-0 text-base font-black text-white uppercase tracking-tight flex items-center">
                                    <span className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400 mr-3"><Activity size={18} /></span>
                                    EVM Performance & S-Curve Analysis
                                </h3>
                            </div>
                            {isEvmOpen ? <ChevronUp size={20} className="text-indigo-400" /> : <ChevronDown size={20} className="text-indigo-400" />}
                        </button>

                        {isEvmOpen && (
                            <div className="flex flex-col w-full space-y-8 animate-slide-down">
                                {/* S-Curve 카드 */}
                                <div className="flex flex-col w-full shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden bg-white border border-gray-100">
                                    <div className="p-2 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between px-8 py-5">
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] opacity-40">Analysis Module 01</span>
                                        <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">S-Curve Analysis</span>
                                    </div>
                                    <div className="p-8 w-full block">
                                        <EvmSCurveChart projectId={targetSiteId} />
                                    </div>
                                </div>

                                {/* EVM 지표 테이블 카드 */}
                                <div className="flex flex-col w-full shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden bg-white border border-gray-100">
                                    <div className="p-2 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between px-8 py-5">
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] opacity-40">Analysis Module 02</span>
                                        <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">Performance Details Matrix</span>
                                    </div>
                                    <div className="p-8 w-full block">
                                        <div className="w-full h-full overflow-hidden">
                                            <EvmDashboard projectId={targetSiteId} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

            {/* WBS Data Uploader Modal 연동 */}
            {isUploaderOpen && (
                <WbsDataUploader
                    onClose={() => setIsUploaderOpen(false)}
                    onComplete={(data) => {
                        console.log("업로드 완료된 원시 데이터:", data);
                        setIsUploaderOpen(false);
                        // TODO: 이후 생성된 데이터를 WbsAutoGenerator로 패스다운 하는 로직 연동
                        handleGenerateWbs();
                    }}
                />
            )}
        </div >
    );
};

export default NetworkScheduleDashboard;
