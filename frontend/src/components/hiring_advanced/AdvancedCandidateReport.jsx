import React, { useState, useEffect, useRef } from 'react';
import { hiringService } from '../../services/hiringService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { 
  Award, TrendingUp, AlertTriangle, FileText, Send, Download, 
  BrainCircuit, ChevronLeft, MessageSquare, X, Shield, 
  UserCheck, ClipboardCheck 
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  APPEARANCE_ITEMS, 
  COMPETENCY_ITEMS, 
  SAFETY_TECH_QUESTIONS 
} from '../../constants/hiringConstants';

const EmailPreviewModal = ({ candidate, reportData, aiSummary, onClose }) => {
  const [copied, setCopied] = useState(false);
  const { evaluationData, feedback, interviewerName } = reportData;

  const emailHtml = `
<div style="max-width: 650px; margin: 0; border: 1px solid #E0E0E0; border-radius: 8px; font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; overflow: hidden; background-color: #ffffff;">
  <div style="background-color: #0F172A; color: #FFFFFF; padding: 25px;">
    <h2 style="margin: 0; font-size: 18px; font-weight: normal; letter-spacing: -0.5px;">[보고] ${candidate.type === 'experienced' ? '경력' : '신입'} 지원자 ${candidate.name} 면접 결과 리포트</h2>
  </div>

  <div style="padding: 30px 25px; color: #333333; line-height: 1.6; font-size: 14px;">
    <p style="margin-top: 0;">임원진 여러분, 안녕하십니까. 안전보건팀입니다.</p>
    <p><b>${candidate.name}</b> 지원자(${candidate.position})의 고도화된 면접 평가 결과를 보고드립니다.</p>

    <div style="background-color: #F8FAFC; padding: 15px; border-left: 4px solid #3B82F6; margin: 20px 0;">
      <strong style="color: #1E40AF;">■ AI 통합 평가 요약</strong><br>
      ${aiSummary ? aiSummary : '상세 분석 데이터는 시스템 리포트를 참조하십시오.'}
    </div>

    <div style="margin: 20px 0; padding: 15px; border: 1px solid #E2E8F0; border-radius: 8px;">
      <strong style="color: #64748B;">[면접관 최종 피드백]</strong><br>
      <div style="margin-top: 10px; color: #1E293B; font-weight: bold;">
        "${feedback}"
      </div>
      <div style="margin-top: 10px; text-align: right; color: #94A3B8; font-size: 12px;">
        면접관: ${interviewerName} (기명 서명됨)
      </div>
    </div>
  </div>

  <div style="background-color: #F8FAFC; padding: 20px 25px; border-top: 1px solid #E2E8F0; font-size: 13px; color: #64748B;">
    <p style="margin: 0; font-weight: bold; color: #0F172A;">남화토건(주) 안전보건팀 채용 대시보드</p>
  </div>
</div>
  `;

  const handleCopy = async () => {
    try {
      const type = 'text/html';
      const blob = new Blob([emailHtml], { type });
      const data = [new ClipboardItem({ [type]: blob, 'text/plain': new Blob([emailHtml.replace(/<[^>]*>/g, '')], { type: 'text/plain' }) })];
      await navigator.clipboard.write(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-900">경영진 보고용 메일 양식</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50 flex justify-center">
          <div className="shadow-lg bg-white rounded-lg overflow-hidden shrink-0" dangerouslySetInnerHTML={{ __html: emailHtml }} />
        </div>
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
          <button onClick={handleCopy} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black transition-all ${copied ? 'bg-green-600' : 'bg-slate-900'} text-white`}>
            {copied ? '복사 완료!' : '본문 복사'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdvancedCandidateReport = ({ candidate, onClose }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await hiringService.getCandidateReport(candidate.id);
        if (data && data.length > 0) {
          setReportData(data[0]);
        }
      } catch (error) {
        console.error('Error fetching report:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [candidate.id]);

  const generateAiSummary = async () => {
    if (!reportData) return;
    setIsGeneratingAi(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
        안전보건팀 지원자 면접 평가 데이터 분석 보고서 작성해줘.
        이름: ${candidate.name}
        구분: ${candidate.type === 'experienced' ? '경력' : '신입'}
        직무: ${candidate.position}
        면접관 의견: ${reportData.feedback}
        평가 데이터: ${JSON.stringify(reportData.evaluationData)}
        
        형식:
        1. 핵심 강점 (건설안전 및 조직 역량 관점)
        2. 리스크 및 보완점
        3. 종합 채용 추천 의견
      `;

      const result = await model.generateContent(prompt);
      setAiSummary(result.response.text());
    } catch (error) {
      setAiSummary('AI 분석 생성 실패');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#f8fafc' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`면접리포트_${candidate.name}.pdf`);
    } catch (err) {
      alert('PDF 생성 실패');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center font-bold">로딩 중...</div>;
  if (!reportData) return <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center font-bold">평가 데이터가 없습니다.</div>;

  const { evaluationData } = reportData;
  
  // Radar Chart Data Calculation
  const calculateAvg = (obj) => {
    const vals = Object.values(obj || {});
    if (vals.length === 0) return 0;
    // A=5, B=4, C=3 (Appearance) or 1~5 (Competency)
    return vals.reduce((a, b) => {
      if (typeof b === 'string') return a + (b === 'A' ? 5 : b === 'B' ? 3 : 1);
      return a + b;
    }, 0) / vals.length;
  };

  const chartData = [
    { subject: '외관/인상', A: calculateAvg(evaluationData.appearance), fullMark: 5 },
    { subject: '인성/공통', A: calculateAvg(evaluationData.competency), fullMark: 5 },
    { subject: '전문 기술', A: calculateAvg(evaluationData.safetyTech), fullMark: 5 },
  ];

  return (
    <div className="fixed inset-0 bg-slate-50 z-[100] overflow-y-auto custom-scrollbar font-sans antialiased text-slate-900">
      <div className="max-w-5xl mx-auto p-4 md:p-12">
        <button onClick={onClose} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors mb-8 group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1" /> 목록으로 돌아가기
        </button>

        <div ref={reportRef} className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
          {/* Hero Section */}
          <div className="bg-slate-900 p-12 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-4xl font-black border border-white/20">
                  {candidate.name.charAt(0)}
                </div>
                <div>
                  <div className="flex gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-500 text-[10px] font-black uppercase tracking-widest rounded-full">{candidate.position}</span>
                    <span className="px-3 py-1 bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20">
                      {candidate.type === 'experienced' ? '경력 사원' : '신입 사원'}
                    </span>
                  </div>
                  <h1 className="text-5xl font-black tracking-tighter">{candidate.name} <span className="text-2xl font-medium text-white/40 italic">Candidate</span></h1>
                  <p className="mt-2 text-white/60 font-medium">수험번호: {candidate.examNumber || 'N/A'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">면접관 확인</p>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <p className="text-xl font-black text-blue-400">{reportData.interviewerName}</p>
                  <p className="text-[10px] font-bold text-white/30">(Digital Signature)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-12 space-y-12">
            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-widest"><TrendingUp size={20} className="text-blue-600"/> 다차원 역량 분석</h3>
                <div className="h-64 bg-slate-50 rounded-3xl p-4 border border-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                      <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                      <Radar name={candidate.name} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-widest"><BrainCircuit size={20} className="text-indigo-600"/> AI 분석 요약</h3>
                <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100 min-h-[256px]">
                  {aiSummary ? (
                    <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap font-medium">{aiSummary}</div>
                  ) : (
                    <button onClick={generateAiSummary} disabled={isGeneratingAi} className="w-full h-full flex flex-col items-center justify-center gap-4 text-indigo-400 font-bold hover:text-indigo-600 transition-colors">
                      <BrainCircuit size={48} />
                      {isGeneratingAi ? '분석 중...' : '신입/경력 통합 분석 실행'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Evaluation Content */}
            <div className="space-y-8">
              <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-widest"><ClipboardCheck size={20} className="text-blue-600"/> 세부 평가 항목</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">외관 인상 ({Object.keys(evaluationData.appearance || {}).length || 8}항목)</span>
                  <div className="text-3xl font-black text-slate-900">{chartData[0].A.toFixed(1)} <span className="text-sm font-bold text-slate-300">/ 5.0</span></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">직무/역량 평가 ({Object.keys(evaluationData.competency || {}).length || (candidate.type === 'experienced' ? 31 : 12)}항목)</span>
                  <div className="text-3xl font-black text-slate-900">{chartData[1].A.toFixed(1)} <span className="text-sm font-bold text-slate-300">/ 5.0</span></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">전문 기술 ({Object.keys(evaluationData.safetyTech || {}).length || 4}항목)</span>
                  <div className="text-3xl font-black text-slate-900">{chartData[2].A.toFixed(1)} <span className="text-sm font-bold text-slate-300">/ 5.0</span></div>
                </div>
              </div>
            </div>

            {/* Feedback Section */}
            <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-10">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3"><MessageSquare size={24} className="text-blue-600"/> 면접관 최종 피드백</h3>
              <p className="text-lg font-bold text-slate-800 leading-relaxed italic">"{reportData.feedback}"</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-12">
          <button onClick={handleDownloadPdf} disabled={isExporting} className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95">
            <Download size={20} /> {isExporting ? '생성 중...' : 'PDF 리포트 다운로드'}
          </button>
          <button onClick={() => setShowEmailModal(true)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-black shadow-xl shadow-slate-900/10 transition-all active:scale-95">
            <Send size={20} /> 경영진 보고용 메일 복사
          </button>
        </div>

        {showEmailModal && <EmailPreviewModal candidate={candidate} reportData={reportData} aiSummary={aiSummary} onClose={() => setShowEmailModal(false)} />}
      </div>
    </div>
  );
};

export default AdvancedCandidateReport;
