import { BUDGET_ITEM_CODE_LABELS } from '../config/constants';
import { hasWeakEvidence } from '../domain/evidence';
import type { AuditReadinessBreakdown } from '../domain/auditReadiness';
import type { Expense } from '../schemas/expense.schema';
import type { LedgerReconciliationResult } from '../domain/reconciliation';

interface AuditPrintReportProps {
    projectName: string;
    breakdown: AuditReadinessBreakdown;
    reconciliation: LedgerReconciliationResult;
    expenses: Expense[];
}

/** 감사 준비도 A4 1페이지 인쇄용 리포트. #print-area로 감싸 window.print()에서만 노출한다. */
export function AuditPrintReport({ projectName, breakdown, reconciliation, expenses }: AuditPrintReportProps) {
    const today = new Date().toISOString().slice(0, 10);

    return (
        <div className="p-6 text-black text-sm">
            <div className="text-center mb-6 border-b-2 border-black pb-3">
                <h1 className="text-2xl font-black mb-2">산안비 감사 준비도 리포트</h1>
                <div className="flex justify-between text-xs">
                    <span>현장명: {projectName}</span>
                    <span>작성일: {today}</span>
                    <span>감사 준비도: {breakdown.weightedScore.toFixed(1)}점</span>
                </div>
            </div>

            <div className="mb-5">
                <h2 className="font-bold border-b border-black mb-2 pb-1">1. 이중 원장 대사</h2>
                <table className="w-full border-collapse text-xs">
                    <tbody>
                        <tr className="border-b border-slate-300">
                            <td className="py-1 font-bold">계상액</td>
                            <td className="py-1 text-right">{reconciliation.allocated.toLocaleString()}원</td>
                            <td className="py-1 font-bold">집행액</td>
                            <td className="py-1 text-right">{reconciliation.executedTotal.toLocaleString()}원</td>
                        </tr>
                        <tr>
                            <td className="py-1 font-bold">미집행 잔액</td>
                            <td className="py-1 text-right">{reconciliation.unexecutedBalance.toLocaleString()}원</td>
                            <td className="py-1 font-bold">목적 외 의심</td>
                            <td className="py-1 text-right">{reconciliation.suspiciousOverageAmount.toLocaleString()}원</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mb-5">
                <h2 className="font-bold border-b border-black mb-2 pb-1">2. 감사 준비도 지표</h2>
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-slate-300 py-1">지표</th>
                            <th className="border border-slate-300 py-1">값</th>
                            <th className="border border-slate-300 py-1">가중치</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-slate-300 py-1 px-2">명세서 작성률(PTW/TBM 연결)</td>
                            <td className="border border-slate-300 py-1 text-center">{breakdown.documentationRate.toFixed(1)}%</td>
                            <td className="border border-slate-300 py-1 text-center">{(breakdown.weights.documentation * 100).toFixed(0)}%</td>
                        </tr>
                        <tr>
                            <td className="border border-slate-300 py-1 px-2">증빙 첨부율</td>
                            <td className="border border-slate-300 py-1 text-center">{breakdown.evidenceAttachmentRate.toFixed(1)}%</td>
                            <td className="border border-slate-300 py-1 text-center">{(breakdown.weights.evidenceAttachment * 100).toFixed(0)}%</td>
                        </tr>
                        <tr>
                            <td className="border border-slate-300 py-1 px-2">목적 외 의심 건수</td>
                            <td className="border border-slate-300 py-1 text-center">{breakdown.suspiciousCount}건</td>
                            <td className="border border-slate-300 py-1 text-center">{(breakdown.weights.suspiciousCount * 100).toFixed(0)}%</td>
                        </tr>
                        <tr>
                            <td className="border border-slate-300 py-1 px-2">소진율 편차</td>
                            <td className="border border-slate-300 py-1 text-center">{breakdown.deviationPct.toFixed(1)}%p</td>
                            <td className="border border-slate-300 py-1 text-center">{(breakdown.weights.deviationControl * 100).toFixed(0)}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div>
                <h2 className="font-bold border-b border-black mb-2 pb-1">3. PTW·TBM 연결 점검 항목</h2>
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-slate-300 py-1">일자</th>
                            <th className="border border-slate-300 py-1">비목</th>
                            <th className="border border-slate-300 py-1">금액</th>
                            <th className="border border-slate-300 py-1">PTW</th>
                            <th className="border border-slate-300 py-1">TBM</th>
                            <th className="border border-slate-300 py-1">증빙 상태</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map((e) => (
                            <tr key={e.id}>
                                <td className="border border-slate-300 py-1 text-center">{e.date.slice(0, 10)}</td>
                                <td className="border border-slate-300 py-1 px-2">{BUDGET_ITEM_CODE_LABELS[e.itemCode]}</td>
                                <td className="border border-slate-300 py-1 text-right px-2">{e.amount.toLocaleString()}원</td>
                                <td className="border border-slate-300 py-1 text-center">{e.ptwId ?? '-'}</td>
                                <td className="border border-slate-300 py-1 text-center">{e.tbmId ?? '-'}</td>
                                <td className="border border-slate-300 py-1 text-center">
                                    {hasWeakEvidence(e) ? '증빙 약함' : '양호'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
