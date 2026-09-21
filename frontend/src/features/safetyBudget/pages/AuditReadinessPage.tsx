import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { SafetyBudgetQueryProvider } from '../providers/SafetyBudgetQueryProvider';
import { useProject, useWorkPackages, useExpenses } from '../hooks/useSafetyBudgetData';
import { computeBudgetAnalysis } from '../domain/budgetAnalysis';
import { calculateAuditReadiness } from '../domain/auditReadiness';
import { SafetyBudgetHeader } from '../components/SafetyBudgetHeader';
import { AuditReadinessScoreCard } from '../components/AuditReadinessScoreCard';
import { AuditPrintReport } from '../components/AuditPrintReport';

function AuditReadinessDashboard({ projectId }: { projectId: string }) {
    const { data: project, isLoading } = useProject(projectId);
    const { data: workPackages = [] } = useWorkPackages(projectId);
    const { data: expenses = [] } = useExpenses(projectId);

    const analysisResult = useMemo(() => {
        if (!project) return null;
        return computeBudgetAnalysis(project, workPackages, expenses);
    }, [project, workPackages, expenses]);

    const breakdown = useMemo(() => {
        if (!analysisResult?.ok) return null;
        return calculateAuditReadiness(expenses, analysisResult.data.reconciliation, analysisResult.data.deviationPct);
    }, [analysisResult, expenses]);

    if (isLoading) {
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

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-6xl mx-auto space-y-8">
                <SafetyBudgetHeader
                    projectId={projectId}
                    projectName={project.name}
                    activeTab="/audit"
                    rightSlot={
                        breakdown && (
                            <button
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-bold rounded-xl px-4 py-2 hover:bg-red-600 transition-colors"
                            >
                                <Printer size={16} /> A4 인쇄
                            </button>
                        )
                    }
                />

                {!analysisResult?.ok && (
                    <p className="text-sm font-medium text-red-600 bg-red-50 rounded-xl px-4 py-3">
                        공정률 데이터 오류로 감사 준비도를 계산할 수 없습니다: {analysisResult && !analysisResult.ok ? analysisResult.error : ''}
                    </p>
                )}

                {breakdown && analysisResult?.ok && (
                    <>
                        <AuditReadinessScoreCard breakdown={breakdown} />
                        <div id="print-area" className="hidden">
                            <AuditPrintReport
                                projectName={project.name}
                                breakdown={breakdown}
                                reconciliation={analysisResult.data.reconciliation}
                                expenses={expenses}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function AuditReadinessPage() {
    const { siteId } = useParams<{ siteId: string }>();
    if (!siteId) return null;

    return (
        <SafetyBudgetQueryProvider>
            <AuditReadinessDashboard projectId={siteId} />
        </SafetyBudgetQueryProvider>
    );
}
