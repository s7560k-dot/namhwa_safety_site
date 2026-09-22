import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileUp } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { SafetyBudgetQueryProvider } from '../providers/SafetyBudgetQueryProvider';
import {
    useProject,
    useWorkPackages,
    useSubcontractors,
    useExpenses,
    useAddExpense,
} from '../hooks/useSafetyBudgetData';
import { computeBudgetAnalysis } from '../domain/budgetAnalysis';
import { AlertBadge } from '../components/AlertBadge';
import { SCurveChart } from '../components/SCurveChart';
import { LedgerReconciliationCard } from '../components/LedgerReconciliationCard';
import { ExpenseRegistrationForm } from '../components/ExpenseRegistrationForm';
import { ExpenseListTable } from '../components/ExpenseListTable';
import { ExpenseLedgerImportSection } from '../components/ExpenseLedgerImportSection';
import { EligibilityModal } from '../components/EligibilityModal';
import { SafetyBudgetHeader } from '../components/SafetyBudgetHeader';
import type { ExpenseInput } from '../schemas/expense.schema';

function SafetyBudgetDashboard({ projectId }: { projectId: string }) {
    const { user } = useAuth();
    const { data: project, isLoading: isProjectLoading } = useProject(projectId);
    const { data: workPackages = [] } = useWorkPackages(projectId);
    const { data: subcontractors = [] } = useSubcontractors(projectId);
    const { data: expenses = [] } = useExpenses(projectId);
    const addExpenseMutation = useAddExpense(projectId, user?.email ?? 'unknown');

    const [rejectionReason, setRejectionReason] = useState<string | null>(null);
    const [isLedgerImportOpen, setIsLedgerImportOpen] = useState(false);

    const analysisResult = useMemo(() => {
        if (!project) return { ok: false as const, error: '' };
        return computeBudgetAnalysis(project, workPackages, expenses);
    }, [project, workPackages, expenses]);

    const analysis = analysisResult.ok ? analysisResult.data : null;
    const weightError = !analysisResult.ok && analysisResult.error ? analysisResult.error : null;

    const handleAddExpense = (input: ExpenseInput) => {
        addExpenseMutation.mutate(input, {
            onSuccess: (result) => {
                if (result.status === 'REJECTED') {
                    setRejectionReason(result.reason);
                }
            },
        });
    };

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

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-6xl mx-auto space-y-8">
                <SafetyBudgetHeader
                    projectId={projectId}
                    projectName={project.name}
                    activeTab=""
                    rightSlot={analysis && <AlertBadge level={analysis.alertLevel} />}
                />

                {weightError && (
                    <p className="text-sm font-medium text-red-600 bg-red-50 rounded-xl px-4 py-3">
                        {weightError} (공종별 위험 가중치 데이터를 확인하세요)
                    </p>
                )}

                {analysis && (
                    <>
                        <LedgerReconciliationCard result={analysis.reconciliation} />

                        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                            <h3 className="text-xl font-black text-slate-900 mb-2">위험 가중 공정률 S-곡선</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                위험 가중 공정률 {analysis.weightedProgressPct.toFixed(1)}% · 편차{' '}
                                {analysis.deviationPct >= 0 ? '+' : ''}
                                {analysis.deviationPct.toFixed(1)}%p
                            </p>
                            <SCurveChart
                                weightedProgressPct={analysis.weightedProgressPct}
                                actualCumulativeExecutionPct={analysis.actualCumulativeExecutionPct}
                            />
                        </div>
                    </>
                )}

                {isLedgerImportOpen ? (
                    <ExpenseLedgerImportSection
                        projectId={projectId}
                        createdBy={user?.email ?? 'unknown'}
                        onClose={() => setIsLedgerImportOpen(false)}
                    />
                ) : (
                    <button
                        onClick={() => setIsLedgerImportOpen(true)}
                        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-red-600 border border-slate-200 rounded-xl px-4 py-3 bg-white transition-colors"
                    >
                        <FileUp size={16} /> 사용내역서 PDF로 일괄 등록
                    </button>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <ExpenseRegistrationForm
                            projectId={projectId}
                            subcontractors={subcontractors}
                            onSubmit={handleAddExpense}
                            isSubmitting={addExpenseMutation.isPending}
                        />
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                        <h3 className="text-xl font-black text-slate-900 mb-6">집행 내역</h3>
                        <ExpenseListTable expenses={expenses} />
                    </div>
                </div>
            </div>

            <EligibilityModal open={!!rejectionReason} reason={rejectionReason ?? ''} onClose={() => setRejectionReason(null)} />
        </div>
    );
}

/** 산안비 실행예산 페이지 진입점. React Query Provider를 이 기능 트리에만 적용한다. */
export default function SafetyBudgetPage() {
    const { siteId } = useParams<{ siteId: string }>();

    if (!siteId) {
        return <div className="min-h-screen flex items-center justify-center text-slate-400">현장을 선택해주세요.</div>;
    }

    return (
        <SafetyBudgetQueryProvider>
            <SafetyBudgetDashboard projectId={siteId} />
        </SafetyBudgetQueryProvider>
    );
}
