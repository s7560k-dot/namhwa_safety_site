import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { SafetyBudgetQueryProvider } from '../providers/SafetyBudgetQueryProvider';
import { useProject, useWorkPackages, useCalculationBasis } from '../hooks/useSafetyBudgetData';
import { sortWorkPackagesForProposal } from '../domain/budgetProposal';
import { SafetyBudgetHeader } from '../components/SafetyBudgetHeader';
import { BudgetProposalPrintReport } from '../components/BudgetProposalPrintReport';

function BudgetProposalDashboard({ projectId }: { projectId: string }) {
    const { data: project, isLoading: isProjectLoading } = useProject(projectId);
    const { data: workPackages = [] } = useWorkPackages(projectId);
    const { data: calculationBasisHistory = [] } = useCalculationBasis(projectId);
    const [mode, setMode] = useState<'ALL' | 'SINGLE'>('ALL');
    const [selectedWorkPackageId, setSelectedWorkPackageId] = useState('');

    const sortedWorkPackages = useMemo(() => sortWorkPackagesForProposal(workPackages), [workPackages]);
    const latestCalculationBasis = calculationBasisHistory[0] ?? null;

    const displayedWorkPackages = useMemo(() => {
        if (mode === 'ALL') return sortedWorkPackages;
        return sortedWorkPackages.filter((wp) => wp.id === selectedWorkPackageId);
    }, [mode, sortedWorkPackages, selectedWorkPackageId]);

    if (isProjectLoading) {
        return <div className="min-h-screen flex items-center justify-center text-slate-400">불러오는 중...</div>;
    }

    if (!project) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-500">
                <p>프로젝트({projectId})의 산안비 데이터가 아직 없습니다.</p>
                <Link to="/" className="text-red-600 font-bold hover:underline">
                    자료실로 돌아가기
                </Link>
            </div>
        );
    }

    const canPrint = displayedWorkPackages.length > 0;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-6xl mx-auto space-y-8">
                <SafetyBudgetHeader
                    projectId={projectId}
                    projectName={project.name}
                    activeTab="/proposal"
                    rightSlot={
                        <button
                            onClick={() => window.print()}
                            disabled={!canPrint}
                            className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-bold rounded-xl px-4 py-2 hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                            <Printer size={16} /> A4 인쇄
                        </button>
                    }
                />

                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setMode('ALL')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                                mode === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                        >
                            전체 공종
                        </button>
                        <button
                            onClick={() => setMode('SINGLE')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                                mode === 'SINGLE' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                        >
                            공종 개별 선택
                        </button>
                    </div>
                    {mode === 'SINGLE' && (
                        <select
                            value={selectedWorkPackageId}
                            onChange={(e) => setSelectedWorkPackageId(e.target.value)}
                            className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700"
                        >
                            <option value="">공종을 선택하세요</option>
                            {sortedWorkPackages.map((wp) => (
                                <option key={wp.id} value={wp.id}>
                                    {wp.name} ({(wp.riskWeight * 100).toFixed(2)}%)
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {workPackages.length === 0 ? (
                    <p className="text-sm font-medium text-amber-700 bg-amber-50 rounded-xl px-4 py-3">
                        아직 등록된 공종이 없습니다. "내역서 가져오기"로 먼저 위험가중치를 산정해주세요.
                    </p>
                ) : mode === 'SINGLE' && !selectedWorkPackageId ? (
                    <p className="text-sm text-slate-400 bg-white rounded-3xl border border-slate-100 p-8 text-center">
                        공종을 선택하면 미리보기가 표시됩니다.
                    </p>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <BudgetProposalPrintReport
                            projectName={project.name}
                            allocatedSafetyBudget={project.allocatedSafetyBudget}
                            calculationBasis={latestCalculationBasis}
                            workPackages={displayedWorkPackages}
                            mode={mode}
                        />
                    </div>
                )}

                <div id="print-area" className="hidden">
                    {canPrint && (
                        <BudgetProposalPrintReport
                            projectName={project.name}
                            allocatedSafetyBudget={project.allocatedSafetyBudget}
                            calculationBasis={latestCalculationBasis}
                            workPackages={displayedWorkPackages}
                            mode={mode}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

/** 산안비 예산 품의서 페이지 진입점. */
export default function BudgetProposalPage() {
    const { siteId } = useParams<{ siteId: string }>();
    if (!siteId) return null;

    return (
        <SafetyBudgetQueryProvider>
            <BudgetProposalDashboard projectId={siteId} />
        </SafetyBudgetQueryProvider>
    );
}
