import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { readWorkbookFromFile, parseWorkbookForImport } from '../domain/costBreakdownImport';
import type { CostBreakdownImportResult } from '../domain/costBreakdownImport';

interface CostBreakdownUploaderProps {
    onParsed: (result: CostBreakdownImportResult, fileName: string) => void;
}

/** 내역서 엑셀(.xlsx) 업로드 → 파싱까지 담당. 저장은 하지 않는다. */
export function CostBreakdownUploader({ onParsed }: CostBreakdownUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setIsParsing(true);
        try {
            const workbook = await readWorkbookFromFile(file);
            const result = parseWorkbookForImport(workbook);
            onParsed(result, file.name);
        } catch (err) {
            setError(err instanceof Error ? err.message : '내역서 파싱 중 알 수 없는 오류가 발생했습니다.');
        } finally {
            setIsParsing(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-2">내역서 업로드</h3>
            <p className="text-sm text-slate-500 mb-6">
                표준 견적프로그램(전산세람 등) 산출물 엑셀(.xlsx)을 업로드하면 대상액·산안비 계상금액·공종별 위험가중치를
                자동으로 산정합니다. 업로드만으로는 저장되지 않으며, 미리보기에서 검토 후 확정해야 반영됩니다.
            </p>
            <label className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm cursor-pointer hover:bg-slate-700 transition-colors">
                <Upload size={16} />
                {isParsing ? '분석 중...' : '엑셀 파일 선택'}
                <input ref={inputRef} type="file" accept=".xlsx" onChange={handleFileChange} disabled={isParsing} className="hidden" />
            </label>
            {error && <p className="mt-4 text-sm font-medium text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
        </div>
    );
}
