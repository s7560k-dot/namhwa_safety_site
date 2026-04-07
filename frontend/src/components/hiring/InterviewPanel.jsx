import React, { useState } from 'react';
import { hiringService } from '../../services/hiringService';
import { Star, MessageSquare, AlertCircle, Save, X, Info } from 'lucide-react';

const InterviewPanel = ({ candidate, onClose, onSaveSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [evaluations, setEvaluations] = useState({ q1: 0, q2: 0, q3: 0 });
  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const QUESTIONS = [
    {
      id: 'q1',
      title: '1. 위험성평가 및 전문성 (Risk Assessment)',
      main: "과거 건설 현장이나 사업장에서 위험성평가를 통해 숨겨진 위험 요인을 도출한 경험을 말씀해 주십시오. 만약 실질적인 반대에 부딪혔다면 어떻게 극복하셨습니까?",
      probing: "상상했던 대안은 무엇이었으며, 경영진의 지원이나 예산은 어떻게 이끌어 냈습니까?",
      bars: {
        5: "데이터 기반 예측 및 전사적 리스크 체계 고도화",
        4: "다각도 분석 및 실현 가능한 최상 개선책 수립",
        3: "매뉴얼 준수 및 적절한 안전 조치 수행",
        2: "단편적 분석 및 상급자의 잦은 수정 필요",
        1: "위험 요인 간과 및 법적 의무 미숙지"
      }
    },
    {
      id: 'q2',
      title: '2. 현장 소통 및 갈등 관리 (Collaboration)',
      main: "수급업체의 안전보건 역량이 부족하다고 판단되었을 때, 이들의 수준을 끌어올리기 위해 직접 지도했던 사례를 설명해 주십시오.",
      probing: "미달 업체에 대한 조치와 실질적인 행동 변화 확인 방법은 무엇이었습니까?",
      bars: {
        5: "윈-윈 대안 제시 및 자발적 참여 유도",
        4: "법적 근거 및 데이터 기반 협력 문화 조성",
        3: "기본 평가 지표 활용 및 원만한 조율",
        2: "일방적 규정 강요 및 소통 단절 초래",
        1: "갈등 방치 및 소통 능력 현저히 부족"
      }
    },
    {
      id: 'q3',
      title: '3. 위기대응 및 하도급 상생 (Crisis & Partners)',
      main: "예상치 못한 비상 상황이나 사고 발생 시, 가장 먼저 취했던 조치와 근본 원인을 분석하여 재발방지 대책을 수립한 경험을 말씀해 주십시오.",
      probing: "시스템적인 근본 원인(Root Cause)은 무엇이었으며 대책 후 효과 측정법은 무엇입니까?",
      bars: {
        5: "선제적 파악 및 완벽한 통제력/재발방지 구현",
        4: "근본 원인 분석 후 전국 현장 수평 전개",
        3: "매뉴얼 절차에 따른 무난한 조치",
        2: "표면적 원인(근로자 탓) 분석에 머물름",
        1: "절차 위반/은폐 시도 및 관리 방치"
      }
    }
  ];

  const handleScoreSelect = (score) => {
    const qId = QUESTIONS[currentStep].id;
    setEvaluations(prev => ({ ...prev, [qId]: score }));
  };

  const handleSave = async () => {
    if (evaluations.q1 === 0 || evaluations.q2 === 0 || evaluations.q3 === 0) {
      alert('모든 역량에 대한 점수를 선택해 주세요.');
      return;
    }

    setIsSaving(true);
    try {
      await hiringService.saveInterviewEvaluation(
        candidate.id, 
        'admin', // 임시 면접관 ID
        evaluations, 
        feedback
      );
      alert('평가가 성공적으로 저장되었습니다.');
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentQ = QUESTIONS[currentStep];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#1a1d27] border border-gray-800 w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#1e222d]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-xl">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{candidate.name} - 전문 역량 진단</h2>
              <p className="text-gray-400 text-sm">안전보건 전담팀 다차원 평가 인터페이스</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex w-full h-1 bg-gray-800">
          {QUESTIONS.map((_, i) => (
            <div 
              key={i} 
              className={`h-full transition-all duration-500 ${i <= currentStep ? 'bg-indigo-500' : 'bg-transparent'}`}
              style={{ width: `${100 / QUESTIONS.length}%` }}
            />
          ))}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Questions & BARS */}
          <div className="flex-1 p-8 overflow-y-auto border-r border-gray-800 custom-scrollbar">
            <div className="mb-8">
              <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold mb-4 uppercase tracking-tighter">
                Question {currentStep + 1} of 3
              </span>
              <h3 className="text-2xl font-bold text-white mb-6 leading-tight">
                {currentQ.title}
              </h3>
              
              <div className="bg-[#0f1117] p-6 rounded-2xl border border-gray-800 mb-6">
                <p className="text-lg text-gray-300 leading-relaxed mb-4 italic">
                  "{currentQ.main}"
                </p>
                <div className="flex items-start gap-2 text-indigo-400 bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                  <MessageSquare size={18} className="mt-1 flex-shrink-0" />
                  <p className="text-sm font-medium">탐침 질문: {currentQ.probing}</p>
                </div>
              </div>

              {/* BARS Descriptor */}
              <h4 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2">
                <AlertCircle size={16} /> BARS 기반 평가 지표 (점수별 행동 특성)
              </h4>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((score) => (
                  <div 
                    key={score}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      evaluations[currentQ.id] === score 
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                        : 'bg-[#1a1d27] border-gray-800 hover:border-gray-700'
                    }`}
                    onClick={() => handleScoreSelect(score)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          evaluations[currentQ.id] === score ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {score}
                        </div>
                        <span className={`font-medium ${
                          evaluations[currentQ.id] === score ? 'text-indigo-200' : 'text-gray-400'
                        }`}>
                          {score === 5 ? '탁월 (Outstanding)' : 
                           score === 4 ? '우수 (Exceeds)' : 
                           score === 3 ? '보통 (Meets)' : 
                           score === 2 ? '미흡 (Needs Imp.)' : '부적합 (Unacceptable)'}
                        </span>
                      </div>
                      {evaluations[currentQ.id] === score && <Star size={18} className="text-indigo-400 fill-indigo-400" />}
                    </div>
                    <p className={`mt-2 text-xs ml-11 ${
                      evaluations[currentQ.id] === score ? 'text-indigo-300/80' : 'text-gray-500'
                    }`}>
                      {currentQ.bars[score]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Summary & Notes */}
          <div className="w-80 bg-[#141721] p-6 flex flex-col border-l border-gray-800/50">
            <h4 className="text-sm font-bold text-gray-500 mb-6 uppercase tracking-wider">면접 요약 및 메모</h4>
            
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-2">종합 평가 의견 (정성 피드백)</label>
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="후보자의 직무 전문성, 태도, 위험 관리 철학 등에 대한 코멘트를 남겨주세요."
                className="w-full h-40 bg-[#0f1117] border border-gray-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 custom-scrollbar resize-none mb-6"
              />

              <div className="space-y-4">
                <div className="bg-[#1a1d27] p-4 rounded-xl border border-gray-800">
                  <p className="text-xs text-gray-400 mb-2">현재 합계 점수</p>
                  <p className="text-3xl font-bold text-indigo-400">
                    {evaluations.q1 + evaluations.q2 + evaluations.q3} 
                    <span className="text-xs text-gray-500 ml-2">/ 15 points</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                  <Info size={14} className="flex-shrink-0" />
                  <span>모든 질문에 대한 점수 선택 시 저장이 활성화됩니다.</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6">
              <div className="flex gap-2">
                <button 
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 transition-all rounded-xl font-bold text-sm"
                >
                  이전
                </button>
                {currentStep < QUESTIONS.length - 1 ? (
                  <button 
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-xl font-bold text-sm"
                  >
                    다음
                  </button>
                ) : (
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-500 transition-all rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                  >
                    <Save size={18} />
                    {isSaving ? '저장 중...' : '최종 저장'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPanel;
