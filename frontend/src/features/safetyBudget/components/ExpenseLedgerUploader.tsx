import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { parseExpenseLedgerPdf } from '../services/expenseLedgerImportService';
import type { ParsedExpenseLedgerItem } from '../services/expenseLedgerImportService';

interface ExpenseLedgerUploaderProps {
    onParsed: (items: ParsedExpenseLedgerItem[], fileName: string) => void;
}

/** 산안비 사용내역서 PDF 업로드 → AI 분석까지 담당. 저장은 하지 않는다. */
export function ExpenseLedgerUploader({ onParsed }: ExpenseLedgerUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setIsParsing(true);
        try {
            const items = await parseExpenseLedgerPdf(file);
            if (items.length === 0) {
                setError('PDF에서 사용내역을 인식하지 못했습니다. 스캔 품질을 확인하거나 직접 입력해주세요.');
                return;
            }
            onParsed(items, file.name);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'PDF 분석 중 알 수 없는 오류가 발생했습니다.');
        } finally {
            setIsParsing(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-2">사용내역서 PDF 업로드</h3>
            <p className="text-sm text-slate-500 mb-6">
                현장에서 작성한 산업안전보건관리비 사용내역서(PDF)를 업로드하면 AI가 항목별 날짜·비목·금액을 읽어
                일괄 등록용 목록으로 만들어줍니다. 업로드만으로는 저장되지 않으며, 아래에서 검토·수정 후 등록해야
                반영됩니다.
            </p>
            <label className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm cursor-pointer hover:bg-slate-700 transition-colors">
                <Upload size={16} />
                {isParsing ? 'AI 분석 중...' : 'PDF 파일 선택'}
                <input ref={inputRef} type="file" accept=".pdf" onChange={handleFileChange} disabled={isParsing} className="hidden" />
            </label>
            {error && <p className="mt-4 text-sm font-medium text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
        </div>
    );
}
