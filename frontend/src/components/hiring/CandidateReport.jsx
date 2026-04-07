import React, { useState, useEffect } from 'react';
import { hiringService } from '../../services/hiringService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Award, TrendingUp, AlertTriangle, FileText, Send, Download, BrainCircuit, ChevronLeft } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const CandidateReport = ({ candidate, onClose }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

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
    if (score >= 14) return { label: 'S', color: 'text-yellow-400', bg: 'bg-yellow-400/10', desc: '적극 채용 (Exemplary)' };
    if (score >= 11) return { label: 'A', color: 'text-green-400', bg: 'bg-green-400/10', desc: '채용 (Successful)' };
    if (score >= 8) return { label: 'B', color: 'text-blue-400', bg: 'bg-blue-400/10', desc: '조건부 채용 (Emerging)' };
    return { label: 'C/D', color: 'text-red-400', bg: 'bg-red-400/10', desc: '채용 불가 (Unsuccessful)' };
  };

  const generateAiSummary = async () => {
    if (!reportData) return;
    setIsGeneratingAi(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        건설업 안전보건 전담팀 지원자 면접 평가 분석을 평어체(한국어)로 작성해줘.
        지원자 이름: ${candidate.name}
        역량 점수: 
        - 위험성평가: ${reportData.evaluations.q1}/5
        - 현장 소통: ${reportData.evaluations.q2}/5
        - 위기 대응: ${reportData.evaluations.q3}/5
        면접관 의견: ${reportData.feedback}
        
        형식:
        1. 핵심 강점 요약
        2. 우려사항 또는 보완점
        3. 최종 채용 추천 근거
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAiSummary(response.text());
    } catch (error) {
      console.error('AI Summary generation failed:', error);
      setAiSummary('AI 서머리 생성 중 오류가 발생했습니다. API 키 설정을 확인해 주세요.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  if (loading) return <div className="p-20 text-center">리포트를 불러오는 중...</div>;
  if (!reportData) return <div className="p-20 text-center">아직 완료된 평가 리포트가 없습니다.</div>;

  const chartData = [
    { subject: '위험성평가', A: reportData.evaluations.q1, fullMark: 5 },
    { subject: '현장 소통', A: reportData.evaluations.q2, fullMark: 5 },
    { subject: '위기 대응', A: reportData.evaluations.q3, fullMark: 5 },
  ];

  const grade = getGrade(reportData.totalScore);

  return (
    <div className="fixed inset-0 bg-[#0f1117] z-[100] overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto p-4 md:p-12">
        {/* Top Nav */}
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          목록으로 돌아가기
        </button>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left: General Info */}
          <div className="lg:col-span-2 bg-[#1a1d27]/40 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-5xl font-bold shadow-2xl shadow-indigo-500/20">
              {candidate.name.charAt(0)}
            </div>
            <div className="text-center md:text-left">
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold border border-indigo-500/20">
                  {candidate.position}
                </span>
                <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-xs font-bold border border-gray-700">
                  면접 완료
                </span>
              </div>
              <h1 className="text-4xl font-bold mb-2">{candidate.name} 지원자</h1>
              <p className="text-gray-400 max-w-md">
                "{reportData.feedback.substring(0, 80)}..."
              </p>
            </div>
          </div>

          {/* Right: Grade Card */}
          <div className={`${grade.bg} border-2 border-dashed ${grade.color.replace('text', 'border')}/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center`}>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">최종 평가 등급</p>
            <div className={`text-8xl font-black ${grade.color} mb-2`}>{grade.label}</div>
            <p className={`text-lg font-bold ${grade.color}`}>{grade.desc}</p>
            <div className="mt-4 text-gray-400 font-medium">총점 {reportData.totalScore} / 15</div>
          </div>
        </div>

        {/* Detailed Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Competency Chart */}
          <div className="bg-[#1a1d27] border border-gray-800 rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <TrendingUp className="text-indigo-400" /> 다차원 역량 분석
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 13 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar
                    name={candidate.name}
                    dataKey="A"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-8">
              {chartData.map((d, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-white">{d.A}</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{d.subject}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-[#1a1d27] border border-gray-800 rounded-3xl p-8 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <BrainCircuit size={120} className="text-indigo-400" />
            </div>
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BrainCircuit className="text-indigo-400" /> AI 종합 인사이트
              </h3>
              <button 
                onClick={generateAiSummary}
                disabled={isGeneratingAi}
                className="flex items-center gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 rounded-lg text-white disabled:opacity-50"
              >
                {isGeneratingAi ? '분석 중...' : 'AI 분석 실행'}
              </button>
            </div>

            <div className="flex-1 bg-black/20 rounded-2xl p-6 border border-gray-800/50 relative z-10">
              {aiSummary ? (
                <div className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                  {aiSummary}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                  <FileText className="text-gray-700 mb-4" size={48} />
                  <p className="text-gray-500 text-sm max-w-[200px]">
                    'AI 분석 실행' 버튼을 눌러 정량/정성 평가를 종합적으로 요약해 보세요.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Qualititative Feedback */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-3xl p-8 mb-12 shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageSquare className="text-indigo-400" /> 면접관 정성 피드백
          </h3>
          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-8 shadow-inner">
            <p className="text-indigo-100/90 leading-loose whitespace-pre-wrap italic text-lg font-medium">
              "{reportData.feedback}"
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-end border-t border-gray-800 pt-12">
          <button className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 hover:bg-gray-700 transition-all rounded-2xl font-bold text-white group">
            <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
            리포트 PDF 다운로드
          </button>
          <button className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/20 active:scale-95">
            <Send size={20} />
            경영진에게 리포트 전송
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateReport;
