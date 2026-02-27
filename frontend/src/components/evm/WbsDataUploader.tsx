import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Layers, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface WbsDataUploaderProps {
    onComplete: (data: any) => void;
    onClose: () => void;
}

const STEPS = [
    { id: 1, title: 'Profile Input', desc: '기본 속성' },
    { id: 2, title: 'Raw Data Upload', desc: '원시 데이터' },
    { id: 3, title: 'AI Field Mapping', desc: '컬럼 매핑' },
    { id: 4, title: 'Health Check', desc: '데이터 검증' },
];

const WbsDataUploader: React.FC<WbsDataUploaderProps> = ({ onComplete, onClose }) => {
    const [currentStep, setCurrentStep] = useState(1);

    // 단계 이동 핸들러
    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 4));
    const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    // Step 1: 프로파일 폼
    const renderStep1 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        <Layers size={18} className="text-violet-600" /> 프로젝트 속성 입력
                    </h4>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project Name</label>
                        <input type="text" className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" placeholder="예: 여의도 복합시설 신축공사" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Facility Type</label>
                            <select className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white">
                                <option>도심지 업무시설 (오피스)</option>
                                <option>공동주택 (아파트)</option>
                                <option>대형 상업시설</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contract Type</label>
                            <select className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white">
                                <option>내역 단가계약</option>
                                <option>총액 계약 (Lump Sum)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 우측 템플릿 매칭 프리뷰 */}
                <div className="bg-violet-50/50 p-6 rounded-xl border border-violet-100 flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <Layers size={24} className="text-violet-600" />
                    </div>
                    <h5 className="font-bold text-violet-900 mb-2">과거 유사 프로젝트 매칭 대기중</h5>
                    <p className="text-xs text-violet-600/70 mb-4">입력된 속성을 바탕으로 가장 유사한 WBS Level 1~2 뼈대를 실시간으로 검색합니다.</p>
                </div>
            </div>
        </div>
    );

    // Step 2: 드롭존 업로드
    const renderStep2 = () => (
        <div className="space-y-6 animate-fade-in">
            <p className="text-sm text-gray-600 mb-6">WBS 세분화를 위해 현장의 원가, 공간, 공정 엑셀 데이터를 업로드 해주세요. (CSV, XLSX 지원)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CBS Dropzone */}
                <div className="border-2 border-dashed border-gray-200 hover:border-violet-400 bg-gray-50 hover:bg-violet-50/30 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group">
                    <div className="bg-white p-3 rounded-xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                        <FileSpreadsheet className="text-blue-500" size={28} />
                    </div>
                    <h5 className="font-bold text-gray-800 mb-1">비용(CBS) 데이터</h5>
                    <p className="text-xs text-gray-400">도급/실행 내역서 엑셀 (필수)</p>
                </div>

                {/* PBS Dropzone */}
                <div className="border-2 border-dashed border-gray-200 hover:border-violet-400 bg-gray-50 hover:bg-violet-50/30 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group">
                    <div className="bg-white p-3 rounded-xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                        <Layers className="text-orange-500" size={28} />
                    </div>
                    <h5 className="font-bold text-gray-800 mb-1">공간(PBS) 정보</h5>
                    <p className="text-xs text-gray-400">동/층별 실정보 대장 (선택)</p>
                </div>

                {/* Schedule Dropzone */}
                <div className="border-2 border-dashed border-gray-200 hover:border-violet-400 bg-gray-50 hover:bg-violet-50/30 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group">
                    <div className="bg-white p-3 rounded-xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                        <CheckCircle className="text-emerald-500" size={28} />
                    </div>
                    <h5 className="font-bold text-gray-800 mb-1">일정(Schedule) 데이터</h5>
                    <p className="text-xs text-gray-400">바차트 공정표 내역 (선택)</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* 헤더 */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-3">
                        <span className="bg-violet-600 text-white p-2 rounded-xl shadow-md"><Upload size={20} /></span>
                        Data Ingestion Wizard
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold p-2">✕</button>
                </div>

                {/* Wizard Progress Bar */}
                <div className="px-8 py-6 bg-white border-b border-gray-50">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full z-0"></div>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-violet-600 rounded-full z-0 transition-all duration-500 ease-out" style={{ width: `${(currentStep - 1) * 33.33}%` }}></div>

                        {STEPS.map((step) => (
                            <div key={step.id} className="relative z-10 flex flex-col items-center bg-white px-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${currentStep >= step.id ? 'bg-violet-600 text-white shadow-md shadow-violet-200 scale-110' : 'bg-gray-100 text-gray-400 border-2 border-white'}`}>
                                    {currentStep > step.id ? <CheckCircle size={18} /> : step.id}
                                </div>
                                <div className="mt-3 text-center">
                                    <span className={`block text-[10px] font-black uppercase tracking-widest ${currentStep >= step.id ? 'text-violet-600' : 'text-gray-400'}`}>{step.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 메인 컨텐츠 영역 */}
                <div className="flex-1 p-8 overflow-y-auto bg-white">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && <div className="py-10 text-center text-gray-500 font-medium">데이터 로드 후 AI 컬럼 자동 매핑 UI가 렌더링 됩니다.</div>}
                    {currentStep === 4 && <div className="py-10 text-center text-gray-500 font-medium">결손 데이터 및 오류 셀을 하이라이팅하는 검증 UI가 렌더링 됩니다.</div>}
                </div>

                {/* 푸터 역할의 버튼부 */}
                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center rounded-b-[2rem]">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 1}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${currentStep === 1 ? 'opacity-0 cursor-default' : 'text-gray-500 hover:bg-white border border-gray-200 hover:shadow-sm'}`}
                    >
                        <ArrowLeft size={16} /> Previous
                    </button>

                    {currentStep < 4 ? (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm bg-gray-900 text-white hover:bg-black transition-all shadow-md"
                        >
                            Next Step <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={() => onComplete({})}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-md shadow-violet-200"
                        >
                            <CheckCircle size={16} /> Execute WBS Pipeline
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WbsDataUploader;
