import React, { useState, useEffect, useRef } from 'react';
import { hiringService } from '../../services/hiringService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Award, TrendingUp, AlertTriangle, FileText, Send, Download, BrainCircuit, ChevronLeft, MessageSquare, X, Edit, Target } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const EmailPreviewModal = ({ candidate, reportData, aiSummary, onClose }) => {
  const [copied, setCopied] = useState(false);

  const emailHtml = `
<div style="max-width: 650px; margin: 0; border: 1px solid #E0E0E0; border-radius: 8px; font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; overflow: hidden; background-color: #ffffff;">
  <div style="background-color: #9C2E21; color: #FFFFFF; padding: 20px 25px;">
    <h2 style="margin: 0; font-size: 18px; font-weight: normal; letter-spacing: -0.5px;">[보고] 안전보건 전담팀 지원자 ${candidate.name} 면접 결과 보고</h2>
  </div>

  <div style="padding: 30px 25px; color: #333333; line-height: 1.6; font-size: 14px;">
    <p style="margin-top: 0;">임원진 여러분, 안녕하십니까.</p>
    <p>안전보건팀입니다.</p>

    <p>다름이 아니오라, 신규 안전보건 전담팀 구축을 위한 <b>${candidate.name}</b> 지원자의 면접 평가 결과를 아래와 같이 보고드립니다.</p>

    <div style="background-color: #F8F9FA; padding: 15px; border-left: 4px solid #9C2E21; margin: 20px 0;">
      <strong style="color: #9C2E21;">■ 핵심 평가 요약</strong><br>
      - <b>종합 점수:</b> ${reportData.totalScore} / 25점<br>
      - <b>최종 등급:</b> ${reportData.totalScore >= 19 ? '우수(A이상)' : '보통(B이하)'} 수준<br>
      ${aiSummary ? `- <b>AI 분석 인사이트:</b> ${aiSummary.substring(0, 150)}...` : '- 상세 분석 데이터는 시스템 리포트를 참조하십시오.'}
    </div>

    <div style="margin: 20px 0; padding: 15px; border: 1px solid #E0E0E0; border-radius: 5px;">
      <strong style="color: #666666;">[면접관 종합 피드백]</strong><br>
      <div style="margin-top: 10px; color: #444444; font-style: italic;">
        "${reportData.feedback || "등록된 평가 피드백이 없습니다."}"
      </div>
    </div>

    <p>상세 내용은 시스템 대시보드 및 첨부된 리포트 파일을 확인해 주시기 바랍니다.</p>
    <p>바쁘신 중에도 검토해 주셔서 감사합니다.</p>
  </div>

  <div style="background-color: #F8F9FA; padding: 20px 25px; border-top: 1px solid #E0E0E0; font-size: 13px; color: #666666; line-height: 1.6;">
    <p style="margin: 0 0 10px 0; font-weight: bold; color: #9C2E21; font-size: 15px;">남화토건(주) 안전보건팀</p>
    <p style="margin: 0; color: #333333;"><strong>부장 신광배</strong> <span style="color: #888888; font-size: 12px;">(M. 010-7153-7060)</span></p>
    <p style="margin: 3px 0 0 0; color: #333333;"><strong>주임 이재훈</strong> <span style="color: #888888; font-size: 12px;">(M. 010-5712-8256)</span></p>
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
      console.error('Failed to copy email template:', err);
      alert('복사에 실패했습니다. 브라우저 보안 설정을 확인해주세요.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900">경영진 보고용 메일 양식 미리보기</h3>
            <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">하단 버튼을 눌러 본문을 복사한 후 메일 앱에 붙여넣으세요.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50 flex justify-center">
          <div className="shadow-lg bg-white rounded-lg overflow-hidden shrink-0" dangerouslySetInnerHTML={{ __html: emailHtml }} />
        </div>

        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            취소
          </button>
          <button 
            onClick={handleCopy}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black transition-all ${
              copied ? 'bg-green-600 text-white' : 'bg-[#9C2E21] hover:bg-[#7a241a] text-white shadow-lg shadow-red-900/20'
            }`}
          >
            {copied ? <Award size={18} /> : <FileText size={18} />}
            {copied ? '복사 완료! (아웃룩 등에 붙여넣기)' : '메일 본문 서식 복사'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CandidateReport = ({ candidate, onClose, onEdit }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const reportRef = useRef(null);
  const guideRef = useRef(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await hiringService.getCandidateReport(candidate.id);
        if (data && data.length > 0) {
          setReportData(data[0]); // 가장 최근 평가 리포트 사용
        }
      } catch (error) {
        console.error('Error fetching report:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [candidate.id]);

  const getGrade = (score) => {
    if (score >= 23) return { label: 'S', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', desc: '적극 채용 (Exemplary)' };
    if (score >= 19) return { label: 'A', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', desc: '채용 (Successful)' };
    if (score >= 14) return { label: 'B', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', desc: '조건부 채용 (Emerging)' };
    return { label: 'C/D', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', desc: '채용 불가 (Unsuccessful)' };
  };

  const generateAiSummary = async () => {
    if (!reportData) return;
    setIsGeneratingAi(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
        건설업 안전보건 전담팀 지원자 면접 평가 분석을 평어체(한국어)로 작성해줘.
        지원자 이름: ${candidate.name}
        역량 점수 (총 25점 만점, 각 5점): 
        - 1. 법규 시스템 융합: ${reportData.evaluations.q1 || 0}/5
        - 2. 위험성평가 역량: ${reportData.evaluations.q2 || 0}/5
        - 3. 위기 대응 및 예방: ${reportData.evaluations.q3 || 0}/5
        - 4. 소통 및 갈등 조정: ${reportData.evaluations.q4 || 0}/5
        - 5. 리더십 및 문화조성: ${reportData.evaluations.q5 || 0}/5
        면접관 의견: ${reportData.feedback}
        
        형식 (마크다운 사용금지, 간결한 텍스트로):
        1. 핵심 강점 요약
        2. 우려사항 또는 보완점
        3. 최종 채용 추천 근거
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAiSummary(response.text());
    } catch (error) {
      console.error('AI Summary generation failed:', error);
      setAiSummary(`AI 서머리 생성 중 오류가 발생했습니다: ${error.message || error}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const MARGIN_MM = 15;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfWidth = pageWidth - (MARGIN_MM * 2);

      const renderCanvasToPdf = async (elementRef, isFirstRender = false) => {
        if (!elementRef.current) return;
        
        const canvas = await html2canvas(elementRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#f8fafc',
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        let heightLeft = pdfHeight;
        let position = MARGIN_MM;
        
        if (!isFirstRender) pdf.addPage();
        
        pdf.addImage(imgData, 'PNG', MARGIN_MM, position, pdfWidth, pdfHeight);
        heightLeft -= (pageHeight - MARGIN_MM * 2);
        
        pdf.setFillColor(248, 250, 252);
        pdf.rect(0, pageHeight - MARGIN_MM, pageWidth, MARGIN_MM, 'F');
        
        while (heightLeft > 0) {
          position -= (pageHeight - MARGIN_MM * 2);
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', MARGIN_MM, position, pdfWidth, pdfHeight);
          heightLeft -= (pageHeight - MARGIN_MM * 2);
          
          pdf.setFillColor(248, 250, 252);
          pdf.rect(0, 0, pageWidth, MARGIN_MM, 'F');
          pdf.rect(0, pageHeight - MARGIN_MM, pageWidth, MARGIN_MM, 'F');
        }
      };

      await renderCanvasToPdf(reportRef, true);
      await renderCanvasToPdf(guideRef, false);
      
      pdf.save(`남화토건_면접리포트_${candidate.name}.pdf`);
    } catch (err) {
      console.error('PDF 다운로드 실패:', err);
      alert('PDF 생성에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendToExecutives = () => {
    setShowEmailModal(true);
  };

  if (loading) return <div className="fixed inset-0 bg-blue-50/95 z-[100] flex items-center justify-center font-bold text-slate-500">리포트를 불러오는 중...</div>;
  if (!reportData) return <div className="fixed inset-0 bg-blue-50/95 z-[100] flex items-center justify-center font-bold text-slate-500">아직 완료된 평가 리포트가 없습니다.</div>;

  const chartData = [
    { subject: '법규/시스템', A: reportData.evaluations.q1 || 0, fullMark: 5 },
    { subject: '위험성평가', A: reportData.evaluations.q2 || 0, fullMark: 5 },
    { subject: '위기 대응력', A: reportData.evaluations.q3 || 0, fullMark: 5 },
    { subject: '소통/갈등', A: reportData.evaluations.q4 || 0, fullMark: 5 },
    { subject: '리더십/문화', A: reportData.evaluations.q5 || 0, fullMark: 5 },
  ];

  const grade = getGrade(reportData.totalScore);

  return (
    <div className="fixed inset-0 bg-blue-50/95 backdrop-blur-md z-[100] overflow-y-auto custom-scrollbar font-sans antialiased text-slate-800">
      <div className="max-w-5xl mx-auto p-4 md:p-12">
        {/* Top Nav */}
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors mb-8 group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          목록으로 돌아가기
        </button>

        {/* PDF Export Target Container */}
        <div ref={reportRef} className="bg-slate-50 pb-6 rounded-3xl" style={{ minHeight: '600px' }}>
          
          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left: General Info */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-center md:justify-start shadow-sm">
              <div className="text-center md:text-left">
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-200 uppercase tracking-widest">
                    {candidate.position}
                  </span>
                  <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-200 uppercase tracking-widest">
                    평가 리포트
                  </span>
                </div>
                <h1 className="text-4xl font-black text-slate-900">{candidate.name} <span className="text-2xl font-bold text-slate-400">지원자</span></h1>
              </div>
            </div>

            {/* Right: Grade Card */}
            <div className={`${grade.bg} border-2 border-dashed ${grade.border} rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-bl-full -z-0"></div>
              <p className="text-sm font-black uppercase tracking-widest text-slate-600 mb-1 z-10">최종 평가 등급</p>
              <div className={`text-7xl leading-none font-black ${grade.color} mb-3 z-10`}>{grade.label}</div>
              <p className={`text-base font-bold ${grade.color} z-10 leading-tight`}>{grade.desc}</p>
              <div className="mt-4 px-4 py-1.5 bg-white/60 rounded-full text-slate-700 font-bold z-10 shadow-sm text-sm border border-white/50">
                종합 점수: <span className="text-lg text-slate-900">{reportData.totalScore}</span> / 25
              </div>
            </div>
          </div>

          {/* Detailed Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Competency Chart */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-slate-900">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <TrendingUp size={20} />
                </div>
                다차원 역량 분석
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar
                      name={candidate.name}
                      dataKey="A"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4 mt-8 justify-center">
                {chartData.map((d, i) => (
                  <div key={i} className="text-center bg-slate-50 py-3 px-4 rounded-xl border border-slate-100 min-w-[100px]">
                    <div className="text-3xl font-black text-blue-600">{d.A}</div>
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-tighter mt-1">{d.subject}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col relative overflow-hidden group shadow-sm">
              <div className="absolute -top-10 -right-10 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <BrainCircuit size={200} className="text-blue-600" />
              </div>
              
              <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="text-lg font-black flex items-center gap-2 text-slate-900">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <BrainCircuit size={20} />
                  </div>
                  AI 종합 인사이트
                </h3>
                <button 
                  onClick={generateAiSummary}
                  disabled={isGeneratingAi}
                  className="flex items-center gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors px-4 py-2.5 rounded-xl text-white disabled:opacity-50 shadow-md shadow-indigo-500/20 active:scale-95"
                >
                  {isGeneratingAi ? '안전보건 AI 분석 중...' : 'AI 전문 분석 실행'}
                </button>
              </div>

              <div className="flex-1 bg-slate-50 rounded-2xl p-5 border border-slate-100 relative z-10">
                {aiSummary ? (
                  <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                    {aiSummary}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10">
                    <FileText className="text-slate-300 mb-4" size={48} />
                    <p className="text-slate-400 font-bold text-sm max-w-[200px] leading-relaxed">
                      'AI 분석 실행' 버튼을 눌러 정량/정성 평가를 종합적으로 요약해 보세요.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Qualitative Feedback */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-4 shadow-sm mx-0.5">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-slate-900">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <MessageSquare size={20} />
              </div>
              면접관 종합 피드백
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner">
              <p className="text-slate-700 leading-loose whitespace-pre-wrap text-[15px] font-bold">
                "{reportData.feedback || "등록된 면접 피드백이 없습니다."}"
              </p>
            </div>
          </div>
        </div>

        {/* PDF Export Target 2: BARS Guide Page */}
        <div ref={guideRef} className="bg-slate-50 pt-8 pb-8 rounded-3xl mt-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mx-0.5">
            <h3 className="text-xl font-black mb-8 flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Target size={24} />
              </div>
              다차원 역량 분석(BARS) 배점 기준 요약표
            </h3>
            
            <div className="space-y-4 mb-8">
              {[
                { score: 5, label: '탁월 (Outstanding)', desc: '해당 역량과 관련하여 즉시 현장 적용 및 지도/전파가 가능한 최고 수준' },
                { score: 4, label: '우수 (Exceeds)', desc: '주어진 질문과 상황에 대해 명확한 기준과 구체적인 대처 방안을 완벽히 숙지함' },
                { score: 3, label: '보통 (Meets)', desc: '기본적인 원칙을 이해하고 있으나 활용 측면에서 다소 구체성이 떨어질 수 있음' },
                { score: 2, label: '미흡 (Needs Imp.)', desc: '이해도가 부족하며, 상황 투입 전 재교육 및 면밀한 모니터링이 필수적임' },
                { score: 1, label: '부적합 (Unacceptable)', desc: '해당 영역에 대한 개념과 원칙 파악이 미달되어 사고 예방 및 대응이 불가함' }
              ].map(item => (
                <div key={item.score} className="flex flex-col md:flex-row gap-4 md:items-center bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4 md:w-56 shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                      {item.score}
                    </div>
                    <span className="font-bold text-slate-800 text-lg">{item.label}</span>
                  </div>
                  <p className="text-slate-600 font-medium leading-relaxed flex-1">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <p className="text-sm font-bold text-indigo-800 leading-relaxed">
                * 위 배점 기준표는 면접관의 주관적 평가를 객관화하기 위한 BARS(Behaviorally Anchored Rating Scales) 기반의 평가 척도입니다. 레이더 차트는 이 기준에 따라 5개 영역(법규/시스템, 위험성평가, 위기 대응력, 소통/갈등, 리더십/문화)에서 획득한 점수를 나타냅니다.
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar (Not captured in PDF if outside the ref, but we definitely don't want buttons in the PDF so we placed them outside) */}
        <div className="flex flex-col md:flex-row gap-4 justify-end pt-8">
          {onEdit && (
            <button 
              onClick={onEdit}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 border border-slate-200 transition-all rounded-2xl font-bold text-slate-700 shadow-sm active:scale-95"
            >
              <Edit size={20} className="text-slate-400" />
              평가 결과 수정하기
            </button>
          )}
          <button 
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 border border-slate-200 transition-all rounded-2xl font-bold text-slate-700 shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Download size={20} className="text-slate-400" />
            {isExporting ? 'PDF 생성 중...' : '리포트 PDF 다운로드'}
          </button>
          
          <button 
            onClick={handleSendToExecutives}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 transition-all rounded-2xl font-bold text-white shadow-xl shadow-blue-500/20 active:scale-95"
          >
            <Send size={20} />
            경영진에게 리포트 전송
          </button>
        </div>

        {/* Email Preview Modal */}
        {showEmailModal && (
          <EmailPreviewModal 
            candidate={candidate}
            reportData={reportData}
            aiSummary={aiSummary}
            onClose={() => setShowEmailModal(false)}
          />
        )}

      </div>
    </div>
  );
};

export default CandidateReport;
