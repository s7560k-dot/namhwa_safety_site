import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SafetyBudgetQueryProvider } from '../providers/SafetyBudgetQueryProvider';
import { useProject, useExpenses } from '../hooks/useSafetyBudgetData';
import { reconcileLedger } from '../domain/reconciliation';
import { getSettlementStrategy } from '../domain/settlement';
import { SafetyBudgetHeader } from '../components/SafetyBudgetHeader';
import { SettlementResultCard } from '../components/SettlementResultCard';

function SettlementSimulation({ projectId }: { projectId: string }) {
    const { data: project, isLoading } = useProject(projectId);
    const { data: expenses = [] } = useExpenses(projectId);

    const result = useMemo(() => {
        if (!project) return null;
        const reconciliation = reconcileLedger(
            project.allocatedSafetyBudget,
            expenses.map((e) => e.amount)
        );
        const strategy = getSettlementStrategy(project.settlementRuleType);
        return strategy.calculate({
            allocatedSafetyBudget: project.allocatedSafetyBudget,
            unexecutedBalance: reconciliation.unexecutedBalance,
        });
    }, [project, expenses]);

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
                <SafetyBudgetHeader projectId={projectId} projectName={project.name} activeTab="/settlement" />
                {result && <SettlementResultCard ruleType={project.settlementRuleType} result={result} />}
            </div>
        </div>
    );
}

export default function SettlementSimulationPage() {
    const { siteId } = useParams<{ siteId: string }>();
    if (!siteId) return null;

    return (
        <SafetyBudgetQueryProvider>
            <SettlementSimulation projectId={siteId} />
        </SafetyBudgetQueryProvider>
    );
}
