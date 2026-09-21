import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { SafetyBudgetQueryProvider } from '../providers/SafetyBudgetQueryProvider';
import { useProject, useSubcontractors, useExpenses, useSetExpenseEvidenceConfirmed } from '../hooks/useSafetyBudgetData';
import { summarizeSubcontractorBudgets } from '../domain/subcontractorSummary';
import { SafetyBudgetHeader } from '../components/SafetyBudgetHeader';
import { SubcontractorSummaryTable } from '../components/SubcontractorSummaryTable';
import { EvidenceConfirmationList } from '../components/EvidenceConfirmationList';

function SubcontractorDashboard({ projectId }: { projectId: string }) {
    const { isAdmin } = useAuth();
    const { data: project, isLoading } = useProject(projectId);
    const { data: subcontractors = [] } = useSubcontractors(projectId);
    const { data: expenses = [] } = useExpenses(projectId);
    const confirmMutation = useSetExpenseEvidenceConfirmed(projectId);

    const summaries = useMemo(() => summarizeSubcontractorBudgets(subcontractors, expenses), [subcontractors, expenses]);

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
                <SafetyBudgetHeader projectId={projectId} projectName={project.name} activeTab="/subcontractors" />

                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 mb-6">협력사별 산안비 배정·집행·잔액</h3>
                    <SubcontractorSummaryTable summaries={summaries} />
                </div>

                {isAdmin && (
                    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                        <h3 className="text-xl font-black text-slate-900 mb-2">증빙 확인 대기 (관리자)</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            증빙 확인이 완료되어야 기성 처리 시 해당 협력사 집행분이 확정됩니다.
                        </p>
                        <EvidenceConfirmationList
                            expenses={expenses}
                            subcontractors={subcontractors}
                            onConfirm={(expenseId) => confirmMutation.mutate({ expenseId, confirmed: true })}
                            isConfirming={confirmMutation.isPending}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SubcontractorDashboardPage() {
    const { siteId } = useParams<{ siteId: string }>();
    if (!siteId) return null;

    return (
        <SafetyBudgetQueryProvider>
            <SubcontractorDashboard projectId={siteId} />
        </SafetyBudgetQueryProvider>
    );
}
