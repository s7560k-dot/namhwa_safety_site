import { Fragment } from 'react';
import { calculateAllocatedAmount, groupWorkPackagesByDiscipline } from '../domain/budgetProposal';
import type { WorkPackage } from '../schemas/workPackage.schema';
import type { CalculationBasis } from '../schemas/calculationBasis.schema';

interface BudgetProposalPrintReportProps {
    projectName: string;
    allocatedSafetyBudget: number;
    calculationBasis: CalculationBasis | null;
    workPackages: readonly WorkPackage[];
    /** '전체'면 모든 공종, '단일'이면 선택된 공종 1개만 보여준다는 안내 문구용. */
    mode: 'ALL' | 'SINGLE';
}

const currency = (n: number) => `${Math.round(n).toLocaleString()}원`;

/** 산안비 예산 품의서 A4 인쇄용 리포트. #print-area로 감싸 window.print()에서만 노출한다. */
export function BudgetProposalPrintReport({
    projectName,
    allocatedSafetyBudget,
    calculationBasis,
    workPackages,
    mode,
}: BudgetProposalPrintReportProps) {
    const today = new Date().toISOString().slice(0, 10);
    const totalAllocated = workPackages.reduce((sum, wp) => sum + calculateAllocatedAmount(wp.riskWeight, allocatedSafetyBudget), 0);
    const disciplineGroups = groupWorkPackagesByDiscipline(workPackages);

    return (
        <div className="p-6 text-black text-sm">
            <div className="text-center mb-6 border-b-2 border-black pb-3">
                <h1 className="text-2xl font-black mb-2">산안비 실행예산 품의서</h1>
                <div className="flex justify-between text-xs">
                    <span>현장명: {projectName}</span>
                    <span>작성일: {today}</span>
                    <span>{mode === 'ALL' ? '전체 공종' : '공종 개별'}</span>
                </div>
            </div>

            <div className="mb-5">
                <h2 className="font-bold border-b border-black mb-2 pb-1">1. 계상 근거</h2>
                <table className="w-full border-collapse text-xs">
                    <tbody>
                        <tr className="border-b border-slate-300">
                            <td className="py-1 font-bold w-1/4">계상액</td>
                            <td className="py-1 text-right w-1/4">{currency(allocatedSafetyBudget)}</td>
                            <td className="py-1 font-bold w-1/4">공사종류</td>
                            <td className="py-1 text-right w-1/4">{calculationBasis?.constructionCategory ?? '-'}</td>
                        </tr>
                        <tr>
                            <td className="py-1 font-bold">대상액</td>
                            <td className="py-1 text-right">{calculationBasis ? currency(calculationBasis.targetAmount) : '-'}</td>
                            <td className="py-1 font-bold">적용 요율</td>
                            <td className="py-1 text-right">
                                {calculationBasis
                                    ? `${calculationBasis.appliedRatePercent}%${
                                          calculationBasis.baseAmount > 0 ? ` + ${currency(calculationBasis.baseAmount)}` : ''
                                      }`
                                    : '-'}
                            </td>
                        </tr>
                    </tbody>
                </table>
                {!calculationBasis && (
                    <p className="text-[10px] text-slate-500 mt-1">
                        * 내역서 가져오기로 계상한 이력이 없어 계상 근거를 표시할 수 없습니다. 계상액만 표시합니다.
                    </p>
                )}
            </div>

            <div>
                <h2 className="font-bold border-b border-black mb-2 pb-1">2. 공종별 위험가중 배분 내역</h2>
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-slate-300 py-1">공종</th>
                            <th className="border border-slate-300 py-1">위험가중치</th>
                            <th className="border border-slate-300 py-1">배분 산안비</th>
                        </tr>
                    </thead>
                    <tbody>
                        {disciplineGroups.map((group) => (
                            <Fragment key={group.discipline}>
                                <tr className="bg-gray-100">
                                    <td className="border border-slate-300 py-1 px-2 font-bold" colSpan={1}>
                                        {group.discipline} 소계 ({group.workPackages.length}건)
                                    </td>
                                    <td className="border border-slate-300 py-1 text-center font-bold">{(group.riskWeight * 100).toFixed(2)}%</td>
                                    <td className="border border-slate-300 py-1 text-right px-2 font-bold">
                                        {currency(calculateAllocatedAmount(group.riskWeight, allocatedSafetyBudget))}
                                    </td>
                                </tr>
                                {group.workPackages.map((wp) => (
                                    <tr key={wp.id}>
                                        <td className="border border-slate-300 py-1 px-2 pl-5">{wp.name}</td>
                                        <td className="border border-slate-300 py-1 text-center">{(wp.riskWeight * 100).toFixed(2)}%</td>
                                        <td className="border border-slate-300 py-1 text-right px-2">
                                            {currency(calculateAllocatedAmount(wp.riskWeight, allocatedSafetyBudget))}
                                        </td>
                                    </tr>
                                ))}
                            </Fragment>
                        ))}
                        <tr className="font-bold bg-gray-50">
                            <td className="border border-slate-300 py-1 px-2">총합계</td>
                            <td className="border border-slate-300 py-1 text-center">
                                {(workPackages.reduce((sum, wp) => sum + wp.riskWeight, 0) * 100).toFixed(2)}%
                            </td>
                            <td className="border border-slate-300 py-1 text-right px-2">{currency(totalAllocated)}</td>
                        </tr>
                    </tbody>
                </table>
                <p className="text-[10px] text-slate-500 mt-2">
                    * 공종별 배분 금액은 내역서 기반 위험가중 공정률에 따라 자동 산정된 참고 금액이며, 법적 계상 기준이 아닙니다.
                </p>
            </div>
        </div>
    );
}
