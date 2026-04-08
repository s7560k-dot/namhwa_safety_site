import React, { useState } from 'react';
import { hiringService } from '../../services/hiringService';
import { Star, MessageSquare, AlertCircle, Save, X, Info, Target, LayoutList, ChevronDown, ChevronUp, FileText } from 'lucide-react';

const InterviewPanel = ({ candidate, onClose, onSaveSuccess, onStatusChange }) => {
  const [activeTab, setActiveTab] = useState('bars'); // 'bars' | 'general'
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedGeneralId, setExpandedGeneralId] = useState(1);
  const [evaluations, setEvaluations] = useState({ q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 });
  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const BARS_QUESTIONS = [
    {
      id: 'q1',
      title: '1. 법규/시스템 이해 (Legal & System Comprehension)',
      main: "최근 중대재해처벌법 판례나 산안법 개정 내용 중 가장 주목한 것은 무엇이며, 이를 실무 시스템에 어떻게 반영해야 한다고 보십니까?",
      probing: "개정 사항을 실제 현장의 어느 프로세스(안전보건관리체계)에 접목시켰는지 구체적인 사례를 말씀해 주십시오.",
      bars: {
        5: "완벽한 법규 해석 및 전사적 능동 대응 시스템 구축 능력",
        4: "주요 법규 숙지 및 체계적 시스템 개선/반영 가능",
        3: "기본 법적 요구사항 준수 및 매뉴얼 이행",
        2: "피상적 이해로 실무 적용 시 추가적 지도 필요",
        1: "법적 변화에 대한 무관심 및 기본 의무 미숙지"
      }
    },
    {
      id: 'q2',
      title: '2. 위험성평가 역량 (Risk Assessment)',
      main: "과거 건설 현장이나 사업장에서 위험성평가를 통해 숨겨진 위험 요인을 도출한 경험을 말씀해 주십시오. 만약 실질적인 반대에 부딪혔다면 어떻게 극복하셨습니까?",
      probing: "상상했던 대안은 무엇이었으며, 경영진의 지원이나 예산은 어떻게 이끌어 냈습니까?",
      bars: {
        5: "데이터 기반 예측, 현장 참여형 통제 및 리스크 고도화",
        4: "다각도 위험 분석 및 실현 가능한 최상 개선책 수립",
        3: "절차에 따른 매뉴얼 준수 및 적절한 위험 발굴",
        2: "단편적 분석으로 상급자/전문가의 잦은 수정 필요",
        1: "현장 위험 요인 간과 및 실질적인 위험 발굴 실패"
      }
    },
    {
      id: 'q3',
      title: '3. 위기 대응력 (Crisis Management)',
      main: "현장에서 아차사고나 급박한 위험 상황에 대처했던 경험과, 그 이후 재발방지를 위해 현장/조직에 어떤 구조적 변화를 적용하셨습니까?",
      probing: "근본 원인(Root Cause)은 무엇으로 파악했으며, 수립한 대책이 일회성에 그치지 않도록 조치한 방법은 무엇입니까?",
      bars: {
        5: "근본 원인 선제적 파악, 통제 및 완벽한 수평 전개 구현",
        4: "체계적 원인 분석 및 조직적인 재발방지 절차 수립",
        3: "가이드라인/매뉴얼 절차에 따른 무난한 사고 수습",
        2: "표면적인 원인(근로자 부주의 탓 등) 수준의 분석에 머무름",
        1: "시스템 및 절차 무시, 근본적인 위기 대응 능력 부재"
      }
    },
    {
      id: 'q4',
      title: '4. 소통/갈등 조정 (Communication & Coordination)',
      main: "안전 규정 준수와 공사 일정 단축 사이에서 타 부서장(혹은 하도급 소장)과 충돌했을 때, 이를 어떻게 논리적으로 설득하셨습니까?",
      probing: "상대방의 입장을 어떻게 배려/이해했으며 윈-윈 도출을 이끈 설득 근거는 무엇이었습니까?",
      bars: {
        5: "완벽한 윈-윈 대안 제시, 상호 신뢰 구축 및 자발적 참여 유도",
        4: "법적/절차적 근거를 바탕으로 협력적 안전 문화 분위기 조성",
        3: "기존 평가 지표 및 절차 활용을 통한 원만한 갈등 조율",
        2: "일방적/권위적 규정 강요 등으로 소통 단절 초래",
        1: "갈등을 완전히 방치하거나 해결/소통 능력이 현저히 부족"
      }
    },
    {
      id: 'q5',
      title: '5. 리더십 및 문화 조성 (Safety Leadership & Culture)',
      main: "현장 근로자들의 다친다고 생각하지 않는 '관행'을 막기 위해, 교육이나 캠페인을 직접 기획하여 근로자의 행동 변화를 이끌어낸 사례가 있습니까?",
      probing: "해당 캠페인 후 현장의 가시적인 태도나 실적 변화는 어떻게 측정하셨습니까?",
      bars: {
        5: "진정성 있는 현장 리더십 발휘로 지속 가능한 안전 문화 구축 성공",
        4: "능동적 캠페인 기획 및 다차원적 교육으로 근로자 인식 향상 유도",
        3: "매뉴얼 기반 교육 및 지시 사항 수행을 통한 현상 유지",
        2: "행동 변화 없이 형식적인 서류/교육 절차만 수행 조치",
        1: "상호 존중 부족 및 강압적 지시 중심에 머무름"
      }
    }
  ];

  const GENERAL_QUESTIONS = [
    {
      id: 1,
      title: "[법규 이해 및 현장 적용 역량]",
      main: "산업안전보건법 및 중대재해처벌법 등 관련 법령은 매년 개정되고 있습니다. 새로운 지침이 시행될 때, 본사 전담팀으로서 이를 전국의 건설 현장에 어떻게 적용하시겠습니까?",
      intent: "변화하는 규제에 대한 신속한 대처와 건설 현장의 복잡한 지휘 체계(본사-현장소장-협력업체) 내 전파력을 평가합니다.",
      modelAnswer: "법이 바뀌면 공공기관의 지침을 가장 먼저 확인하고 내부 대응 체계를 정비해야 합니다. 개정된 내용을 현장 근로자와 협력업체가 쉽게 이해할 수 있도록 교육 콘텐츠와 구체적인 실무 가이드라인으로 제작하여, 현장에서 새로운 수칙이 빠르고 정확하게 준수되도록 지원하겠습니다."
    },
    {
      id: 2,
      title: "[다공종/다현장 관리 감각]",
      main: "우리 회사는 토목, 건축, 플랜트 등 다양한 공종의 현장을 동시에 운영합니다. 현장 순회 점검 시 가장 중점적으로 확인하는 포인트는 무엇입니까?",
      intent: "공정별(굴착, 골조, 마감 등) 특성을 이해하고, 건설 현장 특유의 복합적인 위험 요소를 파악하는 실무 감각을 평가합니다.",
      modelAnswer: "공정별로 투입되는 장비와 위험 요소가 다르므로 현장 맞춤형 감각이 필요합니다. 단순히 규정 준수만 보는 것이 아니라 현장의 가설구조물 상태, 장비 이동 동선, 근로자의 피로도 등을 세심하게 살피겠습니다. 특히 정리가 안 된 현장은 큰 사고의 사전 알람과 같으므로 즉각적인 개선을 요청하겠습니다."
    },
    {
      id: 3,
      title: "[위험 발굴 및 즉각 조치]",
      main: "순회 점검 중, 현장의 개구부(뚫린 공간) 덮개가 열려 있거나 안전난간이 부실한 것을 발견했습니다. 어떻게 조치하시겠습니까?",
      intent: "중대재해로 직결될 수 있는 위험 요인 발견 시, 즉각적이고 실효성 있는 통제 능력을 봅니다.",
      modelAnswer: "눈에 띄지 않는 작은 위험 요소라도 즉시 작업을 중지시키고 현장 근로자 및 관리자와 소통하여 안전난간 보강 등의 즉각적인 개선 조치를 취하겠습니다. 개선 이후에도 해당 구역의 안전이 지속적으로 유지되는지 사후 관리를 철저히 하여 추락 사고를 완벽히 예방하겠습니다."
    },
    {
      id: 4,
      title: "[안전 문화 캠페인 및 습관화]",
      main: "현장에서는 A형 사다리 작업이나 낮은 비계에서의 '익숙함'과 '방심'에서 비롯된 추락 사고가 빈번합니다. 이를 예방하기 위해 어떤 활동을 전개하시겠습니까?",
      intent: "강압적 지시를 넘어, 근로자의 행동 변화를 이끌어내는 현장 캠페인 기획력을 평가합니다.",
      modelAnswer: "“낮은 높이라도 사다리나 고소 작업 시 무조건 안전대(Harness) 체결하기”를 끊임없이 강조하겠습니다. 꾸준한 TBM과 반복 훈련을 통해 안전 장비 착용을 습관화시키고, 계절별 맞춤 캠페인을 통해 안전이 생활 속 습관으로 자리 잡도록 하겠습니다."
    },
    {
      id: 5,
      title: "[소통 및 중재 역량]",
      main: "공기 단축이나 원가 절감을 중시하는 현장 시공팀(소장)과 안전 규정을 지켜야 하는 안전팀 간에는 갈등이 발생하기 쉽습니다. 이를 어떻게 조율하시겠습니까?",
      intent: "공정과 안전의 충돌 상황에서 타 부서 및 협력업체를 논리적으로 설득하고 중재하는 능력을 평가합니다.",
      modelAnswer: "안전은 결국 소통이며 혼자 만드는 것이 아님을 명심하겠습니다. 시공팀의 일정 압박을 이해하는 입장에서 대화하되, 사고 발생 시 초래될 엄청난 손실을 논리적으로 설명하겠습니다. '현장은 단단하게 원칙을 지키고, 팀과 부서 간 소통은 부드럽게 조율하는 중재자' 역할을 수행하겠습니다."
    },
    {
      id: 6,
      title: "[조직문화 적응 및 건설적 피드백]",
      main: "우리 본사 전담팀은 아이디어를 편하게 제안하고 반대 의견도 자유롭게 오가는 분위기입니다. 본인의 방식과 다른 현장 소장이나 상급자의 의견을 대할 때 어떻게 대처하시겠습니까?",
      intent: "수평적 커뮤니케이션 태도와 열린 사고방식을 평가합니다.",
      modelAnswer: "각자의 시선과 현장 경험을 존중하며 유연하게 의견을 나누는 것이 창의적인 안전 대책을 만든다고 생각합니다. 이견이 있을 때는 감정적으로 대응하지 않고, 서로 다름을 인정하는 편안한 분위기 속에서 객관적 데이터를 바탕으로 건설적인 피드백을 주고받겠습니다."
    },
    {
      id: 7,
      title: "[직무 비전 및 철학]",
      main: "건설 안전보건 업무를 통해 회사에서 궁극적으로 이루고 싶은 꿈이나 목표는 무엇입니까?",
      intent: "근로자 보호에 대한 사명감과 조직 전체의 안전 문화를 이끄는 비전을 확인합니다.",
      modelAnswer: "가장 큰 목표는 '사고 없는 건설 현장'을 만드는 것입니다. 거칠고 위험한 건설 현장이지만, 임직원과 일용직 근로자 모두가 안전을 '번거로운 규정'이 아닌 '일상의 당연한 기본'으로 받아들이는 문화를 정착시키는 것이 제 꿈입니다."
    },
    {
      id: 8,
      title: "[자기 계발 및 전문성 강화]",
      main: "건설 안전 분야의 전문성을 유지하고 고도화하기 위해 평소 어떤 노력을 하고 있습니까?",
      intent: "지속적인 학습 태도와 안전보건 트렌드 파악 능력을 평가합니다.",
      modelAnswer: "빈번하게 바뀌는 산안법 및 중처법 등 관련 법령을 정기적으로 학습하여 현장의 기준을 선제적으로 캐치하고 있습니다. 또한, 타 건설사의 중대재해 사례나 신공법 도입에 따른 새로운 위험 요소를 지속적으로 연구하고 접목할 방법을 고민하고 있습니다."
    },
    {
      id: 9,
      title: "[직무 준비도]",
      main: "고위험 작업이 많은 건설 현장의 안전관리를 성공적으로 수행하기 위해 지금까지 어떤 준비를 해오셨습니까?",
      intent: "실무 투입 전 갖춰야 할 기본 법적 지식과 현장 이해도를 확인합니다.",
      modelAnswer: "법령의 기본 개념을 명확히 익히고, 전문성의 지표가 되는 건설안전기사 및 산업안전기사 자격증을 취득했습니다. 무엇보다 건설 현장에서 아르바이트나 인턴 등을 통해 실제 현장의 공기와 분위기, 작업자들의 성향을 직접 겪어보며 살아있는 실무 감각을 키워왔습니다."
    },
    {
      id: 10,
      title: "[직무 동기 및 보람]",
      main: "건설 현장에서는 수시로 작업자들을 통제하고 쓴소리를 해야 합니다. 본인이 안전보건관리자로서 가장 큰 보람을 느끼는 순간은 언제라고 생각하십니까?",
      intent: "직무의 고충을 이겨내는 사명감과 사람 중심의 가치관을 확인합니다.",
      modelAnswer: "이 직무는 단순히 현장을 돌며 안전모를 씌우는 일이 아니라, 사람의 생명을 지키는 일입니다. 제가 선제적으로 위험 요소를 차단한 후, 근로자분들이 '덕분에 오늘도 무사히 일하고 퇴근한다'라고 말씀해 주실 때 가장 큰 보람을 느끼리라 확신합니다."
    }
  ];

  const handleScoreSelect = async (score) => {
    // 1. 점수 상태 업데이트
    const qId = BARS_QUESTIONS[currentStep].id;
    setEvaluations(prev => ({ ...prev, [qId]: score }));

    // 2. 처음 점수를 매기는 경우(현재 상태가 pending인 경우) DB 상태를 'interviewing'으로 변경
    if (candidate.status === 'pending') {
      try {
        await hiringService.updateCandidateStatus(candidate.id, 'interviewing');
        // 부모 컴포넌트에 상태 변경 알림
        if (onStatusChange) onStatusChange('interviewing');
      } catch (error) {
        console.error('Failed to update status to interviewing:', error);
      }
    }
  };

  const handleSave = async () => {
    if (Object.values(evaluations).some(score => score === 0)) {
      alert('다차원(BARS) 역량 진단 탭에서 5가지 항목의 모든 점수를 선택해 주세요.');
      return;
    }

    setIsSaving(true);
    try {
      await hiringService.saveInterviewEvaluation(
        candidate.id, 
        'admin', 
        evaluations, 
        feedback
      );
      alert('평가가 성공적으로 저장되었습니다.');
      // 3. 부모 컴포넌트의 새로고침 및 전환 로직이 완료될 때까지 대기
      await onSaveSuccess();
      // onClose()를 여기서 호출하지 않음 (onSaveSuccess 내부에서 viewMode를 'report'로 직접 변경하므로)
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentQ = BARS_QUESTIONS[currentStep];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-blue-50 border border-slate-200 w-full max-w-6xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl font-sans antialiased">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center font-black text-blue-600 text-xl border border-blue-200">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">{candidate.name} - 전문 역량 및 실무 진단</h2>
              <p className="text-slate-500 text-sm font-bold mt-1 uppercase tracking-widest">안전보건 전담팀 채용 면접 페이지</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-full text-slate-500 hover:text-slate-900 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Custom Tabs */}
        <div className="flex border-b border-slate-200 bg-white/40 px-6 pt-4 gap-6">
          <button
            onClick={() => setActiveTab('bars')}
            className={`flex items-center gap-2 pb-4 font-bold text-sm transition-colors border-b-2 ${
              activeTab === 'bars' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Target size={18} /> 다차원(BARS) 역량 진단
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 pb-4 font-bold text-sm transition-colors border-b-2 ${
              activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutList size={18} /> 실무 심도 질의응답 (10문항)
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Flow */}
          <div className="flex-1 p-8 overflow-y-auto border-r border-slate-200 custom-scrollbar bg-white">
            
            {activeTab === 'bars' ? (
              <div className="animate-fadeIn">
                <div className="mb-8">
                  {/* Progress Info */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold uppercase tracking-wider border border-blue-100">
                      Step {currentStep + 1} of 5
                    </span>
                    <div className="flex gap-1 h-2">
                      {BARS_QUESTIONS.map((_, i) => (
                        <div key={i} className={`w-8 rounded-full ${i <= currentStep ? 'bg-blue-600' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                  </div>

                  <h3 className="text-3xl font-black text-slate-900 mb-6 leading-tight">
                    {currentQ.title}
                  </h3>
                  
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
                    <p className="text-lg text-slate-700 font-bold mb-4">
                      "{currentQ.main}"
                    </p>
                    <div className="flex items-start gap-3 text-blue-700 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <MessageSquare size={18} className="mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium"><strong>탐침 질문:</strong> {currentQ.probing}</p>
                    </div>
                  </div>

                  {/* BARS Descriptor */}
                  <h4 className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <AlertCircle size={16} /> BARS 평가 지표 기준
                  </h4>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((score) => (
                      <div 
                        key={score}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          evaluations[currentQ.id] === score 
                            ? 'bg-blue-50/80 border-blue-400 shadow-md transform scale-[1.01]' 
                            : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                        onClick={() => handleScoreSelect(score)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                              evaluations[currentQ.id] === score ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {score}
                            </div>
                            <span className={`font-bold ${
                              evaluations[currentQ.id] === score ? 'text-blue-900' : 'text-slate-600'
                            }`}>
                              {score === 5 ? '탁월 (Outstanding)' : 
                               score === 4 ? '우수 (Exceeds)' : 
                               score === 3 ? '보통 (Meets)' : 
                               score === 2 ? '미흡 (Needs Imp.)' : '부적합 (Unacceptable)'}
                            </span>
                          </div>
                          {evaluations[currentQ.id] === score && <Star size={20} className="text-blue-500 fill-blue-500" />}
                        </div>
                        <p className={`mt-3 text-sm ml-14 font-medium ${
                          evaluations[currentQ.id] === score ? 'text-blue-700' : 'text-slate-500'
                        }`}>
                          {currentQ.bars[score]}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* BARS Navigation */}
                  <div className="mt-8 flex gap-3">
                    <button 
                      disabled={currentStep === 0}
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-all rounded-xl font-bold text-slate-700 flex items-center justify-center gap-2"
                    >
                      이전 단계
                    </button>
                    {currentStep < BARS_QUESTIONS.length - 1 ? (
                      <button 
                        onClick={() => setCurrentStep(prev => prev + 1)}
                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 transition-all rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                      >
                        다음 단계
                      </button>
                    ) : (
                      <button 
                        onClick={() => setActiveTab('general')}
                        className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 transition-all rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                      >
                        실무 질의응답 탭으로 이동
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900">현장 실무 심도 질문 목록</h3>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg uppercase tracking-wider border border-indigo-100">10 Questions</span>
                </div>
                <p className="text-slate-500 mb-8 font-medium">후보자의 실질적인 현장 대처 능력과 직무 상식을 검증하기 위한 10문항입니다. 자유롭게 질문하고 참고용 모범 답안과 비교하여 메모란에 피드백을 기록해 주세요.</p>
                
                <div className="space-y-4">
                  {GENERAL_QUESTIONS.map((q) => (
                    <div 
                      key={q.id} 
                      className={`border rounded-2xl overflow-hidden transition-all duration-300 ${expandedGeneralId === q.id ? 'border-indigo-300 bg-indigo-50/10 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'}`}
                    >
                      <div 
                        className="p-5 flex gap-4 items-start cursor-pointer"
                        onClick={() => setExpandedGeneralId(q.id === expandedGeneralId ? null : q.id)}
                      >
                        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl font-black text-sm ${expandedGeneralId === q.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {q.id}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-sm font-bold mb-1 uppercase tracking-widest ${expandedGeneralId === q.id ? 'text-indigo-600' : 'text-slate-500'}`}>{q.title}</h4>
                          <p className={`font-bold leading-relaxed ${expandedGeneralId === q.id ? 'text-slate-900' : 'text-slate-700'}`}>{q.main}</p>
                        </div>
                        <div className="mt-1">
                          {expandedGeneralId === q.id ? <ChevronUp className="text-indigo-500" /> : <ChevronDown className="text-slate-400" />}
                        </div>
                      </div>

                      {expandedGeneralId === q.id && (
                        <div className="px-5 pb-5 pt-2 ml-12 border-t border-indigo-100/50 border-dashed">
                          <div className="mt-4 p-4 bg-white rounded-xl border border-slate-100 mb-3 shadow-sm">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Target size={12}/> 평가 의도</span>
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">{q.intent}</p>
                          </div>
                          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 shadow-sm">
                            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 mb-2"><MessageSquare size={12}/> 참고 모범 답안</span>
                            <p className="text-sm font-medium text-indigo-900 leading-relaxed">{q.modelAnswer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Summary & Notes */}
          <div className="w-[360px] bg-slate-50/50 p-8 flex flex-col">
            <h4 className="text-sm font-black text-slate-500 mb-6 uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} /> 면접 요약 및 종합 점수
            </h4>
            
            <div className="flex-1 flex flex-col">
              <label className="text-xs font-bold text-slate-600 block mb-2 uppercase tracking-widest">종합 평가 의견 (정성 피드백)</label>
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="후보자의 10문항 직무 질의응답 결과와 BARS 역량에 대한 코멘트를 종합하여 기록해 주세요."
                className="w-full h-48 bg-white border border-slate-200 rounded-2xl p-5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar resize-none mb-6 placeholder-slate-400 shadow-sm"
              />

              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">BARS 다차원 평가 합산 점수</p>
                  <p className="text-4xl font-black text-blue-600">
                    {evaluations.q1 + evaluations.q2 + evaluations.q3 + evaluations.q4 + evaluations.q5} 
                    <span className="text-sm font-bold text-slate-400 ml-2">/ 25 points</span>
                  </p>
                </div>
                
                <div className="flex items-start gap-3 text-xs font-bold text-slate-500 bg-blue-50/50 p-4 rounded-xl border border-blue-100 leading-relaxed">
                  <Info size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
                  <span>BARS 항목을 모두 채점하고, 종합 의견을 작성하신 후 '최종 저장' 버튼을 클릭하시면 평가가 기록됩니다.</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 bg-slate-900 hover:bg-black transition-all rounded-xl font-bold text-white shadow-xl flex items-center justify-center gap-2 active:scale-95"
              >
                <Save size={18} />
                {isSaving ? '저장 중...' : '면접 완료 및 점수 최종 저장'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPanel;
