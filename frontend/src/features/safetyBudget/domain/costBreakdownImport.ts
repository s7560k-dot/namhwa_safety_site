import * as XLSX from 'xlsx';

/** 내역서에서 추출한 대공종(건축/토목/기계설비/철탑/전기/통신/소방 등) 합계. */
export interface MajorWorkTypeTotal {
    code: string;
    name: string;
    amount: number;
}

/** 내역서에서 추출한 세부공종(철근콘크리트공사, 철골공사 등) 합계. 위험가중 분배의 입력값. */
export interface DetailWorkItem {
    /** 세부공종이 속한 대공종 시트 이름에서 유추한 분류 (예: "건축", "토목"). */
    discipline: string;
    code: string;
    name: string;
    amount: number;
}

export interface CostBreakdownImportResult {
    /** 산안비 계상 대상액 (재료비 + 직접노무비). */
    targetAmount: number;
    majorWorkTypeTotals: MajorWorkTypeTotal[];
    detailWorkItems: DetailWorkItem[];
}

interface ParsedCodeRow {
    code: string;
    name: string;
    amount: number;
    rowIndex: number;
}

const TOTAL_ROW_MARKER = '[ 합           계 ]';
/** "품명" 컬럼에서 선행 코드(숫자)와 이름을 분리한다. 코드 뒤의 "N) " 번호 매김은 이름에서 제거한다. */
const CODE_NAME_PATTERN = /^(\d+)\s+(.+)$/;

function normalizeWorkTypeLabel(raw: string): string {
    return raw
        .replace(/^\d+\)\s*/, '') // "1) 골프연습장" → "골프연습장"
        .replace(/\s+/g, ''); // 내부 공백 전부 제거 (표시 스타일이 셀마다 다름)
}

/**
 * "집계" 스타일 시트(총괄집계, OO(집))의 데이터 행을 파싱한다.
 * 품명(col1)에서 코드+이름을 분리하고, 합계금액(col12, 0-based index 11)을 금액으로 취한다.
 * 헤더(3~4행)를 제외한 5행(0-based index 4)부터, 빈 행이나 합계 마커를 만나면 중단한다.
 */
function parseCodeRows(sheet: XLSX.WorkSheet): ParsedCodeRow[] {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    const result: ParsedCodeRow[] = [];

    for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        const label = row?.[0];
        if (typeof label !== 'string' || label.trim() === '' || label.trim() === TOTAL_ROW_MARKER.trim()) {
            continue;
        }
        const match = CODE_NAME_PATTERN.exec(label.trim());
        if (!match) {
            continue;
        }
        const [, code, rawName] = match;
        const amount = Number(row[11]) || 0;
        result.push({ code, name: normalizeWorkTypeLabel(rawName), amount, rowIndex: i });
    }

    return result;
}

/**
 * 코드 트리에서 자식이 없는(리프) 행만 "세부공종"으로 취급한다.
 * 집계표는 깊이 우선(preorder) 순서로 정렬돼 있으므로, 바로 다음 행이 더 긴(깊은) 코드이면 자식이 있는 것으로 판단한다.
 * 문자열 접두어(startsWith) 비교 대신 이 방식을 쓰는 이유: 실제 견적프로그램 산출물에서 상위 코드와 하위 코드의
 * 자릿수 규칙이 항상 일관되지 않는 경우가 있어(예: "0102 토목공사"의 하위 항목이 "0103xxxx"로 채번된 사례),
 * 접두어 매칭만으로는 상위 항목이 리프로 오인되어 하위 항목과 금액이 중복 집계될 수 있다. 위치 기반 판단은 이런
 * 채번 불일치에 영향받지 않는다.
 */
function selectLeafRows(rows: ParsedCodeRow[]): ParsedCodeRow[] {
    return rows.filter((row, idx) => {
        const next = rows[idx + 1];
        return !next || next.code.length <= row.code.length;
    });
}

function findSheet(workbook: XLSX.WorkBook, name: string): XLSX.WorkSheet | undefined {
    return workbook.Sheets[name];
}

/** 시트명이 "OO(집)" 형태인 대공종별 집계 시트 이름 목록 ("총괄집계"는 제외). */
function findMajorWorkTypeSheetNames(workbook: XLSX.WorkBook): string[] {
    return workbook.SheetNames.filter((name) => /\(집\)\s*$/.test(name));
}

/**
 * 내역서 워크북에서 대상액, 대공종별 합계, 세부공종별 합계를 추출한다.
 * @throws {Error} 필수 시트("총괄집계")를 찾을 수 없을 때
 */
export function parseWorkbookForImport(workbook: XLSX.WorkBook): CostBreakdownImportResult {
    const summarySheet = findSheet(workbook, '총괄집계');
    if (!summarySheet) {
        throw new Error('"총괄집계" 시트를 찾을 수 없습니다. 표준 견적프로그램 내역서 양식인지 확인해주세요.');
    }

    const summaryRows = XLSX.utils.sheet_to_json<unknown[]>(summarySheet, { header: 1, defval: null });
    const grandTotalRow = summaryRows[4];
    if (!grandTotalRow) {
        throw new Error('"총괄집계" 시트에서 합계 행을 찾을 수 없습니다.');
    }
    const materialCost = Number(grandTotalRow[5]) || 0;
    const laborCost = Number(grandTotalRow[7]) || 0;
    const targetAmount = materialCost + laborCost;

    const majorWorkTypeTotals: MajorWorkTypeTotal[] = parseCodeRows(summarySheet)
        .filter((row) => row.code.length > 2) // 최상위 프로젝트 총계 행(2자리 코드) 제외
        .map(({ code, name, amount }) => ({ code, name, amount }));

    const detailWorkItems: DetailWorkItem[] = [];
    for (const sheetName of findMajorWorkTypeSheetNames(workbook)) {
        const sheet = workbook.Sheets[sheetName];
        const rows = parseCodeRows(sheet);
        const leaves = selectLeafRows(rows);
        const discipline = sheetName.replace(/\(집\)\s*$/, '');
        for (const leaf of leaves) {
            detailWorkItems.push({ discipline, code: leaf.code, name: leaf.name, amount: leaf.amount });
        }
    }

    return { targetAmount, majorWorkTypeTotals, detailWorkItems };
}

/** 브라우저에서 업로드한 File을 워크북으로 읽는다. */
export async function readWorkbookFromFile(file: File): Promise<XLSX.WorkBook> {
    const buffer = await file.arrayBuffer();
    return XLSX.read(buffer, { type: 'array' });
}
