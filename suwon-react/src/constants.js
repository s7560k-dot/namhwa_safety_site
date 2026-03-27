/**
 * @file constants.js
 * @description 앱 전역 정적 상수
 *
 * Vite Fast Refresh는 컴포넌트(함수)와 상수를 같은 파일에 export하면
 * HMR이 제대로 동작하지 않습니다.
 * 이 파일에 정적 데이터를 분리하여 해당 문제를 해결합니다.
 */

/**
 * 수원 현장 공종 목록 (정적 데이터 — Firestore에 저장하지 않음)
 * @type {Array<{ name: string, start: number, duration: number, color: string, label: string }>}
 */
export const CONSTRUCTION_DATA = [
  { name: "공통가설공사", start: 1,  duration: 16, color: "bg-grey",   label: "공통가설"   },
  { name: "가설공사",     start: 3,  duration: 5,  color: "bg-blue",   label: "가설공사"   },
  { name: "철근콘크리트", start: 5,  duration: 11, color: "bg-red",    label: "골조공사"   },
  { name: "조적공사",     start: 8,  duration: 6,  color: "bg-blue",   label: "조적공사"   },
  { name: "미장공사",     start: 8,  duration: 8,  color: "bg-blue",   label: "미장공사"   },
  { name: "방수공사",     start: 8,  duration: 8,  color: "bg-blue",   label: "방수공사"   },
  { name: "타일공사",     start: 12, duration: 3,  color: "bg-yellow", label: "타일공사"   },
  { name: "석공사",       start: 11, duration: 5,  color: "bg-yellow", label: "석공사"     },
  { name: "금속공사",     start: 11, duration: 5,  color: "bg-yellow", label: "금속공사"   },
  { name: "창호공사",     start: 8,  duration: 8,  color: "bg-yellow", label: "창호공사"   },
  { name: "유리공사",     start: 12, duration: 4,  color: "bg-yellow", label: "유리공사"   },
  { name: "도장공사",     start: 11, duration: 5,  color: "bg-yellow", label: "도장공사"   },
  { name: "수장공사",     start: 10, duration: 5,  color: "bg-yellow", label: "수장공사"   },
  { name: "장애인편의",   start: 14, duration: 2,  color: "bg-yellow", label: "장애인시설" },
  { name: "E/V공사",      start: 12, duration: 4,  color: "bg-yellow", label: "승강기"     },
  { name: "조경공사",     start: 14, duration: 2,  color: "bg-green",  label: "조경공사"   },
  { name: "토목공사",     start: 1,  duration: 5,  color: "bg-blue",   label: "토목공사"   },
  { name: "부대토목공사", start: 13, duration: 3,  color: "bg-green",  label: "부대토목"   },
  { name: "기계설비공사", start: 5,  duration: 11, color: "bg-grey",   label: "기계설비"   },
  { name: "전기통신공사", start: 5,  duration: 11, color: "bg-grey",   label: "전기통신"   },
  { name: "소방공사",     start: 6,  duration: 10, color: "bg-grey",   label: "소방공사"   },
  { name: "준공/인계",    start: 16, duration: 1,  color: "bg-dark",   label: "준공"       },
];

/** Firebase 현장 문서 ID */
export const SITE_ID = "siteB";

/** 관리자 비밀번호 (실제 운영 시 Firebase Auth로 대체 권장) */
export const ADMIN_PASSWORD = "1234";
