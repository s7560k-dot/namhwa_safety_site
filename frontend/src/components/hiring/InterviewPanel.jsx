import React, { useState, useEffect } from 'react';
import { hiringService } from '../../services/hiringService';
import {
  MULTIDIM_QUESTIONS,
  MULTIDIM_CATEGORIES,
  calcMultiDimScore,
} from '../../constants/hiringConstants';
import {
  Save, X, Info, Target, ChevronDown, ChevronUp, FileText,
  MessageSquare, AlertCircle, BookOpen, ShieldAlert, Users, Scale,
} from 'lucide-react';

// 카테고리별 시각 스타일 + 아이콘 (A 산안법 / B 중처법 / C 현장실무 / D 조직적합성)
const CATEGORY_STYLE = {
  a: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', activeBorder: 'border-blue-600', dot: 'bg-blue-600', icon: BookOpen },
  b: { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', activeBorder: 'border-rose-600', dot: 'bg-rose-600', icon: Scale },
  c: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', activeBorder: 'border-emerald-600', dot: 'bg-emerald-600', icon: ShieldAlert },
  d: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', activeBorder: 'border-amber-600', dot: 'bg-amber-600', icon: Users },
};

const TYPE_LABEL = { knowledge: '지식형', scenario: '시나리오형', behavior: 'BARS 행동형', general: '정성 평가' };

const buildInitialEvaluations = () =>
  MULTIDIM_QUESTIONS.reduce((acc, q) => {
    acc[q.id] = 0;
    return acc;
  }, {});

const InterviewPanel = ({ candidate, onClose, onSaveSuccess, onStatusChange }) => {
  const [activeCategory, setActiveCategory] = useState('a');
  const [expandedId, setExpandedId] = useState(MULTIDIM_QUESTIONS[0].id);
  const [evaluations, setEvaluations] = useState(buildInitialEvaluations);
  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [existingReportId, setExistingReportId] = useState(null);

  useEffect(() => {
    if (candidate.status === 'completed') {
      const fetchExistingData = async () => {
        try {
          const reports = await hiringService.getCandidateReport(candidate.id);
          if (reports && reports.length > 0) {
            const report = reports[0];
            setExistingReportId(report.id);
            if (report.evaluations) {
              // 기존 리포트가 구(q1~q5) 형식이면 일치하는 키가 없어 그대로 0점부터 시작함(재채점 필요)
              setEvaluations(prev => ({ ...prev, ...report.evaluations }));
            }
            if (report.feedback) {
              setFeedback(report.feedback);
            }
          }
        } catch (err) {
          console.error("Failed to load existing report data", err);
        }
      };
      fetchExistingData();
    }
  }, [candidate.id, candidate.status]);

  const handleScoreSelect = async (qId, score) => {
    setEvaluations(prev => ({ ...prev, [qId]: score }));

    if (candidate.status === 'pending') {
      try {
        await hiringService.updateCandidateStatus(candidate.id, 'interviewing');
        if (onStatusChange) onStatusChange('interviewing');
      } catch (error) {
        console.error('Failed to update status to interviewing:', error);
      }
    }
  };

  const handleSave = async () => {
    if (Object.values(evaluations).some(score => score === 0)) {
      alert('다차원 역량진단의 16개 문항을 모두 채점해 주세요.');
      return;
    }

    setIsSaving(true);
    try {
      await hiringService.saveInterviewEvaluation(
        candidate.id,
        'admin',
        evaluations,
        feedback,
        existingReportId
      );
      alert('평가가 성공적으로 저장되었습니다.');
      await onSaveSuccess();
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const scores = calcMultiDimScore(evaluations);
  const categoryQuestions = MULTIDIM_QUESTIONS.filter(q => q.category === activeCategory);
  const answeredCount = Object.values(evaluations).filter(v => v > 0).length;
  // 피드백 작성 가이드에서 "지금 가장 낮은 영역"을 짚어주기 위한 계산
  const weakestCategory = MULTIDIM_CATEGORIES.reduce((min, cat) =>
    scores.byCategory[cat.key] < scores.byCategory[min.key] ? cat : min
  , MULTIDIM_CATEGORIES[0]);

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
              <p className="text-slate-500 text-sm font-bold mt-1 uppercase tracking-widest">안전보건 전담팀 채용 면접 · 다차원 역량진단 (16문항)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-full text-slate-500 hover:text-slate-900 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-slate-200 bg-white/40 px-6 pt-4 gap-3 overflow-x-auto">
          {MULTIDIM_CATEGORIES.map(cat => {
            const style = CATEGORY_STYLE[cat.key];
            const Icon = style.icon;
            const qs = MULTIDIM_QUESTIONS.filter(q => q.category === cat.key);
            const done = qs.filter(q => evaluations[q.id] > 0).length;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-2 pb-4 pt-1 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${
                  isActive ? `${style.activeBorder} ${style.text}` : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={16} /> {cat.label}
                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md ${isActive ? `${style.bg} ${style.text}` : 'bg-slate-100 text-slate-400'}`}>
                  {cat.weight}% · {done}/{qs.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left: Question list for active category */}
          <div className="flex-1 p-8 overflow-y-auto border-r border-slate-200 custom-scrollbar bg-white">
            <div className="space-y-4">
              {categoryQuestions.map((q) => {
                const style = CATEGORY_STYLE[q.category];
                const isOpen = expandedId === q.id;
                const score = evaluations[q.id];
                return (
                  <div
                    key={q.id}
                    className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                      isOpen ? `${style.border} bg-white shadow-md` : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="p-5 flex gap-4 items-start cursor-pointer" onClick={() => setExpandedId(isOpen ? null : q.id)}>
                      <div className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl font-black text-xs ${isOpen ? `${style.dot} text-white` : 'bg-slate-100 text-slate-500'}`}>
                        {q.id.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{TYPE_LABEL[q.type]}</span>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{q.title}</h4>
                        </div>
                        <p className="font-bold leading-relaxed text-slate-800">{q.main}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black ${score ? `${style.dot} text-white` : 'bg-slate-100 text-slate-300'}`}>
                          {score || '–'}
                        </div>
                        {isOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                      </div>
                    </div>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-3 ml-12 border-t border-slate-100 border-dashed">
                        {q.probing && (
                          <div className="flex items-start gap-2 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 my-3 text-sm">
                            <MessageSquare size={16} className="mt-0.5 flex-shrink-0" />
                            <p><strong>탐침 질문:</strong> {q.probing}</p>
                          </div>
                        )}

                        {q.keywords && (
                          <div className="my-3">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <Target size={12} /> 채점 키워드 (언급 개수로 판단)
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {q.keywords.map((k, i) => (
                                <span key={i} className={`text-xs font-bold px-3 py-1 rounded-full ${style.bg} ${style.text}`}>{k}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {q.bars && (
                          <div className="my-3 space-y-1.5">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                              <AlertCircle size={12} /> BARS 평가 지표
                            </p>
                            {[5, 4, 3, 2, 1].map(s => (
                              <p key={s} className="text-xs text-slate-500 leading-relaxed">
                                <b className={style.text}>{s}점</b> — {q.bars[s]}
                              </p>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          {[1, 2, 3, 4, 5].map(s => (
                            <button
                              key={s}
                              onClick={() => handleScoreSelect(q.id, s)}
                              className={`flex-1 py-3 rounded-xl font-black text-sm border transition-all ${
                                score === s ? `${style.dot} text-white border-transparent shadow-md` : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Summary & Notes */}
          <div className="w-[360px] bg-slate-50/50 p-8 flex flex-col overflow-y-auto">
            <h4 className="text-sm font-black text-slate-500 mb-6 uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} /> 면접 요약 및 종합 점수
            </h4>

            <div className="space-y-2 mb-6">
              {MULTIDIM_CATEGORIES.map(cat => {
                const style = CATEGORY_STYLE[cat.key];
                const val = scores.byCategory[cat.key];
                return (
                  <div key={cat.key} className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-2.5">
                    <span className={`text-xs font-bold ${style.text}`}>
                      {cat.label} <span className="text-slate-400 font-medium">({cat.weight}%)</span>
                    </span>
                    <span className="font-black text-slate-800">
                      {val.toFixed(1)} <span className="text-slate-400 text-xs font-bold">/ 5</span>
                    </span>
                  </div>
                );
              })}
            </div>

            <label className="text-xs font-bold text-slate-600 block mb-2 uppercase tracking-widest">종합 평가 의견 (정성 피드백)</label>

            {/* 강점만 나열하거나 인상 위주로 흐르지 않도록, 세 요소를 균형 있게 채우도록 안내 */}
            <div className="mb-3 p-4 bg-amber-50/60 border border-amber-100 rounded-xl">
              <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Info size={12} /> 균형있는 피드백 작성 가이드
              </p>
              <ul className="text-xs text-amber-800 space-y-1.5 leading-relaxed font-medium list-none">
                <li><b>① 강점</b> — 어느 영역에서 특히 좋았는지, 실제 답변 내용을 근거로 적어주세요.</li>
                <li>
                  <b>② 보완점</b> — 가장 낮은 점수를 받은 영역과 그 이유를 적어주세요.
                  {answeredCount > 0 && (
                    <> <span className="inline-block bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-bold">
                      현재 최저 영역: {weakestCategory.label} {scores.byCategory[weakestCategory.key].toFixed(1)}점
                    </span></>
                  )}
                </li>
                <li><b>③ 채용 의견</b> — 조건부 채용이라면 어떤 보완이 필요한지까지 구체적으로 적어주세요.</li>
              </ul>
            </div>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="① 강점: 어느 영역에서 어떤 답변이 좋았는지&#10;② 보완점: 가장 낮은 영역과 그 이유&#10;③ 채용 의견: 조건부 채용 시 필요한 보완 조건"
              className="w-full h-32 bg-white border border-slate-200 rounded-2xl p-5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar resize-none mb-6 placeholder-slate-400 shadow-sm"
            />

            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">다차원 역량진단 가중 종합점수</p>
                <p className="text-4xl font-black text-blue-600">
                  {scores.total}
                  <span className="text-sm font-bold text-slate-400 ml-2">/ 100 points</span>
                </p>
                <p className="text-[11px] text-slate-400 font-bold mt-1">채점 진행 {answeredCount} / {MULTIDIM_QUESTIONS.length}</p>
              </div>

              <div className="flex items-start gap-3 text-xs font-bold text-slate-500 bg-blue-50/50 p-4 rounded-xl border border-blue-100 leading-relaxed">
                <Info size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
                <span>16개 문항을 모두 채점하고 종합 의견을 작성하신 후 '최종 저장' 버튼을 클릭하시면 평가가 기록됩니다.</span>
              </div>
            </div>

            <div className="pt-6 mt-auto">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 bg-slate-900 hover:bg-black transition-all rounded-xl font-bold text-white shadow-xl flex items-center justify-center gap-2 active:scale-95"
              >
                <Save size={18} />
                {isSaving ? '저장 중...' : (existingReportId ? '면접 평가 결과 갱신' : '면접 완료 및 점수 최종 저장')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPanel;
