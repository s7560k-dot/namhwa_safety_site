import React, { useState } from 'react';
import {
    FileUp,
    Database,
    Brain,
    FileSpreadsheet,
    Calculator,
    ArrowRight,
    Search,
    Layers,
    CheckCircle2,
    Clock,
    Download
} from 'lucide-react';

const CivilQuantityTakeoff: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [dxfData, setDxfData] = useState<any>(null);
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [aiRecommendation, setAiRecommendation] = useState<string>("");

    // --- 핸들러 ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const uploadedFile = e.target.files[0];
            const fileName = uploadedFile.name.toLowerCase();

            if (!fileName.endsWith('.dxf') && !fileName.endsWith('.dwg')) {
                alert("DXF 또는 DWG 파일만 업로드 가능합니다.");
                return;
            }

            setFile(uploadedFile);

            // 도면 분석 API 호출
            setIsAnalyzing(true);
            const formData = new FormData();
            formData.append('file', uploadedFile);

            try {
                const response = await fetch('http://localhost:8000/analyze/dxf', {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();

                if (response.ok) {
                    setDxfData(data.layers);
                } else {
                    alert(data.detail || "도면 분석 중 오류가 발생했습니다.");
                }
            } catch (error) {
                console.error("도면 분석 실패:", error);
                alert("서버 연결에 실패했습니다.");
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    const handleAddItem = async (layerName: string, data: any) => {
        // AI 근거 추천 API 호출
        try {
            const res = await fetch(`http://localhost:8000/ai/recommend-basis?item_name=${layerName}`);
            const aiData = await res.json();

            const newItem = {
                id: Date.now(),
                name: layerName,
                spec: "도면 추출 규격",
                unit: data.area > 0 ? "m2" : "m",
                quantity: data.area > 0 ? data.area : data.length,
                basis: aiData.recommended_basis
            };
            setSelectedItems([...selectedItems, newItem]);
        } catch (error) {
            console.error("AI 추천 실패:", error);
        }
    };

    const handleExportExcel = async () => {
        if (selectedItems.length === 0) return;

        try {
            const response = await fetch('http://localhost:8000/export/excel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: selectedItems }),
            });

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "부대토목_수량산출서.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error("엑셀 추출 실패:", error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 bg-gray-50 min-h-screen font-sans">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg ring-4 ring-blue-50">
                        <Database size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">부대토목 수량 산출 파이프라인</h1>
                        <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-[0.2em]">Civil Engineering Quantity Takeoff Pipeline</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">System Status</span>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold uppercase">AI Engine Online</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* 1단계: 도면 분석 (Auto-Takeoff) */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
                        <div className="flex items-center gap-2 font-black text-gray-800 mb-6">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black">1</div>
                            <span>Auto-Takeoff (CAD 분석)</span>
                        </div>

                        <div className="flex-1 space-y-4">
                            <label className="group relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                                <FileUp className="w-12 h-12 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                <div className="mt-4 flex flex-col items-center">
                                    <span className="text-sm font-black text-gray-600">CAD 도면 업로드</span>
                                    <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">DXF, DWG 지원</span>
                                </div>
                                <input type="file" className="hidden" accept=".dxf,.dwg" onChange={handleFileUpload} />
                            </label>

                            {file && (
                                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Layers size={16} className="text-blue-500" />
                                        <span className="text-xs font-bold text-gray-700 truncate max-w-[150px]">{file.name}</span>
                                    </div>
                                    {isAnalyzing && <Clock size={16} className="text-blue-500 animate-spin" />}
                                </div>
                            )}

                            {dxfData && (
                                <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Extracted Layers</p>
                                    {Object.entries(dxfData).map(([layer, data]: [string, any]) => (
                                        <button
                                            key={layer}
                                            onClick={() => handleAddItem(layer, data)}
                                            className="w-full p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between group"
                                        >
                                            <div className="text-left">
                                                <p className="text-xs font-black text-gray-700">{layer}</p>
                                                <p className="text-[10px] text-gray-400 font-bold">{data.length}m / {data.area}m²</p>
                                            </div>
                                            <Plus size={14} className="text-gray-300 group-hover:text-blue-500" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2단계: 아이템 라이브러리 및 AI 매칭 */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2 font-black text-gray-800">
                                <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-black">2</div>
                                <span>Quantity Statement (산출 내역)</span>
                            </div>
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-black hover:bg-green-700 transition-all shadow-lg hover:shadow-green-100"
                            >
                                <FileSpreadsheet size={16} />
                                엑셀로 내보내기
                            </button>
                        </div>

                        {selectedItems.length > 0 ? (
                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-y border-gray-50 bg-gray-50/50">
                                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Item / Spec</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Basis (AI Recommend)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {selectedItems.map((item) => (
                                            <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-4">
                                                    <p className="text-sm font-black text-gray-800">{item.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">{item.spec}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-black uppercase">{item.unit}</span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm font-black text-blue-600">{item.quantity.toLocaleString()}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-start gap-2 max-w-[300px]">
                                                        <Brain size={14} className="text-purple-400 shrink-0 mt-0.5" />
                                                        <p className="text-[11px] font-bold text-gray-500 leading-normal">{item.basis}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                    <Search size={40} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-400">등록된 산출 항목이 없습니다</p>
                                    <p className="text-[11px] text-gray-300 font-bold mt-1">도면 분석 결과에서 항목을 선택하여 내역을 생성하세요.</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-white text-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Brain size={20} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-purple-900">AI 산출 가이드 활성화됨</h4>
                                <p className="text-[10px] font-bold text-purple-700 mt-0.5 opacity-80">선택한 아이템에 가장 적합한 표준품셈 근거를 실시간으로 매칭합니다.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 임시 UI 컴포넌트 ---
const Plus = ({ size, className }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

export default CivilQuantityTakeoff;
