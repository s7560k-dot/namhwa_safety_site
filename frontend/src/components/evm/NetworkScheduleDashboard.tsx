import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Network, Activity, Layout } from 'lucide-react';
import EvmDashboard from './EvmDashboard';
import EvmSCurveChart from './EvmSCurveChart';
import { CPM_CONFIG, CPM_TASKS, NetworkTask, NetworkProjectConfig } from '../../constants/cpmData';

interface NetworkScheduleDashboardProps {
    config?: NetworkProjectConfig;
    tasks?: NetworkTask[];
    projectId?: string; // 추가: 부모로부터 직접 현장 ID를 받을 수 있음
}

// Mermaid 차트 구성
const MERMAID_GRAPH = `
graph LR
    classDef normal fill:#fff,stroke:#333,stroke-width:1px,rx:5,ry:5;
    classDef critical fill:#fff5f5,stroke:#e74c3c,stroke-width:3px,rx:5,ry:5;
    classDef milestone fill:#2c3e50,stroke:#333,stroke-width:2px,color:#fff,rx:20,ry:20;

    Start([🚀 착공]):::milestone
    End([🏆 준공]):::milestone

    A[A. 가설/토공사<br/>40일]:::critical
    B[B. 기초/파일<br/>40일]:::critical
    C[C. RC 골조<br/>70일]:::critical
    D[D. 철골 골조<br/>60일]:::normal
    E[E. 철탑/설비<br/>80일]:::critical
    F[F. 망/시스템<br/>50일]:::normal
    G[G. 내외장/MEP<br/>100일]:::critical
    H[H. 부대토목<br/>50일]:::critical

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

// 유틸리티 포맷 함수
const formatMoney = (amount: number) => {
    if (amount === 0) return "-";
    return Math.floor(amount).toLocaleString('ko-KR');
};

const formatMoneyShort = (amount: number) => {
    return (amount / 100000000).toFixed(1);
};

const NetworkScheduleDashboard: React.FC<NetworkScheduleDashboardProps> = ({
    config = CPM_CONFIG,
    tasks = CPM_TASKS,
    projectId // Props로 들어온 현장 ID
}) => {

    const { siteId } = useParams(); // URL에서 프로젝트(현장) ID 추출

    // Props를 우선순위로 두고, 없으면 라우터 파라미터 사용
    const targetSiteId = projectId || siteId;

    const [currentDay, setCurrentDay] = useState<number>(0);
    const mermaidRef = useRef<HTMLDivElement>(null);
    const chartId = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

    // 날짜 연산 계산
    const currentDateString = useMemo(() => {
        const date = new Date(config.startDate);
        date.setDate(date.getDate() + currentDay);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
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
                const { svg } = await mm.render(tempId, MERMAID_GRAPH);

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

                {/* 2. 중단: 프로젝트 대시보드 (2열 그리드 배치) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>

                    {/* 왼쪽 열: 주요 현황 지표 카드 */}
                    <div className="bg-white rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 border-l-8 border-l-blue-600 flex flex-col justify-between">
                        <h3 className="m-0 mb-8 text-base font-black text-gray-900 uppercase tracking-tight flex items-center">
                            <span className="bg-blue-50 p-2 rounded-lg text-blue-600 mr-3"><Activity size={18} /></span>
                            Project Summary Metrics
                        </h3>

                        <div className="space-y-6">
                            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 flex justify-between items-center group hover:bg-white hover:shadow-lg transition-all duration-300">
                                <div>
                                    <div className="text-[10px] text-gray-400 font-black mb-1 uppercase tracking-widest">Current Project Date</div>
                                    <div className="text-2xl font-black text-gray-900 tabular-nums tracking-tighter">{currentDateString}</div>
                                </div>
                                <div className="text-blue-600 font-black text-xl italic group-hover:scale-110 transition-transform">D+{currentDay}</div>
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
                            <h3 className="m-0 text-base font-black text-gray-900 uppercase tracking-tight flex items-center">
                                <span className="bg-indigo-50 p-2 rounded-lg text-indigo-600 mr-3"><Layout size={18} /></span>
                                Real-time Task Status
                            </h3>
                            <span className="text-[9px] font-black text-white bg-gray-900 px-3 py-1 rounded-full uppercase tracking-widest">Tasks: {tasksInfo.length}</span>
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
            </div>

            {/* 하단 타임라인/슬라이더 컨트롤 */}
            < div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 mt-5 relative overflow-hidden" >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>

                <div className="flex justify-between items-end mb-4 font-bold">
                    <span className="text-gray-500 text-sm">Day 0</span>
                    <span className="text-blue-600 text-xl mx-4 text-center">
                        <span className="text-xs text-gray-400 block mb-1 uppercase tracking-widest">Time Simulator</span>
                        Day {currentDay} <span className="text-gray-400 text-base">/ {config.totalDays}</span>
                    </span>
                    <span className="text-gray-500 text-sm">Day {config.totalDays}</span>
                </div>

                <input
                    type="range"
                    min="0"
                    max={config.totalDays}
                    value={currentDay}
                    onChange={(e) => setCurrentDay(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />

                <div className="text-center mt-3">
                    <p className="text-xs text-gray-400 m-0">
                        ▲ 하단의 슬라이더를 드래그하여 전체 공사기간의 일정 및 기성 흐름을 시뮬레이션 하세요.
                    </p>
                </div>
            </div >

            {/* 실제 DB 연동 EVM 기성 현황 모듈 섹션 (수직 배치로 가독성 개선) */}
            {targetSiteId && (
                <div className="mt-12 flex flex-col w-full space-y-12 pb-10">
                    <h2 className="text-xl font-black text-gray-900 mb-2 px-1 border-b-2 border-gray-900 pb-4 flex items-center">
                        <span className="w-2 h-7 bg-blue-600 mr-4 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"></span>
                        실적 공정 및 기성고(EVM) 관리 대시보드
                    </h2>

                    {/* S-Curve 카드 (전체 너비 강제) */}
                    <div className="animate-fade-in flex flex-col w-full shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden bg-white border border-gray-100" style={{ animationDelay: '0.3s' }}>
                        <div className="p-2 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between px-8 py-5">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] opacity-40">Analysis Module 01</span>
                            <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">S-Curve Analysis</span>
                        </div>
                        <div className="p-8 w-full block">
                            <EvmSCurveChart projectId={targetSiteId} />
                        </div>
                    </div>

                    {/* EVM 지표 테이블 카드 (전체 너비 강제) */}
                    <div className="animate-fade-in flex flex-col w-full shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden bg-white border border-gray-100" style={{ animationDelay: '0.4s' }}>
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
        </div >
    );
};

export default NetworkScheduleDashboard;
