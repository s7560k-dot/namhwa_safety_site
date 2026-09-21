import React, { useState } from 'react';
import { ELIGIBLE_ITEM_CODES, BUDGET_ITEM_CODE_LABELS } from '../config/constants';
import type { BudgetItemCode } from '../config/constants';
import type { Subcontractor } from '../schemas/subcontractor.schema';
import type { ExpenseInput } from '../schemas/expense.schema';

interface ExpenseRegistrationFormProps {
    projectId: string;
    subcontractors: Subcontractor[];
    onSubmit: (input: ExpenseInput) => void;
    isSubmitting: boolean;
}

/** 집행 등록 폼. 제출 시 적격성 판정은 서비스 계층에서 수행하고, 그 결과에 따라 상위에서 모달을 띄운다. */
export function ExpenseRegistrationForm({ projectId, subcontractors, onSubmit, isSubmitting }: ExpenseRegistrationFormProps) {
    const [itemCode, setItemCode] = useState<BudgetItemCode>(ELIGIBLE_ITEM_CODES[0]);
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [subcontractorId, setSubcontractorId] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState('');
    const [ptwId, setPtwId] = useState('');
    const [tbmId, setTbmId] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = Number(amount);
        if (!parsedAmount || parsedAmount <= 0) return;

        onSubmit({
            projectId,
            date,
            amount: parsedAmount,
            itemCode,
            subcontractorId: subcontractorId || undefined,
            evidenceUrl: evidenceUrl || undefined,
            ptwId: ptwId || undefined,
            tbmId: tbmId || undefined,
        });
        setAmount('');
        setEvidenceUrl('');
        setPtwId('');
        setTbmId('');
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-5">
            <h3 className="text-xl font-black text-slate-900">집행 등록</h3>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">비목</label>
                <select
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value as BudgetItemCode)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                >
                    {ELIGIBLE_ITEM_CODES.map((code) => (
                        <option key={code} value={code}>
                            {BUDGET_ITEM_CODE_LABELS[code]}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">금액(원)</label>
                    <input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="w-full border border-slate-200 rounded-xl px-4 py-3"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">집행일자</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="w-full border border-slate-200 rounded-xl px-4 py-3"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">협력사 (선택)</label>
                <select
                    value={subcontractorId}
                    onChange={(e) => setSubcontractorId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                >
                    <option value="">해당 없음</option>
                    {subcontractors.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                            {sc.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">증빙 링크 (선택)</label>
                <input
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">PTW ID (선택)</label>
                    <input
                        type="text"
                        value={ptwId}
                        onChange={(e) => setPtwId(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">TBM ID (선택)</label>
                    <input
                        type="text"
                        value={tbmId}
                        onChange={(e) => setTbmId(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 text-white font-bold rounded-xl py-3 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
                {isSubmitting ? '등록 중...' : '등록'}
            </button>
        </form>
    );
}
