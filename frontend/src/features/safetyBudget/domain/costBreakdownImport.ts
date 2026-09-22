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
    /**
     * 대공종별 대상액(재료비+노무비). key는 DetailWorkItem.discipline과 동일한 표기(시트명에서 유추, 예: "건축").
     * 원가계산서(원가(건축)/원가(토목)/... 시트)가 대공종별 산안비를 이 금액 비례로 나누는 것과 동일한 기준이라,
     * 산안비 위험가중 배분의 1단계(대공종 간 배분)를 이 금액 비례로 맞추는 데 쓴다.
     */
    disciplineTargetAmounts: Record<string, number>;
}

interface ParsedCodeRow {
    code: string;
    name: string;
    amount: number;
    materialAmount: number;
    laborAmount: number;
    rowIndex: number;
}

/** "품명" 컬럼에서 선행 코드(숫자)와 이름을 분리한다. 코드 뒤의 "N) " 번호 매김은 이름에서 제거한다. */
const CODE_NAME_PATTERN = /^(\d+)\s+(.+)$/;

interface SheetLayout {
    /** null이면 nameColIndex 셀 하나에서 CODE_NAME_PATTERN으로 코드+이름을 함께 뽑는다(표준 레이아웃). */
    codeColIndex: number | null;
    nameColIndex: number;
    amountColOffset: number;
}

/**
 * 시트별 컬럼 배치. 실사용 파일에서 전기(집)/통신(집)처럼 전문공종 견적프로그램이 완전히 다른 컬럼 배치
 * (번호·공종코드가 별도 컬럼으로 분리되고, 품명도 "0105 전기공사"(최상위 행)와 "1-1. 전력간선설비공사"
 * (하위 항목, 코드 접두어 없음) 형태가 섞여 있음)를 쓰는 경우가 실제로 확인됐다. 시트마다 다를 수 있어
 * 하나로 단정하지 않고 여러 배치를 모두 시도해 가장 많은 행을 뽑아낸 배치를 채택한다.
 */
const SHEET_LAYOUTS: SheetLayout[] = [
    { codeColIndex: null, nameColIndex: 0, amountColOffset: 0 }, // 표준: 코드+품명이 1번째 컬럼에 결합 (총괄집계, 건축(집)/토목(집)/기계(집)/철탑(집)/소방(집) 등)
    { codeColIndex: 1, nameColIndex: 3, amountColOffset: 2 }, // 전문공종형: 공종코드(2번째)·품명(4번째) 컬럼이 분리 (전기(집)/통신(집) 등)
];

function normalizeWorkTypeLabel(raw: string): string {
    return raw
        .replace(/^\d+\)\s*/, '') // "1) 골프연습장" → "골프연습장"
        .replace(/\s+/g, ''); // 내부 공백 전부 제거 (표시 스타일이 셀마다 다름)
}

/**
 * "[ 합    계 ]", "( 합    계 )" 같은 합계 마커 행인지 판단한다.
 * 표준 레이아웃(코드+품명 결합)에서는 이런 마커가 숫자로 시작하지 않아 CODE_NAME_PATTERN에 애초에 안 걸리지만,
 * 코드·품명이 분리된 레이아웃(전기(집)/통신(집) 등)에서는 품명 컬럼에 이 마커가 단독으로 들어있고 코드
 * 컬럼엔 그 대공종의 최상위 코드가 (총계 행과) 똑같이 재사용되는 경우가 실제로 확인됐다 — 그대로 두면
 * 최상위 총계가 세부공종인 것처럼 중복 집계된다.
 */
function isTotalMarkerLabel(text: string): boolean {
    return /^[[(（]\s*합\s*계\s*[)\])）]$/.test(text.trim());
}

function parseRowsWithLayout(rows: readonly unknown[][], layout: SheetLayout): ParsedCodeRow[] {
    const result: ParsedCodeRow[] = [];

    for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        let code: string;
        let rawName: string;

        if (layout.codeColIndex === null) {
            const label = row?.[layout.nameColIndex];
            if (typeof label !== 'string' || label.trim() === '') {
                continue;
            }
            const match = CODE_NAME_PATTERN.exec(label.trim());
            if (!match) {
                continue;
            }
            [, code, rawName] = match;
        } else {
            const codeCell = row?.[layout.codeColIndex];
            const nameCell = row?.[layout.nameColIndex];
            if (typeof codeCell !== 'string' && typeof codeCell !== 'number') {
                continue;
            }
            const codeStr = String(codeCell).trim();
            // 코드 컬럼이 분리된 레이아웃에서는 "공종줄" 같은 섹션 구분용 문자열이 코드 컬럼에 들어있는
            // 행이 실제로 존재한다(전기(집) 등). 실제 공종 코드는 항상 숫자이므로, 숫자가 아니면 건너뛴다 —
            // 그렇지 않으면 이 구분 행이 코드 트리 깊이 판단(selectLeafRows)에 끼어들어 바로 앞 총계 행을
            // 리프로 잘못 인식시킨다.
            if (codeStr === '' || !/^\d+$/.test(codeStr) || typeof nameCell !== 'string' || nameCell.trim() === '') {
                continue;
            }
            code = codeStr;
            rawName = nameCell.trim();
        }

        if (isTotalMarkerLabel(rawName)) {
            continue;
        }

        const materialAmount = Number(row[5 + layout.amountColOffset]) || 0;
        const laborAmount = Number(row[7 + layout.amountColOffset]) || 0;
        const amount = Number(row[11 + layout.amountColOffset]) || 0;
        result.push({ code, name: normalizeWorkTypeLabel(rawName), amount, materialAmount, laborAmount, rowIndex: i });
    }

    return result;
}

/**
 * "집계" 스타일 시트(총괄집계, OO(집))의 데이터 행을 파싱한다. 헤더를 제외한 5행(0-based index 4)부터 읽는다.
 * 컬럼 배치가 다른 시트(SHEET_LAYOUTS)를 모두 시도해, 가장 많은 행을 뽑아낸 배치를 채택한다 — 표준 레이아웃이
 * 아닌 시트에서 표준 레이아웃으로 시도하면 최상위 총계 행 정도만 우연히 걸리고 나머지는 다 빠지기 때문에,
 * "결과가 있으면 채택"이 아니라 "가장 많이 뽑히는 배치를 채택"해야 한다.
 */
function parseCodeRows(sheet: XLSX.WorkSheet): ParsedCodeRow[] {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });

    let best: ParsedCodeRow[] = [];
    for (const layout of SHEET_LAYOUTS) {
        const parsed = parseRowsWithLayout(rows, layout);
        if (parsed.length > best.length) {
            best = parsed;
        }
    }
    return best;
}

/**
 * "OO(집)" 시트에서 그 대공종 전체를 나타내는 행을 찾는다: 그 시트에서 코드 길이가 가장 짧은(가장 얕은) 행.
 *
 * "총괄집계" 시트의 2자리 "01" 행은 프로젝트 전체 총계라 제외해야 하지만("majorWorkTypeTotals" 파싱 참고),
 * 개별 "OO(집)" 시트의 2자리 "01" 행은 의미가 다르다 — 그 시트(그 대공종) 전체의 총계다(예: "건축(집)"의
 * "01 동구 소태동...공사" 행 금액은 원가(건축) 시트의 재료비+직접노무비와 정확히 일치). 반대로 "철탑(집)"처럼
 * "01" 행 없이 4자리("0104")부터 시작하는 시트도 있다. 그래서 2자리를 무조건 제외하면 안 되고, 그 시트에서
 * 가장 얕은 행을 그대로 그 대공종의 총계로 봐야 한다 — 실제로 "01" 없이 4자리 코드가 여러 형제로 나뉜
 * 시트(예: "토목(집)"의 0102+0103)에서 4자리 중 하나만 고르면 나머지 형제 금액이 누락된다.
 */
function findDisciplineTotalRow(rows: readonly ParsedCodeRow[]): ParsedCodeRow | undefined {
    if (rows.length === 0) {
        return undefined;
    }
    return rows.reduce((shortest, row) => (row.code.length < shortest.code.length ? row : shortest));
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
    const disciplineTargetAmounts: Record<string, number> = {};
    for (const sheetName of findMajorWorkTypeSheetNames(workbook)) {
        const sheet = workbook.Sheets[sheetName];
        const rows = parseCodeRows(sheet);
        const leaves = selectLeafRows(rows);
        const discipline = sheetName.replace(/\(집\)\s*$/, '');
        for (const leaf of leaves) {
            detailWorkItems.push({ discipline, code: leaf.code, name: leaf.name, amount: leaf.amount });
        }

        const disciplineTotalRow = findDisciplineTotalRow(rows);
        if (disciplineTotalRow) {
            disciplineTargetAmounts[discipline] = disciplineTotalRow.materialAmount + disciplineTotalRow.laborAmount;
        }
    }

    return { targetAmount, majorWorkTypeTotals, detailWorkItems, disciplineTargetAmounts };
}

/** 브라우저에서 업로드한 File을 워크북으로 읽는다. */
export async function readWorkbookFromFile(file: File): Promise<XLSX.WorkBook> {
    const buffer = await file.arrayBuffer();
    return XLSX.read(buffer, { type: 'array' });
}
