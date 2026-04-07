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
  const [newName, setNewName] = useState('');
  
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
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await hiringService.addCandidate(newName);
      setNewName('');
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
        return <span className="flex items-center gap-1 px-3 py-1 bg-green-900/40 text-green-400 rounded-full text-xs font-medium border border-green-500/30"><CheckCircle size={14} /> 평가 완료</span>;
      case 'interviewing':
        return <span className="flex items-center gap-1 px-3 py-1 bg-blue-900/40 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30"><Clock size={14} /> 면접 진행 중</span>;
      default:
        return <span className="flex items-center gap-1 px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-xs font-medium border border-gray-700">대기 중</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            인재 채용 모니터링
          </h1>
          <p className="text-gray-400">안전보건 전담팀 인재 선발 대시보드</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={seedDemoData}
            className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 transition-all rounded-xl font-semibold border border-gray-700"
          >
            <Database size={20} className="text-indigo-400" />
            데모 데이터 로드
          </button>
          
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-xl font-semibold shadow-lg shadow-indigo-500/20 active:scale-95"
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
          <div key={i} className="bg-[#1a1d27]/60 backdrop-blur-md p-6 rounded-2xl border border-gray-800/50 hover:border-gray-700/50 transition-colors">
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}<span className="text-sm font-normal text-gray-500 ml-1">명</span></p>
          </div>
        ))}
      </div>

      {/* Main List */}
      <div className="bg-[#1a1d27]/40 backdrop-blur-xl rounded-3xl border border-gray-800/50 overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="text-indigo-400" size={24} />
            지원자 목록
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="지원자 이름 검색..."
              className="bg-[#0f1117] border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-gray-500">지원자 정보를 불러오는 중...</div>
          ) : candidates.length === 0 ? (
            <div className="p-20 text-center text-gray-500">등록된 지원자가 없습니다.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-500 text-sm border-b border-gray-800/50">
                  <th className="px-8 py-4 font-medium uppercase tracking-wider">지원자</th>
                  <th className="px-8 py-4 font-medium uppercase tracking-wider">지원 직무</th>
                  <th className="px-8 py-4 font-medium uppercase tracking-wider">상태</th>
                  <th className="px-8 py-4 font-medium uppercase tracking-wider">등록일시</th>
                  <th className="px-8 py-4 font-medium text-right uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {candidates.map((candidate) => (
                  <tr 
                    key={candidate.id} 
                    onClick={() => handleRowClick(candidate)}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
                          {candidate.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-200">{candidate.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-gray-400 text-sm">
                      {candidate.position}
                    </td>
                    <td className="px-8 py-5">
                      {getStatusBadge(candidate.status)}
                    </td>
                    <td className="px-8 py-5 text-gray-500 text-xs">
                      {candidate.createdAt?.toDate().toLocaleString() || '-'}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-all group-hover:translate-x-1">
                        <ChevronRight size={20} />
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
          onSaveSuccess={fetchCandidates}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1a1d27] border border-gray-800 p-8 rounded-3xl w-full max-w-md shadow-2xl shadow-indigo-500/10">
            <h3 className="text-2xl font-bold mb-6">새 지원자 등록</h3>
            <form onSubmit={handleAddCandidate}>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">지원자 성함</label>
                  <input 
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    type="text"
                    className="w-full bg-[#0f1117] border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                    placeholder="이름을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">지원 구분</label>
                  <select className="w-full bg-[#0f1117] border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>안전보건 전담팀 (신입/경력)</option>
                    <option>현장 안전관리자</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-750 transition-colors rounded-xl font-semibold"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-xl font-semibold shadow-lg shadow-indigo-500/20"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HiringDashboard;
