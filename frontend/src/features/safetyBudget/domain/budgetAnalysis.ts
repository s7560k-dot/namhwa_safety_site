import { calculateWeightedProgress } from './weightedProgress';
import { getTargetCumulativeExecutionRate, calculateDeviation, getAlertLevel } from './sCurve';
import { reconcileLedger } from './reconciliation';
import type { LedgerReconciliationResult } from './reconciliation';
import type { WorkPackage } from '../schemas/workPackage.schema';
import type { Project } from '../schemas/project.schema';
import type { Expense } from '../schemas/expense.schema';
import type { AlertLevel } from '../config/constants';

export interface BudgetAnalysisData {
    weightedProgressPct: number;
    reconciliation: LedgerReconciliationResult;
    actualCumulativeExecutionPct: number;
    targetCumulativeExecutionPct: number;
    deviationPct: number;
    alertLevel: AlertLevel;
}

export type BudgetAnalysisResult = { ok: true; data: BudgetAnalysisData } | { ok: false; error: string };

/**
 * 대시보드(F1+F2)와 감사 준비도(F11)가 공통으로 쓰는 분석 계산.
 * 공종 위험 가중치 합이 잘못된 경우 계산을 거부하고 에러 메시지를 반환한다.
 */
export function computeBudgetAnalysis(
    project: Project,
    workPackages: readonly WorkPackage[],
    expenses: readonly Expense[]
): BudgetAnalysisResult {
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
}
