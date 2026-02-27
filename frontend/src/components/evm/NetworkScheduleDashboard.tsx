import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import mermaid from 'mermaid';
import { Network } from 'lucide-react';
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

// Mermaid 초기화 (글로벌 1회)
mermaid.initialize({
    startOnLoad: false,
    flowchart: { curve: 'basis' },
    theme: 'default'
});

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

    // Mermaid 차트 초기화 및 렌더링
    useEffect(() => {
        let isMounted = true;

        const renderMermaid = async () => {
            if (!mermaidRef.current || !isMounted) return;

            try {
                // 이전 렌더링 결과 청소
                mermaidRef.current.innerHTML = '<div class="flex items-center text-gray-400 text-xs animate-pulse font-bold">차트 분석 및 렌더링 중...</div>';

                // 새로운 고유 ID 생성 (매 렌더링 시 고유성 보장)
                const tempId = `mermaid-svg-${Math.random().toString(36).substr(2, 9)}`;

                // Mermaid 렌더링 수행
                const { svg } = await mermaid.render(tempId, MERMAID_GRAPH);

                if (isMounted && mermaidRef.current) {
                    mermaidRef.current.innerHTML = svg;
                    // SVG 너비를 부모에 맞게 조정
                    const svgElement = mermaidRef.current.querySelector('svg');
                    if (svgElement) {
                        svgElement.style.maxWidth = '100%';
                        svgElement.style.height = 'auto';
                    }
                }
            } catch (err) {
                console.error("Mermaid Render Error:", err);
                if (isMounted && mermaidRef.current) {
                    mermaidRef.current.innerHTML = '<div class="text-red-400 text-xs font-black p-4 border border-red-100 bg-red-50 rounded-lg">그래프 렌더링 라이브러리 초기화 중...<br/>(새로고침을 시도해 주세요)</div>';
                }
            }
        };

        // DOM이 확실히 잡힌 후 렌더링 시도
        const timer = setTimeout(renderMermaid, 300);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []); // 정의된 그래프가 변경될 때 재렌더링하려면 MERMAID_GRAPH 추가 가능

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

            {/* 메인 컨텐츠 (좌우 분할) */}
            <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
                {/* 왼쪽: 네트워크 차트 패널 */}
                <div className="flex-[2] bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
                    <h3 className="m-0 mb-4 text-base font-bold text-gray-800">CPM Network Schedule</h3>
                    <div
                        ref={mermaidRef}
                        className="mermaid flex-1 flex justify-center items-center overflow-auto"
                        // 리액트가 이 div 이하의 DOM을 건드리지 않도록 명시
                        dangerouslySetInnerHTML={{ __html: '' }}
                    >
                        {/* Mermaid Render Target */}
                    </div>
                </div>

                {/* 오른쪽: 현황 대시보드 패널 */}
                <div className="flex-1 bg-white rounded-xl p-6 shadow-sm border border-gray-100 border-l-4 border-l-blue-500 overflow-y-auto">
                    <h3 className="m-0 mb-5 text-base font-bold text-gray-800">📋 Project Dashboard</h3>

                    {/* 주요 현황 카드 세트 */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4 flex justify-between items-center">
                        <div>
                            <div className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">Current Date</div>
                            <div className="text-2xl font-black text-gray-800">{currentDateString}</div>
                        </div>
                        <div className="text-blue-500 font-bold text-lg">(D+{currentDay})</div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 border-l-4 border-l-red-500 mb-4 shadow-sm">
                        <div className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">Planned Progress (계획 공정률)</div>
                        <div className="text-2xl font-black text-gray-800">{finalProgress}%</div>
                        <div className="bg-gray-100 h-2.5 rounded-full mt-3 overflow-hidden">
                            <div
                                className="h-full bg-red-500 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${finalProgress}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 border-l-4 border-l-emerald-500 mb-6 shadow-sm">
                        <div className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">Earned Value (누적 기성고)</div>
                        <div className="text-2xl font-black text-emerald-600">{formatMoney(currentTotalEarned)} 원</div>
                        <div className="text-xs text-gray-400 mt-2">실제 도급 내역 반영 완료</div>
                    </div>

                    {/* 공종별 세부 현황 테이블 */}
                    <div>
                        <div className="text-xs text-gray-500 font-bold mb-3 uppercase tracking-wider">Task Status (공종별 현황)</div>
                        <div className="overflow-x-auto rounded-lg border border-gray-100">
                            <table className="w-full text-sm text-left align-middle border-collapse">
                                <thead className="bg-gray-50 text-gray-500 text-xs border-b border-gray-200">
                                    <tr>
                                        <th className="py-2.5 px-3 font-semibold">공종명</th>
                                        <th className="py-2.5 px-3 text-center font-semibold">진행</th>
                                        <th className="py-2.5 px-3 text-right font-semibold">배정액(억)</th>
                                        <th className="py-2.5 px-3 text-right font-semibold">기성액(원)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasksInfo.map((t) => (
                                        <tr key={t.id} className={`border-b border-gray-50 last:border-0 ${t.status === 'active' ? 'bg-blue-50/50' : ''}`}>
                                            <td className="py-3 px-3">
                                                <div className="flex items-center text-xs font-bold text-gray-800">
                                                    {t.status === 'done' ? (
                                                        <span className="inline-block bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded mr-2 text-[10px] whitespace-nowrap">완료</span>
                                                    ) : t.status === 'active' ? (
                                                        <span className="inline-block bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mr-2 text-[10px] whitespace-nowrap">진행</span>
                                                    ) : (
                                                        <span className="inline-block bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded mr-2 text-[10px] whitespace-nowrap">대기</span>
                                                    )}
                                                    <span className="truncate max-w-[120px]" title={t.name}>{t.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-center text-blue-500 font-bold text-xs">{t.progressPct}%</td>
                                            <td className="py-3 px-3 text-right text-gray-500 text-xs">{formatMoneyShort(t.cost)}</td>
                                            <td className="py-3 px-3 text-right text-emerald-600 font-bold text-xs whitespace-nowrap">{formatMoney(t.earned)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div >

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
                <div className="mt-8 space-y-10">
                    <h2 className="text-xl font-black text-gray-900 mb-6 px-1 border-b-2 border-gray-900 pb-3 flex items-center">
                        <span className="w-2 h-6 bg-blue-600 mr-3 rounded-full"></span>
                        실적 공정 및 기성고(EVM) 관리 대시보드
                    </h2>

                    <div className="animate-fade-in w-full shadow-lg rounded-2xl overflow-hidden bg-white border border-gray-100" style={{ animationDelay: '0.3s' }}>
                        <div className="p-2 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between px-6 py-4">
                            <span className="text-sm font-black text-gray-700 uppercase tracking-widest">S-Curve Analysis</span>
                        </div>
                        <div className="p-6">
                            <EvmSCurveChart projectId={targetSiteId} />
                        </div>
                    </div>

                    <div className="animate-fade-in w-full shadow-lg rounded-2xl overflow-hidden bg-white border border-gray-100" style={{ animationDelay: '0.4s' }}>
                        <div className="p-2 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between px-6 py-4">
                            <span className="text-sm font-black text-gray-700 uppercase tracking-widest">EVM Performance Matrix</span>
                        </div>
                        <div className="p-6">
                            <EvmDashboard projectId={targetSiteId} />
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default NetworkScheduleDashboard;
