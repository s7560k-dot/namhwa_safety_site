/**
 * @file hiringConstants.js
 * @description 채용 면접 평가에 사용되는 항목, 척도 및 질문 세트 정의
 */

// 외관 인상 평가 항목 (A/B/C 척도)
export const APPEARANCE_ITEMS = [
  { id: 'health', label: '건강', criteria: { A: '혈색양호 든든', B: '보통건강체', C: '약해 보임' } },
  { id: 'dress', label: '복장', criteria: { A: '청결하며 단정', B: '일단 단정', C: '단정하지 못함' } },
  { id: 'attitude', label: '태도', criteria: { A: '침착하다', B: '보통', C: '침착하지 못함' } },
  { id: 'youth', label: '젊음', criteria: { A: '청년답고 발랄', B: '젊은 느낌', C: '어른인척 함' } },
  { id: 'brightness', label: '명랑성', criteria: { A: '밝고 외향적', B: '보통', C: '어둡고 내향적' } },
  { id: 'cooperation', label: '협조성', criteria: { A: '사교성 있을 듯', B: '보통', C: '고독한 느낌' } },
  { id: 'conversation', label: '대화', criteria: { A: '사려 있는 발언', B: '경솔한 답변 있음', C: '즉흥적 발언 모순 있음' } },
  { id: 'likability', label: '호감도', criteria: { A: '호감이 간다', B: '보통', C: '호감이 안감' } },
];

// 인성 및 공통 역량 평가 항목 (ABCDE 척도)
export const COMPETENCY_ITEMS = [
  { id: 'logic', label: '논리성', description: '말의 앞뒤가 맞고 조리 있게 자신의 생각을 표현하는가?' },
  { id: 'activeness', label: '적극성', description: '매사에 의욕적이며 스스로 나서서 일을 처리하려 하는가?' },
  { id: 'planning', label: '계획성', description: '일의 순서를 생각하고 사전에 치밀하게 준비하는 습관이 있는가?' },
  { id: 'observation', label: '관찰력', description: '사물이나 현상을 세밀하게 살피고 핵심을 포착하는 능력이 있는가?' },
  { id: 'understanding', label: '이해력', description: '상대방의 의도나 상황을 정확히 파악하고 적절히 대응하는가?' },
  { id: 'reliability', label: '견실성', description: '생각이나 태도가 믿음직스럽고 중심이 잡혀 있는가?' },
  { id: 'sincerity', label: '성실성', description: '책임감이 강하며 맡은 바 임무에 최선을 다하는 성품인가?' },
  { id: 'teamwork', label: '협조성', description: '타인과 조화를 이루며 원만하게 협업하고 배려할 줄 아는가?' },
  { id: 'values', label: '사상(가치관)', description: '개인의 신념과 가치관이 건전하며 올바른 인생관을 가졌는가?' },
  { id: 'commonSense', label: '상식성', description: '사회인으로서 갖추어야 할 기본 지식과 타당한 사고를 하는가?' },
  { id: 'sociality', label: '사회성', description: '조직 생활에 잘 적응하며 대인관계를 원만히 유지하는가?' },
  { id: 'attention', label: '주의력', description: '집중력이 있으며 세세한 부분까지 꼼꼼하게 살피는가?' },
];

// 신입 사원 전용 - 생활 환경 및 가치관 질문
export const NEW_ENTRY_LIFE_QUESTIONS = [
  { id: 'relationships', label: '친구 관계 및 리더십', question: '친구와 함께 있을 때 어떻게 지내며 누가 리드합니까?' },
  { id: 'roleModel', label: '존경하는 인물', question: '존경하는 사람은 누구이며 어디에 매력을 느낍니까?' },
  { id: 'reading', label: '독서/신문 구독', question: '구독하고 있는 신문이나 전문 서적은 몇 권 정도 소장하고 있습니까?' },
  { id: 'clubActivity', label: '동아리 활동', question: '학교에서 어느 동아리 활동을 했으며 무엇을 배웠습니까?' },
  { id: 'familyComm', label: '가족 소통/건강', question: '가족과 평소 어떤 대화를 나누며 건강 상태는 어떠합니까?' },
  { id: 'eatingHabit', label: '식습관', question: '어떤 음식을 좋아하며 싫어하는 것은 무엇입니까?' },
];

// 경력 사원 전용 - 경력 세부 평가 항목 (ABCDE 척도)
export const EXPERIENCED_CAREER_EVAL = [
  { id: 'expYears', label: '총 경력 연수 및 직무 범위', description: '관련 분야의 총 경력 기간과 수행한 직무의 전문성이 충분한가?' },
  { id: 'recentProj', label: '최근 근무회사/프로젝트 주안점', description: '가장 최근 프로젝트에서의 역할과 실무 기여도는 어떠한가?' },
  { id: 'projPerformance', label: '공기/품질/안전/원가 성과', description: '과거 프로젝트 수행 시 성취한 구체적인 성과와 지표가 있는가?' },
  { id: 'techSkill', label: '도면 이해 및 물량산출 능력', description: '도면 해석 능력이 우수하며 기술적 물량 산출이 정확한가?' },
  { id: 'swSkill', label: 'CAD/BIM 등 설계 SW 활용 능력', description: '실무에 필요한 설계 및 오피스 소프트웨어 활용 숙련도는?' },
  { id: 'coordination', label: '협업 및 커뮤니케이션 능력', description: '유관 부서 및 외부 협력사와의 원활한 소통 및 조율이 가능한가?' },
  { id: 'problemSolving', label: '문제 해결 능력 및 위기 관리', description: '현장 위기 상황 발생 시 논리적이고 창의적인 해결책을 제시하는가?' },
  { id: 'culturalFit', label: '조직 문화 적응력 및 성향', description: '당사의 조직 문화와 가치관에 부합하며 긍정적인 에너지를 주는가?' },
  { id: 'postHireGoal', label: '입사 후 구체적 목표 및 기여 계획', description: '입사 후 본인의 역량을 어떻게 발휘하고 기여할 것인지 계획이 뚜렷한가?' },
];

// 안전보건팀 전용 - 전문 기술 질문 (Technical Safety)
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
