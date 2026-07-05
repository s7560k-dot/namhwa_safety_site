import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WbsDataUploader from './components/evm/WbsDataUploader';
import { ArrowLeft, Save, Upload, Activity, ShieldAlert } from 'lucide-react';

const WbsGeneratorPage = () => {
    const navigate = useNavigate();
    const [isUploaderOpen, setIsUploaderOpen] = useState(false);
    const [wbsData, setWbsData] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleUploadComplete = async (file) => {
        setIsUploaderOpen(false);
        setIsGenerating(true);
        
        // Mock progress animation
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) return prev;
                return prev + 5;
            });
        }, 300);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:8000/api/v1/wbs/parse-excel', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('API Request Failed');
            
            const result = await response.json();
            clearInterval(interval);
            setProgress(100);
            
            setTimeout(() => {
                setWbsData(result.data);
                setIsGenerating(false);
                setProgress(0);
            }, 500);

        } catch (error) {
            clearInterval(interval);
            alert("AI 매칭 중 오류가 발생했습니다: " + error.message);
            setIsGenerating(false);
            setProgress(0);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-6 md:p-12">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">스마트 WBS 자동 생성기</h1>
                        <p className="text-slate-500 font-medium mt-1">엑셀 내역서를 업로드하면 AI가 표준 WBS와 안전 리스크를 매핑합니다.</p>
                    </div>
                </div>
                {wbsData && (
                    <button className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-colors">
                        <Save size={18} />
                        Amaranth 10 전송
                    </button>
                )}
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto">
                {!wbsData && !isGenerating ? (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-16 text-center flex flex-col items-center justify-center min-h-[500px]">
                        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <Upload size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">내역서 업로드 대기중</h2>
                        <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
                            원시 내역서(BoQ) 엑셀 파일을 업로드해 주세요.<br/>AI가 자동으로 남화토건 표준 코드로 분류해 드립니다.
                        </p>
                        <button 
                            onClick={() => setIsUploaderOpen(true)}
                            className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg"
                        >
                            엑셀 파서 & AI 매칭 시작하기
                        </button>
                    </div>
                ) : isGenerating ? (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-16 text-center flex flex-col items-center justify-center min-h-[500px]">
                        <Activity size={48} className="text-blue-500 animate-pulse mb-6" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">AI 매칭 엔진 가동 중...</h2>
                        <p className="text-slate-500 mb-8">표준 WBS DB와 안전 리스크 DB를 검색하여 최적의 코드를 할당하고 있습니다.</p>
                        
                        <div className="w-full max-w-md bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner relative">
                            <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="mt-3 font-bold text-slate-400">{progress}%</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8">
                        <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Activity size={20} className="text-green-500" />
                                매칭 완료된 WBS 트리
                            </h3>
                            <span className="px-4 py-1.5 bg-green-50 text-green-700 text-sm font-bold rounded-full">
                                총 {wbsData.length}개 공종 분류 완료
                            </span>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[11px] tracking-wider">
                                    <tr>
                                        <th className="p-4 rounded-tl-xl">WBS L1 (공사)</th>
                                        <th className="p-4">WBS L2 (공종)</th>
                                        <th className="p-4">WBS L3 (세부)</th>
                                        <th className="p-4">원시 품명</th>
                                        <th className="p-4 text-right">비용(원)</th>
                                        <th className="p-4 rounded-tr-xl">안전 리스크</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {wbsData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4">
                                                <span className="font-bold text-slate-800">{row.wbs_mapping?.level_1?.name || '-'}</span>
                                                <div className="text-[10px] text-slate-400">{row.wbs_mapping?.level_1?.code}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-bold text-slate-700">{row.wbs_mapping?.level_2?.name || '-'}</span>
                                                <div className="text-[10px] text-slate-400">{row.wbs_mapping?.level_2?.code}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-medium text-slate-600">{row.wbs_mapping?.level_3?.name || '-'}</span>
                                                <div className="text-[10px] text-slate-400">{row.wbs_mapping?.level_3?.code}</div>
                                            </td>
                                            <td className="p-4 text-slate-500">{row.wbs_mapping?.level_3?.mapped_item || '-'}</td>
                                            <td className="p-4 text-right font-mono font-bold text-slate-700">
                                                {row.metrics?.cost_krw?.toLocaleString() || 0}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-start gap-2 max-w-xs">
                                                    <ShieldAlert size={16} className="text-red-500 mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-bold text-red-600 leading-tight mb-1">{row.safety_management?.primary_risk || '없음'}</p>
                                                        <p className="text-[10px] text-slate-500 leading-tight">서류: {row.safety_management?.checklist_required || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Uploader Modal */}
            {isUploaderOpen && (
                <WbsDataUploader 
                    onClose={() => setIsUploaderOpen(false)} 
                    // onComplete이 파일 객체를 전달받도록 WbsDataUploader 수정 필요
                    onComplete={(data) => handleUploadComplete(data?.file)} 
                />
            )}
        </div>
    );
};

export default WbsGeneratorPage;
