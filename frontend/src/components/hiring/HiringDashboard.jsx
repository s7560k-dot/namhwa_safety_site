import React, { useState, useEffect } from 'react';
import { hiringService } from '../../services/hiringService';
import { db, Timestamp } from '../../firebase';
import { Search, UserPlus, FileText, ChevronRight, CheckCircle, Clock, Database } from 'lucide-react';
import InterviewPanel from './InterviewPanel';
import CandidateReport from './CandidateReport';

const HiringDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    type: 'new_entry',
    examNumber: '',
    position: '안전보건팀 (신입)'
  });
  
  // New state for active views
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [viewMode, setViewMode] = useState(null); // 'interview' or 'report'

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleRowClick = (candidate) => {
    setSelectedCandidate(candidate);
    if (candidate.status === 'completed') {
      setViewMode('report');
    } else {
      setViewMode('interview');
    }
  };

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const data = await hiringService.getCandidates();
      setCandidates(data);
      return data; // 최신 데이터를 반환하도록 수정
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!newCandidate.name.trim()) return;
    try {
      await hiringService.addCandidate(newCandidate);
      setNewCandidate({
        name: '',
        type: 'new_entry',
        examNumber: '',
        position: '안전보건팀 (신입)'
      });
      setIsAdding(false);
      fetchCandidates();
    } catch (error) {
      console.error('Error adding candidate:', error);
    }
  };

  const seedDemoData = async () => {
    if (!window.confirm('테스트용 데모 데이터를 Firestore에 추가하시겠습니까? (기존 데이터 유지)')) return;
    
    setLoading(true);
    try {
      // 1. 지원자 데이터 추가
      const c1 = await db.collection('candidates').add({
        name: '홍길동 (테스트)',
        position: '안전보건 전담팀 (경력)',
        status: 'completed',
        createdAt: Timestamp.now()
      });

      const c2 = await db.collection('candidates').add({
        name: '이몽룡 (테스트)',
        position: '현장 안전관리자 (신입)',
        status: 'pending',
        createdAt: Timestamp.now()
      });

      // 2. 홍길동에 대한 가상 평가 데이터 추가
      await db.collection('interviews').add({
        candidateId: c1.id,
        interviewerId: 'admin',
        evaluations: { q1: 5, q2: 4, q3: 5 },
        feedback: "건설 현장 안전 관리에 대한 깊은 통찰력을 보유하고 있으며, 특히 중대재해처벌법 대응 체계 구축 경험이 우수함. 갈등 상황에서도 공정 데이터를 활용한 합리적 설득이 돋보임.",
        totalScore: 14,
        createdAt: Timestamp.now()
      });

      alert('데모 데이터(지원자 2명 및 평가 1건)가 성공적으로 생성되었습니다.');
      fetchCandidates();
    } catch (error) {
      console.error('Error seeding demo data:', error);
      alert('데이터 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-bold w-fit"><CheckCircle size={14} /> 평가 완료</span>;
      case 'interviewing':
        return <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold w-fit"><Clock size={14} /> 면접 진행 중</span>;
      default:
        return <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-bold w-fit">대기 중</span>;
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-blue-50/85 backdrop-blur-xl shadow-[inset_0_0_100px_rgba(255,255,255,0.4)] text-slate-900 p-4 md:p-8 lg:p-12 font-sans antialiased">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter">
              인재 채용 모니터링 <span className="text-blue-600">.</span>
            </h1>
            <p className="text-blue-700 font-bold tracking-wide uppercase text-sm lg:text-base">안전보건 전담팀 인재 선발 대시보드</p>
          </div>
        
          <div className="flex gap-4">
            <button 
              onClick={seedDemoData}
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 transition-all rounded-xl font-bold text-slate-600 border border-slate-200 shadow-sm"
            >
              <Database size={20} className="text-blue-500" />
              데모 데이터 로드
            </button>
            
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white transition-all rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <UserPlus size={20} />
              지원자 추가
            </button>
          </div>
      </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: '전체 지원자', value: candidates.length, color: 'blue' },
            { label: '평가 완료', value: candidates.filter(c => c.status === 'completed').length, color: 'green' },
            { label: '현재 진행 중', value: candidates.filter(c => c.status === 'interviewing' || c.status === 'pending').length, color: 'orange' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">{stat.label}</p>
              <p className="text-4xl font-black text-slate-900">{stat.value}<span className="text-sm font-bold text-slate-400 ml-1">명</span></p>
            </div>
          ))}
        </div>

        {/* Main List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden mb-12">
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <FileText size={24} />
              </div>
              지원자 목록
            </h2>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="지원자 이름 검색..."
                className="bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all w-full md:w-64 placeholder:font-medium placeholder-slate-400"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 text-center font-bold text-slate-400 tracking-wider">지원자 정보를 불러오는 중...</div>
            ) : candidates.length === 0 ? (
              <div className="p-20 text-center font-bold text-slate-400 tracking-wider">등록된 지원자가 없습니다.</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-xs border-b border-slate-100 bg-slate-50/50">
                    <th className="px-8 py-5 font-bold uppercase tracking-widest">지원자</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-widest">지원 직무</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-widest">상태</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-widest">등록일시</th>
                    <th className="px-8 py-5 font-bold text-right uppercase tracking-widest">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {candidates.map((candidate) => (
                    <tr 
                      key={candidate.id} 
                      onClick={() => handleRowClick(candidate)}
                      className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center font-black text-lg">
                            {candidate.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900 text-lg">{candidate.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-slate-500 font-medium">
                        {candidate.position}
                      </td>
                      <td className="px-8 py-5">
                        {getStatusBadge(candidate.status)}
                      </td>
                      <td className="px-8 py-5 text-slate-400 font-medium text-sm">
                        {candidate.createdAt?.toDate().toLocaleString() || '-'}
                      </td>
                      <td className="px-8 py-5 text-right flex justify-end">
                        <button className="p-3 bg-slate-50 hover:bg-blue-100 rounded-xl text-slate-400 hover:text-blue-600 transition-all font-bold text-sm flex items-center gap-2 group-hover:bg-blue-50 group-hover:text-blue-600">
                          진입하기 <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      {/* Evaluation / Report Modals */}
      {viewMode === 'interview' && selectedCandidate && (
        <InterviewPanel 
          candidate={selectedCandidate} 
          onClose={() => setViewMode(null)}
          onStatusChange={(newStatus) => {
            // 1. 선택된 지원자 정보 업데이트
            setSelectedCandidate(prev => prev ? { ...prev, status: newStatus } : null);
            // 2. 전체 목록 정보 업데이트 (이미 목록에 반영된 데이터를 UI에 즉시 동기화)
            setCandidates(prev => prev.map(c => 
              c.id === selectedCandidate.id ? { ...c, status: newStatus } : c
            ));
          }}
          onSaveSuccess={async () => {
            // 1. 최신 데이터로 목록 갱신
            const updatedList = await fetchCandidates();
            
            // 2. 현재 선택된 지원자의 객체 정보를 최신(status: 'completed')으로 동기화
            const freshData = updatedList.find(c => c.id === selectedCandidate.id);
            if (freshData) {
              setSelectedCandidate(freshData);
            }
            
            // 3. 리포트 보기 모드로 전환
            setViewMode('report');
          }}
        />
      )}

      {viewMode === 'report' && selectedCandidate && (
        <CandidateReport 
          candidate={selectedCandidate} 
          onClose={() => setViewMode(null)}
        />
      )}

      {/* Add Candidate Modal Overlay */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white border border-slate-100 p-10 rounded-3xl w-full max-w-lg shadow-2xl">
            <h3 className="text-3xl font-black text-slate-900 mb-8">새 지원자 등록</h3>
            <form onSubmit={handleAddCandidate}>
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="col-span-2">
                  <label className="block text-slate-500 text-sm font-bold mb-3 uppercase tracking-wider">지원자 성함</label>
                  <input 
                    autoFocus
                    value={newCandidate.name}
                    onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm font-bold text-slate-900 placeholder-slate-400"
                    placeholder="이름을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-sm font-bold mb-3 uppercase tracking-wider">구분</label>
                  <select 
                    value={newCandidate.type}
                    onChange={(e) => {
                      const type = e.target.value;
                      setNewCandidate({
                        ...newCandidate, 
                        type, 
                        position: type === 'new_entry' ? '안전보건팀 (신입)' : '안전보건팀 (경력)'
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm font-bold text-slate-900"
                  >
                    <option value="new_entry">신입 (New Entry)</option>
                    <option value="experienced">경력 (Experienced)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 text-sm font-bold mb-3 uppercase tracking-wider">수험번호</label>
                  <input 
                    value={newCandidate.examNumber}
                    onChange={(e) => setNewCandidate({...newCandidate, examNumber: e.target.value})}
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm font-bold text-slate-900"
                    placeholder="수험번호"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-500 text-sm font-bold mb-3 uppercase tracking-wider">지원 직무</label>
                  <input 
                    value={newCandidate.position}
                    onChange={(e) => setNewCandidate({...newCandidate, position: e.target.value})}
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm font-bold text-slate-900"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors rounded-xl font-bold"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white transition-colors rounded-xl font-bold shadow-lg shadow-blue-500/20"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default HiringDashboard;
