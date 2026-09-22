import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseWorkbookForImport } from '../domain/costBreakdownImport';

/** 열 순서: 품명,규격,단위,수량,재료비단가,재료비금액,노무비단가,노무비금액,경비단가,경비금액,합계단가,합계금액,비고 */
function row(label: string, materialAmount: number, laborAmount: number, totalAmount: number): unknown[] {
    return [label, '', '', 1, 0, materialAmount, 0, laborAmount, 0, 0, 0, totalAmount, ''];
}

/**
 * 전기(집)/통신(집) 등 전문공종형 시트의 열 순서: 번호,공종코드,…,품명,단위,수량,
 * 재료비단가,재료비금액,노무비단가,노무비금액,경비단가,경비금액,합계단가,합계금액,비고.
 * 표준 레이아웃과 달리 코드와 품명이 서로 다른 컬럼(공종코드=2번째, 품명=4번째)에 분리되어 있고,
 * 하위 항목의 품명에는 코드가 포함되지 않는다(예: "1-1. 전력간선설비공사"처럼 코드 없이 시작).
 */
function altLayoutRow(code: string, name: string, materialAmount: number, laborAmount: number, totalAmount: number): unknown[] {
    return ['', code, '', name, '식', 1, 0, materialAmount, 0, laborAmount, 0, 0, 0, totalAmount, ''];
}

function buildFixtureWorkbook(): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();

    // 총괄집계: 5행(총계) + 대공종 2개(건축/토목)
    const summaryAoa = [
        ['공 종 별 집 계 표'],
        ['공사명 : 테스트현장'],
        ['품명', '규격', '단위', '수량', '재료비', '', '노무비', '', '경비', '', '합계', '', '비고'],
        ['', '', '', '', '단가', '금액', '단가', '금액', '단가', '금액', '단가', '금액'],
        row('01  테스트현장', 1000, 500, 2000),
        row('0101  건축공사', 600, 300, 1200),
        row('0102  토목공사', 400, 200, 800),
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryAoa), '총괄집계');

    // 건축(집): 총계 → 건축공사(4자리, 자식 있음) → 010101 중분류(자식 있음) → 세부공종 2개(리프) → 010102 조경공사(자식 없음, 리프)
    const archAoa = [
        ['공 종 별 집 계 표'],
        ['공사명 : 테스트현장'],
        ['품명', '규격', '단위', '수량', '재료비', '', '노무비', '', '경비', '', '합계', '', '비고'],
        ['', '', '', '', '단가', '금액', '단가', '금액', '단가', '금액', '단가', '금액'],
        row('01  테스트현장', 600, 300, 1200),
        row('0101  건축공사', 600, 300, 1200),
        row('010101  1) 골조공사', 500, 250, 1000),
        row('01010101  철근콘크리트공사', 350, 150, 700),
        row('01010102  철  골  공  사', 150, 100, 300),
        row('010102  조 경 공 사', 100, 50, 200),
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(archAoa), '건축(집)');

    // 토목(집): 총계 없이 바로 대공종부터 시작 (철탑(집) 사례처럼 시트마다 최상위 총계 유무가 다름)
    const civilAoa = [
        ['공 종 별 집 계 표'],
        ['공사명 : 테스트현장'],
        ['품명', '규격', '단위', '수량', '재료비', '', '노무비', '', '경비', '', '합계', '', '비고'],
        ['', '', '', '', '단가', '금액', '단가', '금액', '단가', '금액', '단가', '금액'],
        row('0102  토목공사', 400, 200, 800),
        row('010201  토공', 400, 200, 800),
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(civilAoa), '토목(집)');

    return workbook;
}

describe('parseWorkbookForImport', () => {
    it('총괄집계 시트의 재료비+노무비 합계로 대상액을 계산한다', () => {
        const result = parseWorkbookForImport(buildFixtureWorkbook());
        expect(result.targetAmount).toBe(1000 + 500);
    });

    it('최상위 프로젝트 총계 행(2자리 코드)을 제외한 대공종 목록을 추출한다', () => {
        const result = parseWorkbookForImport(buildFixtureWorkbook());
        expect(result.majorWorkTypeTotals).toEqual([
            { code: '0101', name: '건축공사', amount: 1200 },
            { code: '0102', name: '토목공사', amount: 800 },
        ]);
    });

    it('자식이 없는(리프) 세부공종만 추출하고, 자식이 있는 상위 항목은 제외한다', () => {
        const result = parseWorkbookForImport(buildFixtureWorkbook());
        const names = result.detailWorkItems.map((item) => item.name).sort();
        expect(names).toEqual(['조경공사', '철골공사', '철근콘크리트공사', '토공'].sort());
    });

    it('공백 표기가 일정하지 않아도 공종명을 공백 없이 정규화한다', () => {
        const result = parseWorkbookForImport(buildFixtureWorkbook());
        const steel = result.detailWorkItems.find((item) => item.code === '01010102');
        expect(steel?.name).toBe('철골공사');
    });

    it('세부공종에 소속 대공종(discipline)을 시트명에서 유추해 부여한다', () => {
        const result = parseWorkbookForImport(buildFixtureWorkbook());
        const rc = result.detailWorkItems.find((item) => item.name === '철근콘크리트공사');
        expect(rc?.discipline).toBe('건축');
        const soil = result.detailWorkItems.find((item) => item.name === '토공');
        expect(soil?.discipline).toBe('토목');
    });

    it('대공종별 대상액(재료비+노무비)을 그 대공종 시트의 최상위(리프 아닌) 행에서 추출한다', () => {
        const result = parseWorkbookForImport(buildFixtureWorkbook());
        // 건축(집)의 "0101 건축공사" 행: 재료비 600 + 노무비 300 = 900
        // 토목(집)의 "0102 토목공사" 행: 재료비 400 + 노무비 200 = 600
        expect(result.disciplineTargetAmounts).toEqual({ 건축: 900, 토목: 600 });
    });

    it('상위/하위 코드 채번이 어긋나도(접두어 불일치) 위치(깊이) 기반으로 판단해 중복 집계하지 않는다', () => {
        // 실제 파일에서 발견된 패턴 재현: "010201 부지정지공사"의 하위 항목이 "0103xxxx"로 채번되어
        // 문자열 접두어로는 이어지지 않는다. 바로 다음 행이 더 깊은 코드이므로 상위 항목은 리프가 아니어야 한다.
        const workbook = XLSX.utils.book_new();
        const summaryAoa = [['h'], ['h'], ['h'], ['h'], row('01  테스트현장', 100, 0, 100), row('0102  토목공사', 100, 0, 100)];
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryAoa), '총괄집계');

        const civilAoa = [
            ['h'],
            ['h'],
            ['h'],
            ['h'],
            row('0102  토목공사', 100, 0, 100),
            row('010201  1) 부지정지공사', 100, 0, 100), // 하위 총계 (리프 아니어야 함)
            row('01030101  토공', 40, 0, 40), // 실제 하위 항목 (접두어는 다름: 0103 vs 0102)
            row('01030102  L형옹벽설치', 60, 0, 60),
        ];
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(civilAoa), '토목(집)');

        const result = parseWorkbookForImport(workbook);
        const names = result.detailWorkItems.map((item) => item.name);
        expect(names).not.toContain('부지정지공사');
        expect(names).toEqual(['토공', 'L형옹벽설치']);
        expect(result.detailWorkItems.reduce((sum, item) => sum + item.amount, 0)).toBe(100); // 100이 아니라 200이면 중복 집계
    });

    it('전기(집)/통신(집)처럼 품명 컬럼 위치·금액 컬럼 오프셋이 다른 전문공종형 시트도 파싱한다', () => {
        // 실제 파일에서 발견된 패턴: 번호·공종코드 컬럼이 앞에 있어 품명이 4번째 컬럼이고, 재료비/노무비/합계금액도
        // 표준 레이아웃보다 전부 2칸씩 뒤로 밀려있다. 표준 레이아웃으로 시도해 0건이면 이 레이아웃으로 재시도해야 한다.
        const workbook = XLSX.utils.book_new();
        const summaryAoa = [['h'], ['h'], ['h'], ['h'], row('01  테스트현장', 190505050, 114200002, 305285366), row('0105  전기공사', 190505050, 114200002, 305285366)];
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryAoa), '총괄집계');

        const elecAoa = [
            ['총줄수->', '55', '2.0', '공사명 : 테스트현장'],
            ['번호', '공종코드', '…', '공종명', '단위', '수량', '재료비', '', '노무비', '', '경비', '', '합계', '', '비고'],
            ['', '', '', '', '', '', '단가', '금액', '단가', '금액', '단가', '금액', '단가', '금액'],
            ['공종줄'],
            altLayoutRow('001', '0105 전기공사', 190505050, 114200002, 305285366),
            // 실제 파일에서 발견된 패턴: "공종줄"이라는 섹션 구분 행이 코드 컬럼에 문자열을 넣은 채로 끼어든다.
            // 숫자가 아닌 코드를 걸러내지 않으면 이 행이 깊이 판단에 끼어들어 바로 위 총계 행("001")을
            // 리프로 잘못 인식시킨다.
            altLayoutRow('공종줄', '1.전기공사', 0, 0, 0),
            altLayoutRow('00101', '1-1. 전력간선설비공사', 71042985, 11918590, 82986845),
            altLayoutRow('00102', '1-2. 동력설비공사', 12775649, 20726282, 33544281),
            // 실제 파일에서 발견된 패턴: 맨 아래 섹션 합계 행이 최상위 코드("001")를 그대로 재사용하고
            // 품명에 "( 합    계 )" 마커가 들어있다. 코드가 중복돼 마커 검사 없이는 세부공종처럼 잡힌다.
            altLayoutRow('001', '( 합       계 )', 190505050, 114200002, 305285366),
        ];
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(elecAoa), '전기(집)');

        const result = parseWorkbookForImport(workbook);
        const names = result.detailWorkItems.map((item) => item.name).sort();
        expect(names).toEqual(['1-1.전력간선설비공사', '1-2.동력설비공사'].sort());
        expect(names).not.toContain('(합계)');
        expect(names).not.toContain('0105전기공사'); // 최상위 총계 행이 리프로 잘못 섞이면 안 된다
        // 대공종 총계 행("0105 전기공사")에서 재료비+노무비를 뽑아야 한다: 190505050+114200002
        expect(result.disciplineTargetAmounts['전기']).toBe(190505050 + 114200002);
    });

    it('"총괄집계" 시트가 없으면 에러를 던진다', () => {
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['dummy']]), 'Sheet1');
        expect(() => parseWorkbookForImport(workbook)).toThrow();
    });
});
