/**
 * 세부공종별 "위험가중치 산정용 위험계수" 설정.
 * 법적 근거가 있는 수치가 아니라, KOSHA 산업재해 통계(공종/작업 유형별 재해 발생 경향)를 참고해 만든
 * 운영상 1차 판단 기준이다. 실제 현장 경험(재해 이력, 위험성평가 결과)으로 계속 보정해 나가야 한다.
 *
 * 키는 내역서에서 추출한 공종명에서 공백을 모두 제거한 형태로 정규화해 매칭한다
 * (예: "철  골  공  사" → "철골공사"). domain/riskWeightAllocation.ts의 normalizeWorkTypeName 참고.
 */

/** 위험 등급별 대표 계수. 고소작업·구조물·굴착·중량물 취급이 결합될수록 계수를 높게 둔다. */
export const RISK_COEFFICIENT_BANDS = {
    EXTREME: 2.0, // 철골, 철탑, 흙막이 등 구조적 붕괴·추락 위험이 큰 공종
    HIGH: 1.5, // 고소작업, 중장비 굴착, 대형 구조물 설치가 수반되는 공종
    MEDIUM: 1.0, // 표준적인 재해율의 일반 공종 (기본값)
    LOW: 0.6, // 마감·설치 위주로 상대적으로 재해율이 낮은 공종
} as const;

/** 매칭 실패 시 적용하는 기본 계수 (표준적인 재해율로 간주). */
export const DEFAULT_RISK_COEFFICIENT = RISK_COEFFICIENT_BANDS.MEDIUM;

const { EXTREME, HIGH, MEDIUM, LOW } = RISK_COEFFICIENT_BANDS;

/**
 * 세부공종명(공백 제거) → 위험계수.
 * 실사용 샘플 내역서(대광새마을금고 골프연습장, 건축/토목/철탑 공종)에서 실제로 등장한 명칭을 우선 반영했고,
 * 기계/전기/통신/소방 공종은 일반적으로 통용되는 명칭을 추가했다. 목록에 없는 공종은 DEFAULT_RISK_COEFFICIENT(중위험)로 처리된다.
 */
export const WORK_TYPE_RISK_COEFFICIENTS: Record<string, number> = {
    // 가설·토공·구조 (특고위험)
    철골공사: EXTREME,
    철탑공사: EXTREME,
    흙막이공사: EXTREME,
    파일공사: EXTREME,
    가설공사: EXTREME,
    권양기공사: EXTREME,

    // 고소작업·굴착·중장비 (고위험)
    토공: HIGH,
    토및지정공사: HIGH,
    부지정지공사: HIGH,
    외벽마감공사: HIGH,
    홈통공사: HIGH,
    창호공사: HIGH,
    유리공사: HIGH,
    금속공사: HIGH,
    망공사: HIGH,
    인조잔디공사: HIGH,
    L형옹벽설치: HIGH,
    부대토목공사: HIGH,

    // 표준 재해율 (중위험 = 기본값이지만 명시적으로 등록)
    철근콘크리트공사: MEDIUM,
    조적공사: MEDIUM,
    돌공사: MEDIUM,
    타일공사: MEDIUM,
    방수공사: MEDIUM,
    미장공사: MEDIUM,
    포장공사: MEDIUM,
    관로부설: MEDIUM,
    관기초: MEDIUM,
    맨홀: MEDIUM,
    측구수로관: MEDIUM,
    집수정: MEDIUM,
    오수처리시설설치: MEDIUM,
    볼이송시스템공사: MEDIUM,
    오토티업설치공사: MEDIUM,
    타석용품: MEDIUM,
    회수용펌프공사: MEDIUM,
    배관공사: MEDIUM,
    덕트공사: MEDIUM,
    위생기구공사: MEDIUM,
    수배전반공사: MEDIUM,
    전등전열공사: MEDIUM,
    소화설비공사: MEDIUM,
    경보설비공사: MEDIUM,

    // 마감·설치 위주 (저위험)
    목공사및수장공사: LOW,
    칠공사: LOW,
    조경공사: LOW,
    골재비: LOW,
    주요자재비: LOW,
    관로표시테이프: LOW,
    하수관내CCTV조사: LOW,
    폐기물처리비: LOW,
    한전불입금: LOW,
    기타공사: LOW,
    공통가설공사: LOW,
    통신설비공사: LOW,
    유량계실: MEDIUM,
    수압시험: LOW,
    부대시설: MEDIUM,
    위생기구설치공사: LOW,
    바닥난방배관공사: LOW,
    자동화재탐지설비공사: LOW,
    임시소방시설: LOW,

    // 기계설비·소방 (실사용 샘플에서 추가 확인된 명칭)
    장비설치공사: HIGH, // 중량물(펌프·수전설비 등) 양중·설치
    옥외배관공사: MEDIUM,
    급수급탕배관공사: MEDIUM,
    오배수배관공사: MEDIUM,
    환기배관공사: MEDIUM,
    냉난방기설치공사: MEDIUM,
    '옥내소화전,스프링클러설비공사': MEDIUM,
};
