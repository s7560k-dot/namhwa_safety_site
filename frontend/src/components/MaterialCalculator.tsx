import React, { useState } from 'react';
import {
    Calculator,
    Save,
    AlertTriangle,
    Box,
    Layers,
    FileText,
    Trash2,
    RefreshCw,
    Info
} from 'lucide-react';
import { CalculationInput, CalculationResult, RebarDiameter } from '../types/material';
import { FrameworkCalc } from '../utils/FrameworkCalc';
import { materialService } from '../services/materialService';

const MaterialCalculator: React.FC = () => {
    // --- 상태 관리 ---
    const [input, setInput] = useState<CalculationInput>({
        projectName: '',
        length: 0,
        width: 0,
        height: 0,
        rebarDiameter: 'D10',
        totalRebarLength: 0
    });

    const [result, setResult] = useState<CalculationResult | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [history, setHistory] = useState<any[]>([]); // 최근 이력 저장용 (데모용)

    // --- 핸들러 ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setInput(prev => ({
            ...prev,
            [name]: name === 'projectName' || name === 'rebarDiameter' ? value : Number(value)
        }));
    };

    const handleCalculate = () => {
        // 1. 유효성 검사
        if (!input.projectName) {
            alert("프로젝트명을 입력해주세요.");
            return;
        }
        if (input.length <= 0 || input.width <= 0 || input.height <= 0) {
            alert("치수는 0보다 커야 합니다.");
            return;
        }

        // 2. 계산 수행
        const calcResult = FrameworkCalc.calculate(input);
        setResult(calcResult);
    };

    const handleSave = async () => {
        if (!result) return;
        setIsSaving(true);
        try {
            await materialService.saveCalculation(input, result);
            alert("성공적으로 저장되었습니다.");
            // 저장 후 초기화 또는 목록 갱신 로직 추가 가능
        } catch (error) {
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen font-sans">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-200 pb-6">
                <div className="p-3 bg-red-700 text-white rounded-xl shadow-lg">
                    <Calculator size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">골조공사 물량 산출기</h1>
                    <p className="text-sm font-medium text-slate-500 mt-2 uppercase tracking-wider">Framework Material Calculator</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Input Form */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                    <div className="flex items-center gap-2 text-slate-900 font-bold mb-2">
                        <Info size={18} className="text-red-700" />
                        <span>제원 입력</span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">프로젝트명</label>
                            <input
                                name="projectName"
                                value={input.projectName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-700/20 focus:outline-none transition-all"
                                placeholder="현장 또는 구체 명칭"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">길이 (L)</label>
                                <div className="relative">
                                    <input name="length" type="number" value={input.length} onChange={handleInputChange} className="w-full pl-4 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-700" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">m</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">폭 (W)</label>
                                <div className="relative">
                                    <input name="width" type="number" value={input.width} onChange={handleInputChange} className="w-full pl-4 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-700" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">m</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">높이 (H)</label>
                                <div className="relative">
                                    <input name="height" type="number" value={input.height} onChange={handleInputChange} className="w-full pl-4 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-700" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">m</span>
                                </div>
                            </div>
                        </div>

                        {/* Safety Alert (H >= 2m) */}
                        {input.height >= 2 && (
                            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl animate-pulse">
                                <AlertTriangle className="text-red-600 shrink-0" size={20} />
                                <span className="text-xs font-black text-red-700 uppercase tracking-tighter">고소 작업 안전 수칙 확인 요망 (H ≥ 2m)</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">철근 규격</label>
                                <select
                                    name="rebarDiameter"
                                    value={input.rebarDiameter}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-700"
                                >
                                    <option value="D10">D10</option>
                                    <option value="D13">D13</option>
                                    <option value="D16">D16</option>
                                    <option value="D19">D19</option>
                                    <option value="D22">D22</option>
                                    <option value="D25">D25</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">총 연장</label>
                                <div className="relative">
                                    <input name="totalRebarLength" type="number" value={input.totalRebarLength} onChange={handleInputChange} className="w-full pl-4 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-700" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">m</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCalculate}
                            className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group shadow-xl"
                        >
                            <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                            계산하기
                        </button>
                    </div>
                </div>

                {/* Right Column: Calculation Result */}
                <div className="space-y-6">
                    {result ? (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2 text-slate-900 font-bold">
                                    <FileText size={18} className="text-red-700" />
                                    <span>산출 결과 요약</span>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 text-white rounded-lg text-xs font-bold hover:bg-red-800 disabled:opacity-50 transition-colors"
                                >
                                    <Save size={14} />
                                    {isSaving ? '저장 중...' : '저장하기'}
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* concrete */}
                                <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                                        <Box size={16} className="text-blue-600" />
                                        컴포넌트 1: 레미콘
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                                        <div className="bg-white p-2 border border-slate-100 rounded-lg">레미콘 (할증 1%): <span className="text-blue-700 ml-1 font-black text-sm">{result.concrete.remicon_m3} m³</span></div>
                                        <div className="bg-white p-2 border border-slate-100 rounded-lg">지수재: <span className="text-slate-900 ml-1">{result.concrete.waterstop_m} m</span></div>
                                    </div>
                                </div>

                                {/* rebar */}
                                <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                                        <Layers size={16} className="text-orange-600" />
                                        컴포넌트 2: 철근
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                                        <div className="bg-white p-2 border border-slate-100 rounded-lg">철근 (할증 3%): <span className="text-orange-700 ml-1 font-black text-sm">{result.rebar.rebar_ton} ton</span></div>
                                        <div className="bg-white p-2 border border-slate-100 rounded-lg">결속선: <span className="text-slate-900 ml-1">{result.rebar.tie_wire_kg} kg</span></div>
                                        <div className="bg-white p-2 border border-slate-100 rounded-lg">간격재: <span className="text-slate-900 ml-1">{result.rebar.spacers_ea} ea</span></div>
                                    </div>
                                </div>

                                {/* formwork */}
                                <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                                        <Layers size={16} className="text-green-600" />
                                        컴포넌트 3: 거푸집
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                                        <div className="bg-white p-2 border border-slate-100 rounded-lg">거푸집 (할증 5%): <span className="text-green-700 ml-1 font-black text-sm">{result.formwork.form_area_m2} m²</span></div>
                                        <div className="bg-white p-2 border border-slate-100 rounded-lg">박리제: <span className="text-slate-900 ml-1">{result.formwork.form_oil_liter} L</span></div>
                                        <div className="bg-white p-2 border border-slate-100 rounded-lg">플랫타이: <span className="text-slate-900 ml-1">{result.formwork.flat_tie_ea} ea</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center space-y-4">
                            <div className="p-4 bg-white rounded-full shadow-sm text-slate-300">
                                <Calculator size={48} />
                            </div>
                            <div className="space-y-1">
                                <p className="font-black text-slate-400">제원 입력 후 계산해주세요</p>
                                <p className="text-xs text-slate-400 font-medium">실시간 산출 결과를 이곳에서 확인할 수 있습니다.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MaterialCalculator;
