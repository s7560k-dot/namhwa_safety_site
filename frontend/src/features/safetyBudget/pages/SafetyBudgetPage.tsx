import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { SafetyBudgetQueryProvider } from '../providers/SafetyBudgetQueryProvider';
import {
    useProject,
    useWorkPackages,
    useSubcontractors,
    useExpenses,
    useAddExpense,
} from '../hooks/useSafetyBudgetData';
import { calculateWeightedProgress } from '../domain/weightedProgress';
import { getTargetCumulativeExecutionRate, calculateDeviation, getAlertLevel } from '../domain/sCurve';
import { reconcileLedger } from '../domain/reconciliation';
import { AlertBadge } from '../components/AlertBadge';
import { SCurveChart } from '../components/SCurveChart';
import { LedgerReconciliationCard } from '../components/LedgerReconciliationCard';
import { ExpenseRegistrationForm } from '../components/ExpenseRegistrationForm';
import { ExpenseListTable } from '../components/ExpenseListTable';
import { EligibilityModal } from '../components/EligibilityModal';
import type { ExpenseInput } from '../schemas/expense.schema';
import type { LedgerReconciliationResult } from '../domain/reconciliation';
import type { AlertLevel } from '../config/constants';

/** ResourceCenter.jsx의 현장 목록과 동일한 siteId를 사용한다 (진행 현장이 늘어나면 두 곳 모두 갱신 필요). */
const SITE_OPTIONS = [
    { id: 'siteA', label: '대광 새마을금고 골프연습장' },
    { id: 'siteB', label: '수원 노유자시설 신축공사' },
    { id: 'siteC', label: '평택 세탁소 시설 신축공사' },
];

interface AnalysisData {
    weightedProgressPct: number;
    reconciliation: LedgerReconciliationResult;
    actualCumulativeExecutionPct: number;
    targetCumulativeExecutionPct: number;
    deviationPct: number;
    alertLevel: AlertLevel;
}

function SafetyBudgetDashboard({ projectId }: { projectId: string }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: project, isLoading: isProjectLoading } = useProject(projectId);
    const { data: workPackages = [] } = useWorkPackages(projectId);
    const { data: subcontractors = [] } = useSubcontractors(projectId);
    const { data: expenses = [] } = useExpenses(projectId);
    const addExpenseMutation = useAddExpense(projectId, user?.email ?? 'unknown');

    const [rejectionReason, setRejectionReason] = useState<string | null>(null);

    const analysisResult = useMemo((): { ok: true; data: AnalysisData } | { ok: false; error: string } => {
        if (!project) return { ok: false, error: '' };

        let weightedProgressPct = 0;
        try {
            weightedProgressPct = calculateWeightedProgress(workPackages);
        } catch (err) {
            const message = err instanceof Error ? err.message : '공정률 계산 오류';
            return { ok: false, error: message };
        }

        const reconciliation = reconcileLedger(
            project.allocatedSafetyBudget,
            expenses.map((e) => e.amount)
        );
        const actualCumulativeExecutionPct =
            project.allocatedSafetyBudget > 0
                ? (reconciliation.cappedExecutedTotal / project.allocatedSafetyBudget) * 100
                : 0;
        const targetCumulativeExecutionPct = getTargetCumulativeExecutionRate(weightedProgressPct);
        const deviationPct = calculateDeviation(actualCumulativeExecutionPct, targetCumulativeExecutionPct);
        const alertLevel = getAlertLevel(deviationPct);

        return {
            ok: true,
            data: {
                weightedProgressPct,
                reconciliation,
                actualCumulativeExecutionPct,
                targetCumulativeExecutionPct,
                deviationPct,
                alertLevel,
            },
        };
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
                <div className="flex items-center justify-between">
                    <div>
                        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-red-600 text-sm font-bold mb-3">
                            <ArrowLeft size={16} /> 자료실로
                        </Link>
                        <h1 className="text-3xl font-black text-slate-900">{project.name}</h1>
                        <p className="text-slate-500 font-medium">산안비 실행예산 관리</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={projectId}
                            onChange={(e) => navigate(`/safety-budget/${e.target.value}`)}
                            className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 bg-white"
                        >
                            {SITE_OPTIONS.map((site) => (
                                <option key={site.id} value={site.id}>
                                    {site.label}
                                </option>
                            ))}
                        </select>
                        {analysis && <AlertBadge level={analysis.alertLevel} />}
                    </div>
                </div>

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
