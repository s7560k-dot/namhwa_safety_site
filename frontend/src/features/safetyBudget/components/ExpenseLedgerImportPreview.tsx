import { AlertTriangle, Trash2, FileCheck2 } from 'lucide-react';
import { ELIGIBLE_ITEM_CODES, BUDGET_ITEM_CODE_LABELS } from '../config/constants';
import type { BudgetItemCode } from '../config/constants';
import type { AddExpenseResult } from '../services/expenseService';

export interface EditableLedgerRow {
    key: string;
    date: string;
    itemCode: BudgetItemCode | '';
    description: string;
    amount: number;
    /** AI가 추출한 itemLabel이 비목 코드에 정확히 매칭됐는지 여부. false면 사용자가 직접 선택해야 한다. */
    matched: boolean;
    /** PDF 내에 날짜·금액이 일치하는 증빙 문서(세금계산서 등)가 첨부되어 있는지 AI가 확인한 결과. */
    evidenceDocumentFound: boolean;
    evidenceDocumentType: string | null;
    result?: AddExpenseResult;
}

interface ExpenseLedgerImportPreviewProps {
    fileName: string;
    rows: EditableLedgerRow[];
    onRowChange: (key: string, patch: Partial<EditableLedgerRow>) => void;
    onRemoveRow: (key: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    submitError?: string | null;
}

const currency = (n: number) => `${Math.round(n).toLocaleString()}원`;

export function ExpenseLedgerImportPreview({
    fileName,
    rows,
    onRowChange,
    onRemoveRow,
    onSubmit,
    isSubmitting,
    submitError,
}: ExpenseLedgerImportPreviewProps) {
    const unmatchedCount = rows.filter((r) => !r.matched).length;
    const noEvidenceCount = rows.filter((r) => !r.evidenceDocumentFound).length;
    const hasUnselected = rows.some((r) => r.itemCode === '');
    const hasSubmitted = rows.some((r) => r.result);
    const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);
    const approvedCount = rows.filter((r) => r.result?.status === 'APPROVED').length;
    const rejectedCount = rows.filter((r) => r.result?.status === 'REJECTED').length;

    return (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <h3 className="text-xl font-black text-slate-900">사용내역 미리보기 ({rows.length}건)</h3>
                <div className="flex items-center gap-2">
                    {unmatchedCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 rounded-full px-3 py-1">
                            <AlertTriangle size={14} /> 비목 매칭 실패 {unmatchedCount}건 — 직접 선택 필요
                        </span>
                    )}
                    {noEvidenceCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 rounded-full px-3 py-1">
                            <FileCheck2 size={14} /> PDF 내 증빙 미확인 {noEvidenceCount}건
                        </span>
                    )}
                </div>
            </div>
            <p className="text-xs text-slate-400 mb-4">
                파일: {fileName}. 증빙 확인 여부는 PDF에 첨부된 세금계산서 등을 AI가 대조한 참고 정보이며, 등록을 막지는
                않습니다. 등록된 지출의 "증빙 링크"는 별도이므로, 감사 대응이 필요하면 실제 링크도 첨부해주세요.
            </p>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                            <th className="py-2 pr-4">날짜</th>
                            <th className="py-2 pr-4">비목</th>
                            <th className="py-2 pr-4">사용 내용</th>
                            <th className="py-2 pr-4 text-right">금액</th>
                            <th className="py-2 pr-4">PDF 내 증빙</th>
                            <th className="py-2 pr-4">결과</th>
                            <th className="py-2 pr-4" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.key} className="border-b border-slate-50">
                                <td className="py-2 pr-4">
                                    <input
                                        type="date"
                                        value={row.date}
                                        onChange={(e) => onRowChange(row.key, { date: e.target.value })}
                                        className="border border-slate-200 rounded-lg px-2 py-1 text-xs"
                                    />
                                </td>
                                <td className="py-2 pr-4">
                                    <select
                                        value={row.itemCode}
                                        onChange={(e) => onRowChange(row.key, { itemCode: e.target.value as BudgetItemCode })}
                                        className={`border rounded-lg px-2 py-1 text-xs ${
                                            row.matched ? 'border-slate-200' : 'border-amber-300 bg-amber-50'
                                        }`}
                                    >
                                        {row.itemCode === '' && <option value="">비목 선택</option>}
                                        {ELIGIBLE_ITEM_CODES.map((code) => (
                                            <option key={code} value={code}>
                                                {BUDGET_ITEM_CODE_LABELS[code]}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="py-2 pr-4 text-slate-700">
                                    <input
                                        type="text"
                                        value={row.description}
                                        onChange={(e) => onRowChange(row.key, { description: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs"
                                    />
                                </td>
                                <td className="py-2 pr-4 text-right">
                                    <input
                                        type="number"
                                        min="1"
                                        value={row.amount}
                                        onChange={(e) => onRowChange(row.key, { amount: Number(e.target.value) })}
                                        className="w-28 text-right border border-slate-200 rounded-lg px-2 py-1 text-xs"
                                    />
                                </td>
                                <td className="py-2 pr-4">
                                    {row.evidenceDocumentFound ? (
                                        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                                            {row.evidenceDocumentType ?? '확인됨'}
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-400">
                                            미확인
                                        </span>
                                    )}
                                </td>
                                <td className="py-2 pr-4">
                                    {row.result && (
                                        <span
                                            className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                                                row.result.status === 'APPROVED'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-red-50 text-red-600'
                                            }`}
                                            title={row.result.status === 'REJECTED' ? row.result.reason : undefined}
                                        >
                                            {row.result.status === 'APPROVED' ? '등록됨' : '반려'}
                                        </span>
                                    )}
                                </td>
                                <td className="py-2 pr-4 text-right">
                                    {!hasSubmitted && (
                                        <button onClick={() => onRemoveRow(row.key)} className="text-slate-300 hover:text-red-600">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-200">
                            <td className="py-3 pr-4 font-black text-slate-900" colSpan={3}>
                                합계 ({rows.length}건)
                            </td>
                            <td className="py-3 pr-4 text-right font-black text-slate-900">{currency(totalAmount)}</td>
                            <td className="py-3 pr-4 text-xs text-slate-500" colSpan={3}>
                                {hasSubmitted && `승인 ${approvedCount}건 / 반려 ${rejectedCount}건`}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {submitError && <p className="mt-4 text-sm font-medium text-red-600 bg-red-50 rounded-xl px-4 py-3">{submitError}</p>}

            {!hasSubmitted && (
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting || hasUnselected || rows.length === 0}
                    className="mt-6 px-6 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? '등록 중...' : hasUnselected ? '비목을 모두 선택해주세요' : `일괄 등록 (${rows.length}건)`}
                </button>
            )}
        </div>
    );
}
