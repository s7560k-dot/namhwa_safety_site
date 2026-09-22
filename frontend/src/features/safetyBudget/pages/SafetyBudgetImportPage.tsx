import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { SafetyBudgetQueryProvider } from '../providers/SafetyBudgetQueryProvider';
import { useProject, useConfirmCostBreakdownImport } from '../hooks/useSafetyBudgetData';
import { CostBreakdownUploader } from '../components/CostBreakdownUploader';
import { SafetyBudgetImportPreview } from '../components/SafetyBudgetImportPreview';
import { SafetyBudgetHeader } from '../components/SafetyBudgetHeader';
import { determineConstructionCategory, calculateSafetyBudgetAmount } from '../domain/safetyBudgetCalculation';
import { deriveRiskWeights } from '../domain/riskWeightAllocation';
import type { CostBreakdownImportResult } from '../domain/costBreakdownImport';

function SafetyBudgetImportDashboard({ projectId }: { projectId: string }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: project, isLoading: isProjectLoading } = useProject(projectId);
    const [parseResult, setParseResult] = useState<CostBreakdownImportResult | null>(null);
    const [fileName, setFileName] = useState('');
    const [overrides, setOverrides] = useState<Record<string, number>>({});
    const confirmMutation = useConfirmCostBreakdownImport(projectId);

    const handleParsed = (result: CostBreakdownImportResult, name: string) => {
        setParseResult(result);
        setFileName(name);
        setOverrides({});
        confirmMutation.reset();
    };

    const derived = useMemo(() => {
        if (!parseResult) return null;
        try {
            const categoryDetermination = determineConstructionCategory(parseResult.majorWorkTypeTotals);
            const calculation = calculateSafetyBudgetAmount(parseResult.targetAmount, categoryDetermination.category);
            const riskWeights = deriveRiskWeights(parseResult.detailWorkItems, overrides);
            return { categoryDetermination, calculation, riskWeights, error: null as string | null };
        } catch (err) {
            return {
                categoryDetermination: null,
                calculation: null,
                riskWeights: null,
                error: err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.',
            };
        }
    }, [parseResult, overrides]);

    const handleConfirm = () => {
        if (!parseResult || !derived?.categoryDetermination || !derived.calculation || !derived.riskWeights) return;
        confirmMutation.mutate(
            {
                allocatedSafetyBudget: derived.calculation.amount,
                workPackages: derived.riskWeights.map((w) => ({ name: w.name, riskWeight: w.riskWeight })),
                calculationBasis: {
                    projectId,
                    sourceFileName: fileName,
                    targetAmount: parseResult.targetAmount,
                    constructionCategory: derived.categoryDetermination.category,
                    majorWorkType: derived.categoryDetermination.majorWorkType,
                    appliedRatePercent: derived.calculation.appliedRatePercent,
                    baseAmount: derived.calculation.baseAmount,
                    calculatedAmount: derived.calculation.amount,
                    calculatedAt: new Date().toISOString(),
                    calculatedBy: user?.email ?? 'unknown',
                },
            },
            {
                onSuccess: () => navigate(`/safety-budget/${projectId}`),
            }
        );
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
                <SafetyBudgetHeader projectId={projectId} projectName={project.name} activeTab="/import" />

                <CostBreakdownUploader onParsed={handleParsed} />

                {derived?.error && <p className="text-sm font-medium text-red-600 bg-red-50 rounded-xl px-4 py-3">{derived.error}</p>}

                {parseResult && derived?.categoryDetermination && derived.calculation && derived.riskWeights && (
                    <SafetyBudgetImportPreview
                        fileName={fileName}
                        targetAmount={parseResult.targetAmount}
                        categoryDetermination={derived.categoryDetermination}
                        calculation={derived.calculation}
                        riskWeights={derived.riskWeights}
                        overrides={overrides}
                        onOverrideChange={(code, coefficient) => setOverrides((prev) => ({ ...prev, [code]: coefficient }))}
                        onResetOverrides={() => setOverrides({})}
                        onConfirm={handleConfirm}
                        isConfirming={confirmMutation.isPending}
                        confirmError={confirmMutation.isError ? '반영 중 오류가 발생했습니다. 다시 시도해주세요.' : null}
                    />
                )}
            </div>
        </div>
    );
}

/** 내역서 가져오기 페이지 진입점. */
export default function SafetyBudgetImportPage() {
    const { siteId } = useParams<{ siteId: string }>();

    if (!siteId) {
        return <div className="min-h-screen flex items-center justify-center text-slate-400">현장을 선택해주세요.</div>;
    }

    return (
        <SafetyBudgetQueryProvider>
            <SafetyBudgetImportDashboard projectId={siteId} />
        </SafetyBudgetQueryProvider>
    );
}
