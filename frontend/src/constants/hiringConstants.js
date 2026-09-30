/**
 * @file hiringConstants.js
 * @description 채용 면접 평가에 사용되는 항목, 척도 및 질문 세트 정의
 */

// 외관 인상 평가 항목 (신입 전용) - A/B/C 척도
export const NEW_ENTRY_APPEARANCE = [
  { id: 'health', label: '건강', criteria: { A: '혈색양호 든든', B: '보통건강체', C: '약해 보임' } },
  { id: 'dress', label: '복장', criteria: { A: '청결하며 단정', B: '일단 단정', C: '단정하지 못함' } },
  { id: 'attitude', label: '태도', criteria: { A: '침착하다', B: '보통', C: '침착하지 못함' } },
  { id: 'youth', label: '젊음', criteria: { A: '청년답고 발랄', B: '젊은 느낌', C: '어른인척 함' } },
  { id: 'brightness', label: '명랑성', criteria: { A: '밝고 외향적', B: '보통', C: '어둡고 내향적' } },
  { id: 'cooperation', label: '협조성', criteria: { A: '사교성 있을 듯', B: '보통', C: '고독한 느낌' } },
  { id: 'conversation', label: '대화', criteria: { A: '사려 있는 발언', B: '경솔한 답변 있음', C: '즉흥적 발언 모순 있음' } },
  { id: 'likability', label: '호감도', criteria: { A: '호감이 간다', B: '보통', C: '호감이 안감' } },
];

// 외관 인상 평가 항목 (경력 전용) - A/B/C 척도
export const EXPERIENCED_APPEARANCE = [
  { id: 'health', label: '건강', criteria: { A: '혈색 양호 든든', B: '보통 건강체', C: '약해 보임' } },
  { id: 'dress', label: '복장', criteria: { A: '청결하며 단정', B: '일단 단정', C: '단정하지 못함' } },
  { id: 'attitude', label: '태도', criteria: { A: '침착하다', B: '보통', C: '침착하지 못함' } },
  { id: 'cooperation', label: '협조성', criteria: { A: '사교성 있을 듯', B: '보통', C: '고독한 느낌' } },
  { id: 'conversation', label: '대화', criteria: { A: '사려 있는 발언', B: '경솔한 답변 있음', C: '즉흥적 발언 모순 있음' } },
  { id: 'brightness', label: '명랑성', criteria: { A: '밝고 외향적', B: '보통', C: '어둡고 내향적' } },
  { id: 'personality', label: '성격', criteria: { A: '리더쉽 발휘', B: '독선적인 느낌', C: '우유부단한 느낌' } },
  { id: 'likability', label: '호감도', criteria: { A: '호감이 간다', B: '보통', C: '호감이 안감' } },
];

// 인성 및 공통 역량 평가 항목 (ABCDE 척도)
export const COMPETENCY_ITEMS = [
  { id: 'logic', label: '논리성', description: '지금 주소에서 우리 회사까지 몇 분 걸렸습니까. 어느 노선으로 오셨습니까.' },
  { id: 'activeness', label: '적극성', description: '왜 우리 회사를 선택하셨습니까. (그 밖에 어떤 곳에 응시했습니까.)' },
  { id: 'planning', label: '계획성', description: '우리 회사에 대해 파악·연구, 검토를 해보셨습니까.' },
  { id: 'observation', label: '관찰', description: '당신의 장점(특기)을 객관적으로 판단하시고 설명하십시오.' },
  { id: 'understanding', label: '이해력', description: '우리 회사에 오셔서 보고 느낀 바를 솔직하게 말씀하십시오.' },
  { id: 'reliability', label: '견실성', description: '아르바이트 경험이 있습니까. 직업을 어떻게 생각하십니까.' },
  { id: 'sincerity', label: '성실성', description: '채용 된 경우 어떤 직종을 희망하십니까.' },
  { id: 'teamwork', label: '협조성', description: '입사 후, 제1희망의 업무에 종사하지 못했을 때, 당신은 어떻게 하겠습니까.' },
  { id: 'values', label: '사상', description: '마음에 들지 않는 업무나, 상사·선배와는 어떻게 하면 잘해 나갈 수 있겠습니까.' },
  { id: 'commonSense', label: '상식성', description: '우리 회사는 성질상 근무상황이 매우 엄격한 때도 있습니다. 받아들일 수 있겠습니까.' },
  { id: 'sociality', label: '사회성', description: '만일 취직한 경우, 당신은 몇 년 정도 근무할 수 있습니까. (근무할 작정입니까.)' },
  { id: 'attention', label: '주의력', description: '당신은 평소에도 그런 복장으로 다닙니까.' },
];

// 신입 사원 전용 - 생활 환경 및 가치관 질문
export const NEW_ENTRY_LIFE_QUESTIONS = [
  { id: 'health_status', label: '건강도', question: '친구와 함께 있을 때면 어떻게 지내며 누가 리드합니까.' },
  { id: 'appearance_dress', label: '용모복장', question: '존경하는 사람은 누구입니까. 어디에 매력을 느낍니까.' },
  { id: 'attitude_life', label: '태도', question: '구독하고 있는 신문은, 전문서적은 몇 권 정도 가지고 있습니까.' },
  { id: 'expression_face', label: '표정', question: '당신은 학교에서 어느 동아리 활동에 주력했습니까. 또한 무엇을 배웠습니까.' },
  { id: 'behavior_motion', label: '동작', question: '가족들과 평소에 어떤 이야기를 합니까. 의견이 맞지 않는 것은?' },
  { id: 'originality', label: '독창성', question: '가족들은 모두 건강하십니까. 당신의 출석률(출근율)은?' },
  { id: 'expressiveness', label: '표현력', question: '당신은 어떤 음식을 좋아하십니까. 싫어하는 것은 어떤 것입니까.' },
];

// 경력 사원 전용 - 기타 질문 (텍스트)
export const EXPERIENCED_LIFE_QUESTIONS = [
  { id: 'clubActivity', label: '기타 1', question: '당신은 학교에서 어느 동아리 활동에 주력했습니까. 또한 무엇을 배웠습니까.' },
  { id: 'friendship', label: '기타 2', question: '친구와 함께 있을 때면 어떻게 지내며 누가 리더합니까.' },
  { id: 'books', label: '기타 3', question: '전문 서적은 몇 권 정도 가지고 있습니까.' },
  { id: 'network', label: '기타 4', question: '같은 업종에 재직하며 교류하고 있는 선배나 친구는 몇 명이나 됩니까?' },
  { id: 'mentoring', label: '기타 5', question: '직장에서 근무하는 동안 후배사원을 지도한 경험은' }
];

// 경력 사원 전용 - 경력 평가 항목 (ABCDE 척도)
export const EXPERIENCED_CAREER_EVAL = [
  { id: 'exp_total', category: '경력사항 확인', label: '총 경력 연수 및 직무범위' },
  { id: 'exp_recent', category: '경력사항 확인', label: '최근 근무회사/프로젝트' },
  { id: 'exp_role', category: '경력사항 확인', label: '주요 수행 업무 및 역할' },
  { id: 'proj_info', category: '프로젝트 수행 경험', label: '담당했던 주요 토목 프로젝트 개요' },
  { id: 'proj_role', category: '프로젝트 수행 경험', label: '본인의 역할 및 공정별 참여 수준' },
  { id: 'proj_result', category: '프로젝트 수행 경험', label: '공기, 품질, 안전 원가 측면에서의 성과' },
  { id: 'tech_understand', category: '업무(기술) 역량', label: '토목 시공 관련 기술 이해도' },
  { id: 'tech_calc', category: '업무(기술) 역량', label: '시방서, 도면 물량산출 능력' },
  { id: 'tech_sw', category: '업무(기술) 역량', label: 'CAD, BIM, 설계 SW활용 능력' },
  { id: 'comm_collab', category: '협업 및 커뮤니케이션 능력', label: '발주처, 협력사, 감리단 등과의 소통 사례' },
  { id: 'comm_issue', category: '협업 및 커뮤니케이션 능력', label: '현장 이슈 발생 시 대응 경험' },
  { id: 'ps_cases', category: '문제 해결능력', label: '공정 지연, 자재 문제, 민원등의 사례' },
  { id: 'ps_solution', category: '문제 해결능력', label: '본인이 주도한 해결 방안' },
  { id: 'org_fit1', category: '조직 적응력 및 성향', label: '야근, 지방근무 가능여부' },
  { id: 'org_fit2', category: '조직 적응력 및 성향', label: '조직문화에 대한 이해 및 적응력' },
  { id: 'goal_task', category: '입사 후 포부', label: '입사 후 맡고 싶은 업무' },
  { id: 'goal_plan', category: '입사 후 포부', label: '목표 및 기여 계획' },
  { id: 'etc_condition', category: '기타 확인사항', label: '희망 연봉 및 근무조건' },
  { id: 'etc_date', category: '기타 확인사항', label: '입사 가능일' },
];

// ============================================================================
// 안전보건팀 전용 - 다차원 역량진단 개편안 (2026-10)
// 배점 비중: A.산업안전보건법 25% · B.중대재해처벌법 25% · C.현장실무경험 35% · D.조직적합성 15%
// 기존 BARS(q1~q5, 25점 만점) 체계를 대체. 세부 근거는 "안전보건팀 다차원 역량진단 개편안" 문서 참조.
// ============================================================================
export const MULTIDIM_CATEGORIES = [
  { key: 'a', label: '산업안전보건법 이해', weight: 25 },
  { key: 'b', label: '중대재해처벌법 이해', weight: 25 },
  { key: 'c', label: '현장 실무 경험', weight: 35 },
  { key: 'd', label: '조직적합성', weight: 15 },
];

export const MULTIDIM_QUESTIONS = [
  // A. 산업안전보건법 이해 — 지식형
  {
    id: 'a1', category: 'a', type: 'knowledge',
    title: '안전보건관리체계의 4주체',
    main: '산업안전보건법상 사업주, 안전보건관리책임자, 관리감독자, 안전관리자의 역할과 의무를 구분해서 설명해 주십시오. 실제 현장에서 이 네 주체는 어떻게 연결되어 있습니까?',
    keywords: ['사업주 — 최종 책임', '안전보건관리책임자 — 사업장 총괄', '관리감독자 — 작업단위 지휘·감독', '안전관리자 — 기술 지원'],
  },
  {
    id: 'a2', category: 'a', type: 'knowledge',
    title: '도급 시 안전보건조치 의무',
    main: '원청(도급인)이 협력업체(관계수급인) 근로자에 대해 부담하는 안전보건조치 의무의 범위는 어디까지입니까? 최근 이 의무가 확대된 배경도 설명해 주십시오.',
    keywords: ['도급인 안전보건조치 의무(제63조)', '업종 제한 폐지·전 사업장 확대', '2020년 전부개정 배경 인지'],
  },
  {
    id: 'a3', category: 'a', type: 'knowledge',
    title: '작업계획서 대상과 기재사항',
    main: '안전보건규칙 별표4에 따라 작업계획서를 작성해야 하는 작업을 3가지 이상 말씀해 주시고, 그중 하나를 골라 작업계획서에 반드시 포함되어야 할 사항을 설명해 주십시오.',
    keywords: ['타워크레인 설치·해체', '차량계 건설기계', '2m 이상 굴착', '중량물 취급', '해체작업', '사전조사+법정 기재사항 구조 이해'],
  },
  {
    id: 'a4', category: 'a', type: 'knowledge',
    title: '위험성평가 실시 체계',
    main: '위험성평가의 법적 근거와 실시 시기(최초·정기·수시)를 설명하고, 평가 결과를 근로자에게 어떻게 공유·주지해야 하는지 말씀해 주십시오.',
    keywords: ['산업안전보건법 제36조', '최초·정기(매년)·수시(공정변경 등)', '근로자 참여·게시·주지 의무'],
  },

  // B. 중대재해처벌법 이해 — 지식형 + 시나리오
  {
    id: 'b1', category: 'b', type: 'knowledge',
    title: "경영책임자등의 정의",
    main: "중대재해처벌법상 '경영책임자등'은 누구를 말하며, 산업안전보건법의 '사업주' 개념과 어떻게 다릅니까?",
    keywords: ['사업 대표 또는 안전보건 총괄 임원', '개인 형사책임 범위 확대', '사업주보다 좁고 구체적인 의사결정권자 대상'],
  },
  {
    id: 'b2', category: 'b', type: 'knowledge',
    title: '안전보건관리체계 구축요소',
    main: '중대재해처벌법 시행령이 요구하는 안전보건관리체계 구축의 핵심 요소를 아는 대로 말씀해 주십시오.',
    keywords: ['안전보건 목표·경영방침', '전담조직', '유해위험요인 확인·개선', '안전보건 예산', '인력 배치', '종사자 의견 청취', '비상대응 매뉴얼', '도급·용역 평가기준'],
  },
  {
    id: 'b3', category: 'b', type: 'scenario',
    title: '중대재해 발생 시 초동 대응',
    main: '협력업체 소속 근로자가 추락하여 사망하는 중대산업재해가 발생했다고 가정합니다. 본사 안전보건팀 담당자로서 발생 직후 취해야 할 조치를 순서대로 말씀해 주십시오.',
    keywords: ['구호조치·작업중지', '관할 고용노동청 지체없이 보고', '경영책임자 즉시 보고', '현장 보존', '원인조사 협조·재발방지대책 수립'],
  },
  {
    id: 'b4', category: 'b', type: 'knowledge',
    title: '처벌 구조 차이',
    main: '중대재해처벌법과 산업안전보건법의 처벌 대상 및 형량 차이를 아는 대로 설명해 주십시오.',
    keywords: ['중처법 — 경영책임자 개인 형사처벌 + 법인 양벌', '산안법 — 사업주·관리책임자 등 안전조치의무 위반 처벌', '대상·입증책임 구조 차이 인지'],
  },

  // C. 현장 실무 경험 — 행동형(BARS), 기존 BARS q2~q5 유지 + 1개 신규
  {
    id: 'c1', category: 'c', type: 'behavior',
    title: '위험성평가 실전 경험',
    main: '과거 건설 현장이나 사업장에서 위험성평가를 통해 숨겨진 위험 요인을 도출한 경험을 말씀해 주십시오. 실질적인 반대에 부딪혔다면 어떻게 극복하셨습니까?',
    probing: '상상했던 대안은 무엇이었으며, 경영진의 지원이나 예산은 어떻게 이끌어 냈습니까?',
    bars: { 5: '데이터 기반 예측, 현장 참여형 통제 및 리스크 고도화', 4: '다각도 위험 분석 및 실현 가능한 최상 개선책 수립', 3: '절차에 따른 매뉴얼 준수 및 적절한 위험 발굴', 2: '단편적 분석으로 상급자/전문가의 잦은 수정 필요', 1: '현장 위험 요인 간과 및 실질적인 위험 발굴 실패' },
  },
  {
    id: 'c2', category: 'c', type: 'behavior',
    title: '위기 대응 및 재발방지',
    main: '현장에서 아차사고나 급박한 위험 상황에 대처했던 경험과, 그 이후 재발방지를 위해 현장/조직에 어떤 구조적 변화를 적용하셨습니까?',
    probing: '근본 원인(Root Cause)은 무엇으로 파악했으며, 수립한 대책이 일회성에 그치지 않도록 조치한 방법은 무엇입니까?',
    bars: { 5: '근본 원인 선제적 파악, 통제 및 완벽한 수평 전개 구현', 4: '체계적 원인 분석 및 조직적인 재발방지 절차 수립', 3: '가이드라인/매뉴얼 절차에 따른 무난한 사고 수습', 2: '표면적인 원인(근로자 부주의 탓 등) 수준의 분석에 머무름', 1: '시스템 및 절차 무시, 근본적인 위기 대응 능력 부재' },
  },
  {
    id: 'c3', category: 'c', type: 'behavior',
    title: '소통 및 갈등 조정',
    main: '안전 규정 준수와 공사 일정 단축 사이에서 타 부서장(혹은 하도급 소장)과 충돌했을 때, 이를 어떻게 논리적으로 설득하셨습니까?',
    probing: '상대방의 입장을 어떻게 배려/이해했으며 윈-윈 도출을 이끈 설득 근거는 무엇이었습니까?',
    bars: { 5: '완벽한 윈-윈 대안 제시, 상호 신뢰 구축 및 자발적 참여 유도', 4: '법적/절차적 근거를 바탕으로 협력적 안전 문화 분위기 조성', 3: '기존 평가 지표 및 절차 활용을 통한 원만한 갈등 조율', 2: '일방적/권위적 규정 강요 등으로 소통 단절 초래', 1: '갈등을 완전히 방치하거나 해결/소통 능력이 현저히 부족' },
  },
  {
    id: 'c4', category: 'c', type: 'behavior',
    title: '안전 리더십 및 문화 조성',
    main: "현장 근로자들의 다친다고 생각하지 않는 '관행'을 막기 위해, 교육이나 캠페인을 직접 기획하여 근로자의 행동 변화를 이끌어낸 사례가 있습니까?",
    probing: '해당 캠페인 후 현장의 가시적인 태도나 실적 변화는 어떻게 측정하셨습니까?',
    bars: { 5: '진정성 있는 현장 리더십 발휘로 지속 가능한 안전 문화 구축 성공', 4: '능동적 캠페인 기획 및 다차원적 교육으로 근로자 인식 향상 유도', 3: '매뉴얼 기반 교육 및 지시 사항 수행을 통한 현상 유지', 2: '행동 변화 없이 형식적인 서류/교육 절차만 수행 조치', 1: '상호 존중 부족 및 강압적 지시 중심에 머무름' },
  },
  {
    id: 'c5', category: 'c', type: 'behavior',
    title: '다단계 하도급 현장 관리',
    main: '다수의 협력업체가 동시에 작업하는 현장에서 안전보건관리비 집행 검토, 합동 안전점검, 또는 중대재해처벌법 대응 매뉴얼 수립에 직접 참여한 경험이 있습니까?',
    probing: '본인이 주도한 부분과, 이후 현장에 정착시키기 위해 한 노력은 무엇입니까?',
    bars: { 5: '체계(매뉴얼·점검 프로세스)를 직접 설계·주도', 4: '기존 체계에 적극 참여하며 개선안을 제안', 3: '지시에 따라 합동점검·서류 검토에 참여', 2: '형식적으로만 참여, 내용 이해도 낮음', 1: '관련 경험이나 개념 이해가 없음' },
  },

  // D. 조직적합성 — 정성 평가
  {
    id: 'd1', category: 'd', type: 'general',
    title: '직무 비전과 사명감',
    main: '이 직무를 통해 이루고 싶은 목표는 무엇이며, 가장 큰 보람을 느낄 것 같은 순간은 언제입니까?',
  },
  {
    id: 'd2', category: 'd', type: 'general',
    title: '조직 적응력과 소통 방식',
    main: '본인과 다른 의견을 가진 현장소장이나 상급자를 만났을 때 어떻게 대처하십니까?',
  },
  {
    id: 'd3', category: 'd', type: 'general',
    title: '자기계발',
    main: '안전 분야 전문성을 유지·고도화하기 위해 평소 어떤 노력을 하고 있습니까?',
  },
];

export const MULTIDIM_SCORE_GUIDE = [
  { score: 5, label: '탁월 (Outstanding)', desc: '해당 역량과 관련하여 즉시 현장 적용 및 지도/전파가 가능한 최고 수준' },
  { score: 4, label: '우수 (Exceeds)', desc: '주어진 질문과 상황에 대해 명확한 기준과 구체적인 대처 방안을 완벽히 숙지함' },
  { score: 3, label: '보통 (Meets)', desc: '기본적인 원칙을 이해하고 있으나 활용 측면에서 다소 구체성이 떨어질 수 있음' },
  { score: 2, label: '미흡 (Needs Imp.)', desc: '이해도가 부족하며, 상황 투입 전 재교육 및 면밀한 모니터링이 필수적임' },
  { score: 1, label: '부적합 (Unacceptable)', desc: '해당 영역에 대한 개념과 원칙 파악이 미달되어 사고 예방 및 대응이 불가함' },
];

/**
 * 다차원 역량진단 평가 객체(evaluations)가 신규 체계(a1~d3)인지 판별.
 * 기존 레거시 BARS(q1~q5)와 공존해야 하므로 항상 이 판별을 거쳐 분기한다.
 */
export function isMultiDimEvaluation(evaluations) {
  return !!evaluations && Object.prototype.hasOwnProperty.call(evaluations, 'a1');
}

/**
 * 가중 배점(A25·B25·C35·D15, 총 100점)으로 다차원 역량진단 점수를 계산.
 * 각 영역은 문항 평균(1~5)을 영역 배점 비중에 비례 환산한다.
 */
export function calcMultiDimScore(evaluations) {
  const avg = (keys) => keys.reduce((sum, k) => sum + (Number(evaluations[k]) || 0), 0) / keys.length;
  const byCategory = {
    a: avg(['a1', 'a2', 'a3', 'a4']),
    b: avg(['b1', 'b2', 'b3', 'b4']),
    c: avg(['c1', 'c2', 'c3', 'c4', 'c5']),
    d: avg(['d1', 'd2', 'd3']),
  };
  const weights = { a: 25, b: 25, c: 35, d: 15 };
  const total = Object.keys(weights).reduce((sum, k) => sum + (byCategory[k] / 5) * weights[k], 0);
  return { byCategory, total: Math.round(total * 10) / 10 };
}

// 안전보건팀 전용 - 전문 기술 질문 (Technical Safety, 고도화 면접 시스템 전용 — 별도 유지)
export const SAFETY_TECH_QUESTIONS = [
  {
    id: 'st1',
    title: '본사 공무 및 현장 안전관리 성과',
    question: '본사 안전공무 실무나 현장 안전관리자 경험을 통해 도출한 주요 성과와 배운 점은 무엇입니까?',
  },
  {
    id: 'st2',
    title: '무재해 달성 및 창의적 해결 사례',
    question: '현장 안전관리 시 무재해 달성을 위한 본인만의 노하우나 창의적인 문제 해결 사례가 있습니까?',
  },
  {
    id: 'st3',
    title: '안전보건 법규 및 시스템 적용',
    question: '개정된 중대재해처벌법이나 ISO 45001 등 국제 표준 시스템을 실제 현장에 어떻게 적용해보셨습니까?',
  },
  {
    id: 'st4',
    title: '기술적 조정 및 갈등 해결',
    question: '현장 시공사 또는 협력사와의 안전 공정 갈등 발생 시, 기술적인 조정안을 통해 해결한 경험이 있습니까?',
  },
];
