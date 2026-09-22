// Firebase Hosting의 60초 타임아웃 제한을 피하기 위해 클라우드 함수의 직접 URL을 호출한다 (FloorPlanTo3DApp.jsx와 동일 패턴).
const CLOUD_FUNCTION_URL = 'https://us-central1-namhwa-safety-dashboard.cloudfunctions.net/parse_expense_ledger_pdf';

export interface ParsedExpenseLedgerItem {
    date: string | null;
    itemLabel: string | null;
    description: string;
    amount: number;
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error('파일을 읽는 중 오류가 발생했습니다.'));
        reader.readAsDataURL(file);
    });
}

/**
 * 산업안전보건관리비 사용내역서 PDF를 서버(Gemini)로 보내 항목별 사용내역을 구조화된 목록으로 추출한다.
 * 저장은 하지 않으며, 결과는 호출한 쪽에서 검토 후 등록해야 한다.
 */
export async function parseExpenseLedgerPdf(file: File): Promise<ParsedExpenseLedgerItem[]> {
    const pdfBase64 = await readFileAsDataUrl(file);

    const response = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64 }),
    });

    const responseText = await response.text();
    let parsed: unknown;
    try {
        parsed = JSON.parse(responseText);
    } catch {
        throw new Error('서버 응답을 해석할 수 없습니다.');
    }

    const result = parsed as { success?: boolean; detail?: string; data?: { items?: ParsedExpenseLedgerItem[] } };
    if (!response.ok || !result.success) {
        throw new Error(result.detail ?? 'PDF 분석에 실패했습니다.');
    }

    return result.data?.items ?? [];
}
