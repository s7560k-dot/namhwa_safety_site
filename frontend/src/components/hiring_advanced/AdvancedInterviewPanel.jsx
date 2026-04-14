import React, { useState } from 'react';
import { hiringService } from '../../services/hiringService';
import { 
  APPEARANCE_ITEMS, 
  COMPETENCY_ITEMS, 
  NEW_ENTRY_LIFE_QUESTIONS, 
  EXPERIENCED_CAREER_EVAL, 
  SAFETY_TECH_QUESTIONS 
} from '../../constants/hiringConstants';
import { 
  Star, MessageSquare, AlertCircle, Save, X, Info, Target, 
  LayoutList, ChevronDown, ChevronUp, FileText, User, 
  Briefcase, ShieldCheck, PenTool 
} from 'lucide-react';

const AdvancedInterviewPanel = ({ candidate, onClose, onSaveSuccess, onStatusChange }) => {
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'specific' | 'safety'
  const [isSaving, setIsSaving] = useState(false);
  
  // 평가 데이터 상태
  const [appearanceScores, setAppearanceScores] = useState({}); // A, B, C
  const [competencyScores, setCompetencyScores] = useState({}); // 1~5 (ABCDE)
  const [specificAnswers, setSpecificAnswers] = useState({}); // Answers for specific questions
  const [safetyTechScores, setSafetyTechScores] = useState({}); // Scores for tech safety (1~5)
  const [feedback, setFeedback] = useState('');
  const [interviewerName, setInterviewerName] = useState('');

  const isExperienced = candidate.type === 'experienced';

  const handleScoreSelect = async (category, id, score) => {
    // 처음 점수를 매기는 경우 DB 상태를 'interviewing'으로 변경
    if (candidate.status === 'pending') {
      try {
        await hiringService.updateCandidateStatus(candidate.id, 'interviewing');
        if (onStatusChange) onStatusChange('interviewing');
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    }

    if (category === 'appearance') {
      setAppearanceScores(prev => ({ ...prev, [id]: score }));
    } else if (category === 'competency') {
      setCompetencyScores(prev => ({ ...prev, [id]: score }));
    } else if (category === 'safety') {
      setSafetyTechScores(prev => ({ ...prev, [id]: score }));
    }
  };

  const handleSave = async () => {
    if (!interviewerName.trim()) {
      alert('면접관 성함을 입력해 주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const evaluationData = {
        appearance: appearanceScores,
        competency: competencyScores,
        specific: specificAnswers,
        safetyTech: safetyTechScores,
        feedback,
        interviewerName
      };

      await hiringService.saveInterviewEvaluation(candidate.id, 'admin', evaluationData);
      alert('평가가 성공적으로 저장되었습니다.');
      await onSaveSuccess();
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 렌더링 헬퍼: ABCDE 척도 버튼
  const RenderABCDE = ({ id, currentScore, category }) => (
    <div className="flex gap-1">
      {['E', 'D', 'C', 'B', 'A'].map((label, index) => {
        const score = index + 1;
        const isActive = currentScore === score;
        return (
          <button
            key={label}
            onClick={() => handleScoreSelect(category, id, score)}
            className={`w-10 h-10 rounded-lg font-bold text-xs transition-all border ${
              isActive 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  // 렌더링 헬퍼: ABC 척도 버튼
  const RenderABC = ({ item, currentScore }) => (
    <div className="flex flex-col gap-2">
      {['A', 'B', 'C'].map((label) => {
        const isActive = currentScore === label;
        return (
          <button
            key={label}
            onClick={() => handleScoreSelect('appearance', item.id, label)}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all text-sm ${
              isActive 
                ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold shadow-sm' 
                : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                {label}
              </div>
              {item.criteria[label]}
            </span>
            {isActive && <Star size={14} className="fill-blue-500 text-blue-500" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-7xl h-[95vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl font-sans antialiased">
        
        {/* Header (Rich Profile Info) */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/30">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white text-3xl shadow-xl shadow-blue-500/20">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-black text-slate-900">{candidate.name}</h2>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  isExperienced ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                }`}>
                  {isExperienced ? '경력사원 (Experienced)' : '신입사원 (New Entry)'}
                </span>
                <span className="text-slate-400 font-bold text-sm">| 수험번호: {candidate.examNumber || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
                  <User size={14} className="text-slate-300" /> 최종학력: {candidate.finalEducation || '미입력'}
                </p>
                <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
                  <Briefcase size={14} className="text-slate-300" /> 지원직무: {candidate.position}
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200/50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-90">
            <X size={24} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-white px-8 pt-4 gap-8">
          {[
            { id: 'basic', label: '공통 역량 평가', icon: <Target size={18} /> },
            { id: 'specific', label: isExperienced ? '경력 세부 평가' : '가치관/생활환경', icon: <FileText size={18} /> },
            { id: 'safety', label: '안전보건 전문 기술', icon: <ShieldCheck size={18} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-5 font-bold text-sm transition-all border-b-2 relative ${
                activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
              }`}
            >
              {tab.icon} {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full blur-[1px]" />}
            </button>
          ))}
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/20">
            
            {/* 1. Basic Tab: Appearance & Competency */}
            {activeTab === 'basic' && (
              <div className="animate-fadeIn space-y-10">
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm">1</div>
                    <h3 className="text-xl font-black text-slate-900">외관 인상 평가 (A/B/C)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {APPEARANCE_ITEMS.map((item) => (
                      <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                        <RenderABC item={item} currentScore={appearanceScores[item.id]} />
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm">2</div>
                    <h3 className="text-xl font-black text-slate-900">인성 및 공통 역량 (ABCDE)</h3>
                  </div>
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">평가 항목</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">평가 척도</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {COMPETENCY_ITEMS.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-700">{item.label}</td>
                            <td className="px-6 py-4 flex justify-end">
                              <RenderABCDE id={item.id} category="competency" currentScore={competencyScores[item.id]} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {/* 2. Specific Tab: New Entry Life / Experienced Career */}
            {activeTab === 'specific' && (
              <div className="animate-fadeIn">
                {!isExperienced ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm">!</div>
                      <h3 className="text-xl font-black text-slate-900">학교 / 가정 / 기타 생활 환경</h3>
                    </div>
                    {NEW_ENTRY_LIFE_QUESTIONS.map((q) => (
                      <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{q.label}</label>
                        <p className="text-sm font-bold text-slate-700 mb-4">{q.question}</p>
                        <textarea 
                          className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                          placeholder="답변 내용을 기록하세요..."
                          value={specificAnswers[q.id] || ''}
                          onChange={(e) => setSpecificAnswers({...specificAnswers, [q.id]: e.target.value})}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-sm">K</div>
                      <h3 className="text-xl font-black text-slate-900">경력 세부 평가 및 근무 조건</h3>
                    </div>
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-8">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">직무 및 조직 역량</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">평가 (ABCDE)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {EXPERIENCED_CAREER_EVAL.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-700">{item.label}</td>
                              <td className="px-6 py-4 flex justify-end">
                                <RenderABCDE id={item.id} category="competency" currentScore={competencyScores[item.id]} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">희망 연봉 및 구체적 조건</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-bold text-slate-900 shadow-inner"
                          placeholder="예: 5,500만원 / 야근 가능"
                          value={specificAnswers.salary || ''}
                          onChange={(e) => setSpecificAnswers({...specificAnswers, salary: e.target.value})}
                        />
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">입사 가능 일자</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-bold text-slate-900 shadow-inner"
                          placeholder="예: 2026년 5월 1일"
                          value={specificAnswers.startDate || ''}
                          onChange={(e) => setSpecificAnswers({...specificAnswers, startDate: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Safety Tab: Technical Safety Questions */}
            {activeTab === 'safety' && (
              <div className="animate-fadeIn space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">S</div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">안전보건팀 다차원 전문 면접</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Technical Safety Special Section</p>
                  </div>
                </div>
                {SAFETY_TECH_QUESTIONS.map((q) => (
                  <div key={q.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <div>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider mb-2 inline-block">Technical Challenge</span>
                        <h4 className="text-base font-black text-slate-900 mb-2">{q.title}</h4>
                        <p className="text-sm font-bold text-slate-600 italic leading-relaxed">"{q.question}"</p>
                      </div>
                      <RenderABCDE id={q.id} category="safety" currentScore={safetyTechScores[q.id]} />
                    </div>
                    <textarea 
                      className="w-full h-24 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none shadow-inner"
                      placeholder="후보자의 답변 요지 및 기술적 강점을 메모하세요..."
                      value={specificAnswers[q.id] || ''}
                      onChange={(e) => setSpecificAnswers({...specificAnswers, [q.id]: e.target.value})}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Final Summary & Signature */}
          <div className="w-96 bg-slate-50/50 border-l border-slate-100 p-8 flex flex-col">
            <h4 className="text-xs font-black text-slate-400 mb-8 uppercase tracking-[0.2em] flex items-center gap-2">
              <PenTool size={14} /> 종합 평가 및 면접 완료
            </h4>

            <div className="flex-1 space-y-8">
              <div>
                <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-wider">종합 의견 (Total Evaluation)</label>
                <textarea 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="후보자에 대한 면접관의 최종 의견을 기술적으로 기록해 주세요."
                  className="w-full h-64 bg-white border border-slate-200 rounded-3xl p-6 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar resize-none placeholder-slate-300 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-wider">면접자 성함 (Signature)</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                    placeholder="성함을 입력하여 서명을 대신합니다"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-black text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded font-bold">(기명)</div>
                </div>
              </div>

              <div className="bg-blue-600/5 p-6 rounded-3xl border border-blue-100">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-blue-500 mt-0.5" />
                  <p className="text-[11px] font-bold text-blue-700 leading-relaxed">
                    모든 섹션의 평가를 마치고 서명을 완료하신 경우에만 '최종 저장'이 가능합니다. 이 데이터는 경영진 리포트로 자동 생성됩니다.
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="mt-8 w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Save size={20} />
              {isSaving ? '평가 데이터 전송 중...' : '평가 완료 및 최종 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedInterviewPanel;
