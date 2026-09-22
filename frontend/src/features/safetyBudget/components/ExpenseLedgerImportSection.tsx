import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { ExpenseLedgerUploader } from './ExpenseLedgerUploader';
import { ExpenseLedgerImportPreview } from './ExpenseLedgerImportPreview';
import type { EditableLedgerRow } from './ExpenseLedgerImportPreview';
import { useAddExpensesBulk } from '../hooks/useSafetyBudgetData';
import { matchItemLabelToBudgetCode } from '../domain/expenseLedgerMatching';
import type { ParsedExpenseLedgerItem } from '../services/expenseLedgerImportService';
import type { ExpenseInput } from '../schemas/expense.schema';
import type { BudgetItemCode } from '../config/constants';

interface ExpenseLedgerImportSectionProps {
    projectId: string;
    createdBy: string;
    onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

function toEditableRows(items: ParsedExpenseLedgerItem[]): EditableLedgerRow[] {
    return items.map((item, idx) => {
        const itemCode = matchItemLabelToBudgetCode(item.itemLabel);
        return {
            key: `${idx}-${item.date ?? ''}-${item.amount}`,
            date: item.date ?? today(),
            itemCode: itemCode ?? '',
            description: item.description ?? '',
            amount: item.amount,
            matched: itemCode !== null,
            evidenceDocumentFound: item.evidenceDocumentFound,
            evidenceDocumentType: item.evidenceDocumentType,
        };
    });
}

/** 산안비 사용내역서 PDF 업로드부터 일괄 등록까지 담당하는 패널. 현황 대시보드에서 토글로 열고 닫는다. */
export function ExpenseLedgerImportSection({ projectId, createdBy, onClose }: ExpenseLedgerImportSectionProps) {
    const [fileName, setFileName] = useState('');
    const [rows, setRows] = useState<EditableLedgerRow[] | null>(null);
    const bulkMutation = useAddExpensesBulk(projectId, createdBy);

    const handleParsed = (items: ParsedExpenseLedgerItem[], name: string) => {
        setFileName(name);
        setRows(toEditableRows(items));
        bulkMutation.reset();
    };

    const handleReset = () => {
        setRows(null);
        setFileName('');
        bulkMutation.reset();
    };

    const handleRowChange = (key: string, patch: Partial<EditableLedgerRow>) => {
        setRows((prev) => prev?.map((r) => (r.key === key ? { ...r, ...patch } : r)) ?? null);
    };

    const handleRemoveRow = (key: string) => {
        setRows((prev) => prev?.filter((r) => r.key !== key) ?? null);
    };

    const handleSubmit = () => {
        if (!rows) return;
        const inputs: ExpenseInput[] = rows.map((r) => ({
            projectId,
            date: r.date,
            amount: r.amount,
            itemCode: r.itemCode as BudgetItemCode,
        }));
        bulkMutation.mutate(inputs, {
            onSuccess: (results) => {
                setRows((prev) => prev?.map((r, i) => ({ ...r, result: results[i] })) ?? null);
            },
        });
    };

    return (
        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">사용내역서 PDF로 일괄 등록</h3>
                <div className="flex items-center gap-2">
                    {rows && (
                        <button
                            onClick={handleReset}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-full px-3 py-1"
                        >
                            <RotateCcw size={14} /> 다른 파일 업로드
                        </button>
                    )}
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {!rows && <ExpenseLedgerUploader onParsed={handleParsed} />}

            {rows && (
                <ExpenseLedgerImportPreview
                    fileName={fileName}
                    rows={rows}
                    onRowChange={handleRowChange}
                    onRemoveRow={handleRemoveRow}
                    onSubmit={handleSubmit}
                    isSubmitting={bulkMutation.isPending}
                    submitError={bulkMutation.isError ? '등록 중 오류가 발생했습니다. 다시 시도해주세요.' : null}
                />
            )}
        </div>
    );
}
