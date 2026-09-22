import { AlertTriangle, RotateCcw } from 'lucide-react';
import type { ConstructionCategoryDetermination, SafetyBudgetCalculationResult } from '../domain/safetyBudgetCalculation';
import type { RiskWeightAllocationItem } from '../domain/riskWeightAllocation';

interface SafetyBudgetImportPreviewProps {
    fileName: string;
    targetAmount: number;
    categoryDetermination: ConstructionCategoryDetermination;
    calculation: SafetyBudgetCalculationResult;
    riskWeights: RiskWeightAllocationItem[];
    overrides: Record<string, number>;
    onOverrideChange: (code: string, coefficient: number) => void;
    onResetOverrides: () => void;
    onConfirm: () => void;
    isConfirming: boolean;
    confirmError?: string | null;
}

const currency = (n: number) => `${Math.round(n).toLocaleString()}원`;

export function SafetyBudgetImportPreview({
    fileName,
    targetAmount,
    categoryDetermination,
    calculation,
    riskWeights,
    overrides,
    onOverrideChange,
    onResetOverrides,
    onConfirm,
    isConfirming,
    confirmError,
}: SafetyBudgetImportPreviewProps) {
    const unmatchedCount = riskWeights.filter((r) => !r.matched).length;
    const hasOverrides = Object.keys(overrides).length > 0;

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-1">산안비 계상금액 (미리보기)</h3>
                <p className="text-xs text-slate-400 mb-6">파일: {fileName}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
                    <div>
                        <p className="text-xs text-slate-400 font-bold mb-1">대상액</p>
                        <p className="text-lg font-black text-slate-900">{currency(targetAmount)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold mb-1">공사종류</p>
                        <p className="text-lg font-black text-slate-900">{categoryDetermination.category}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold mb-1">적용 요율</p>
                        <p className="text-lg font-black text-slate-900">
                            {calculation.appliedRatePercent}%{calculation.baseAmount > 0 && ` + ${currency(calculation.baseAmount)}`}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold mb-1">계상금액</p>
                        <p className="text-lg font-black text-red-600">{currency(calculation.amount)}</p>
                    </div>
                </div>
                <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3">{categoryDetermination.rationale}</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-slate-900">세부공종별 위험가중치·산안비 배분 (미리보기)</h3>
                    <div className="flex items-center gap-2">
                        {unmatchedCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 rounded-full px-3 py-1">
                                <AlertTriangle size={14} /> 위험계수 매칭 실패 {unmatchedCount}건 — 확인 필요
                            </span>
                        )}
                        <button
                            onClick={onResetOverrides}
                            disabled={!hasOverrides}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-full px-3 py-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <RotateCcw size={14} /> 위험계수 초기화
                        </button>
                    </div>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                    위험계수는 법적 근거가 아닌 운영상 기준(KOSHA 재해통계 참고 초안)입니다. 매칭 실패 항목은 기본계수(1.0)가
                    적용되며, 계수를 직접 입력해 보정할 수 있습니다. 직접 수정한 값을 자동 산정값으로 되돌리려면 "위험계수
                    초기화"를 누르세요. 산안비 배분액은 계상금액 × 위험가중치로, 확정 시 저장되는 값이 아니라 참고용입니다.
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                                <th className="py-2 pr-4">공종</th>
                                <th className="py-2 pr-4">대공종</th>
                                <th className="py-2 pr-4 text-right">금액</th>
                                <th className="py-2 pr-4 text-right">위험계수</th>
                                <th className="py-2 pr-4 text-right">위험가중치</th>
                                <th className="py-2 pr-4 text-right">배분 산안비</th>
                            </tr>
                        </thead>
                        <tbody>
                            {riskWeights.map((item) => (
                                <tr key={item.code} className="border-b border-slate-50">
                                    <td className="py-2 pr-4 font-bold text-slate-800">
                                        {item.name}
                                        {!item.matched && <span className="ml-2 text-[10px] font-bold text-amber-600">미매칭</span>}
                                    </td>
                                    <td className="py-2 pr-4 text-slate-500">{item.discipline}</td>
                                    <td className="py-2 pr-4 text-right text-slate-700">{currency(item.amount)}</td>
                                    <td className="py-2 pr-4 text-right">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={overrides[item.code] ?? item.riskCoefficient}
                                            onChange={(e) => onOverrideChange(item.code, Number(e.target.value))}
                                            className={`w-20 text-right border rounded-lg px-2 py-1 ${
                                                item.matched ? 'border-slate-200' : 'border-amber-300 bg-amber-50'
                                            }`}
                                        />
                                    </td>
                                    <td className="py-2 pr-4 text-right font-bold text-slate-900">{(item.riskWeight * 100).toFixed(2)}%</td>
                                    <td className="py-2 pr-4 text-right font-bold text-red-600">{currency(item.riskWeight * calculation.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {confirmError && <p className="text-sm font-medium text-red-600 bg-red-50 rounded-xl px-4 py-3">{confirmError}</p>}

            <button
                onClick={onConfirm}
                disabled={isConfirming}
                className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
            >
                {isConfirming ? '반영 중...' : '확정 — 계상금액·위험가중치 반영'}
            </button>
        </div>
    );
}
