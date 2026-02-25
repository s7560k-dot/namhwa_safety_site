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
    Clock,
    Download,
    Trash2,
    RotateCcw,
    ChevronRight,
    Plus as PlusIcon
} from 'lucide-react';

import { STANDARD_ITEMS, StandardItem, FrameworkCalc } from '../utils/FrameworkCalc';
import { getMapping, saveMapping } from '../services/mappingService';

interface CalculationRowProps {
    layerName: string;
    baseQty: number;
    unit: string;
    onAddToStatement: (item: any) => void;
}

const CalculationRow: React.FC<CalculationRowProps> = ({ layerName, baseQty, unit, onAddToStatement }) => {
    const [selectedItem, setSelectedItem] = useState<StandardItem | null>(null);
    const [params, setParams] = useState<Record<string, number>>({});
    const [customName, setCustomName] = useState("");
    const [customUnit, setCustomUnit] = useState("");
    const [derivationPreview, setDerivationPreview] = useState<{ derivation: string, finalQty: number } | null>(null);
    const [isDbLoading, setIsDbLoading] = useState(true);

    // 컴포넌트 마운트 시 파이어베이스에서 기존 매핑 로드
    React.useEffect(() => {
        const fetchMapping = async () => {
            const mappedData = await getMapping(layerName);
            if (mappedData && mappedData.standardItemId) {
                const found = STANDARD_ITEMS.find(item => item.id === mappedData.standardItemId);
                if (found) {
                    setSelectedItem(found);
                    const mergedParams: Record<string, number> = {};
                    found.requirements.forEach(req => { mergedParams[req.id] = req.defaultValue; });
                    if (mappedData.params) Object.assign(mergedParams, mappedData.params);
                    setParams(mergedParams);
                    if (mappedData.customName) setCustomName(mappedData.customName);
                    if (mappedData.customUnit) setCustomUnit(mappedData.customUnit);
                }
            }
            setIsDbLoading(false);
        };
        fetchMapping();
    }, [layerName]);

    // 표준 아이템(드롭다운) 선택 핸들러
    const handleSelectStandardItem = (item: StandardItem) => {
        setSelectedItem(item);

        // 초기 파라미터 세팅
        const initParams: Record<string, number> = {};
        item.requirements.forEach(req => { initParams[req.id] = req.defaultValue; });
        setParams(initParams);

        if (item.id !== "manual_input") {
            setCustomName("");
            setCustomUnit("");
        }

        // 변경된 아이템 DB 자동 저장
        saveMapping(layerName, { standardItemId: item.id, params: initParams, customName: "", customUnit: "" });
    };

    const handleParamChange = (id: string, value: number) => {
        setParams(prev => {
            const next = { ...prev, [id]: value };
            if (selectedItem) saveMapping(layerName, { params: next });
            return next;
        });
    };

    const handleCustomNameChange = (val: string) => {
        setCustomName(val);
        saveMapping(layerName, { customName: val });
    }

    const handleCustomUnitChange = (val: string) => {
        setCustomUnit(val);
        saveMapping(layerName, { customUnit: val });
    }

    // params가 변할 때마다 수식(derivation) 실시간 업데이트
    React.useEffect(() => {
        if (selectedItem) {
            const result = FrameworkCalc.generateDerivation(selectedItem.id, params, baseQty, customUnit || unit);
            setDerivationPreview(result);
        } else {
            setDerivationPreview(null);
        }
    }, [selectedItem, params, baseQty, unit, customUnit]);

    const handleConfirmAdd = () => {
        if (!selectedItem || !derivationPreview) return;

        const isManual = selectedItem.id === "manual_input";
        if (isManual && (!customName || !customUnit)) {
            alert("직접 입력 항목은 '커스텀 공종명'과 '단위'를 반드시 입력해야 합니다.");
            return;
        }

        const finalItem = {
            id: Date.now() + Math.random(),
            name: isManual && customName ? customName : selectedItem.name,
            spec: `[도면 레이어] ${layerName}`,
            unit: isManual && customUnit ? customUnit : (selectedItem.outputUnit || (unit === 'm2' ? 'm2 / m3' : unit)),
            baseQty: baseQty,
            quantity: derivationPreview.finalQty,
            basis: selectedItem.basisText,
            derivation: derivationPreview.derivation,
            params: params,
            originalLayer: layerName
        };
        onAddToStatement(finalItem);
    };

    return (
        <div className="flex flex-col gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-blue-200 transition-colors mb-3">
            {/* 상단: 레이어명 및 드롭다운 */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Layers size={16} className="text-blue-500 shrink-0" />
                    <span className="text-sm font-black text-gray-800 truncate">{layerName}</span>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 rounded-full">
                        {baseQty.toLocaleString()} {unit}
                    </span>
                </div>

                <div className="flex-1 max-w-[250px] relative mt-1 lg:mt-0">
                    {isDbLoading ? (
                        <div className="h-8 bg-gray-50 animate-pulse rounded-lg w-full"></div>
                    ) : (
                        <select
                            className={`w-full text-xs font-bold border rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${!selectedItem ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                            value={selectedItem?.id || ""}
                            onChange={(e) => {
                                const found = STANDARD_ITEMS.find(i => i.id === e.target.value);
                                if (found) handleSelectStandardItem(found);
                            }}
                        >
                            <option value="" disabled>⚠️ 미매핑 (사내 표준 아이템 선택)</option>
                            {Array.from(new Set(STANDARD_ITEMS.map(i => i.group || '기타'))).map(group => (
                                <optgroup key={group} label={group}>
                                    {STANDARD_ITEMS.filter(i => (i.group || '기타') === group).map(item => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* 하단: 변수 입력창 및 수식 프리뷰, 버튼 */}
            {selectedItem && derivationPreview && (
                <div className="mt-2 pt-3 border-t border-gray-50/80 flex flex-col gap-3">
                    {/* 변수 입력 영역 */}
                    <div className="flex flex-wrap gap-2">
                        {selectedItem.id === "manual_input" && (
                            <div className="flex items-center gap-2 mb-1 w-full">
                                <input type="text" placeholder="커스텀 공종명 입력" className="flex-1 text-xs font-bold px-2.5 py-1.5 bg-yellow-50 border border-yellow-200 rounded focus:outline-none focus:border-yellow-500 text-yellow-900" value={customName} onChange={e => handleCustomNameChange(e.target.value)} />
                                <input type="text" placeholder="단위 (예: 개소)" className="w-24 text-xs font-bold px-2.5 py-1.5 bg-yellow-50 border border-yellow-200 rounded focus:outline-none focus:border-yellow-500 text-yellow-900 text-center" value={customUnit} onChange={e => handleCustomUnitChange(e.target.value)} />
                            </div>
                        )}
                        {selectedItem.requirements.map(req => (
                            <div key={req.id} className="flex items-center gap-1.5 bg-blue-50/50 border border-blue-100 rounded px-2.5 py-1.5">
                                <span className="text-[10px] text-blue-700 font-bold">{req.name}</span>
                                <input
                                    type="number"
                                    value={params[req.id] ?? req.defaultValue}
                                    onChange={(e) => handleParamChange(req.id, Number(e.target.value))}
                                    className="w-14 text-xs font-black text-gray-800 border-b border-dashed border-blue-300 focus:outline-none focus:border-blue-600 px-1 text-center bg-transparent"
                                />
                                {req.unit && <span className="text-[10px] items-center text-gray-400 font-bold">{req.unit}</span>}
                            </div>
                        ))}
                    </div>

                    {/* 산출식 프리뷰 & 전송 버튼 */}
                    <div className="flex items-center justify-between gap-4 mt-1 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-wider">Derivation Preview</p>
                            <p className="text-[11px] font-mono font-bold text-gray-600 truncate bg-white px-2 py-1 rounded border border-gray-100">
                                {derivationPreview.derivation} = <span className="text-blue-600 ml-1">{derivationPreview.finalQty.toLocaleString()}</span>
                            </p>
                        </div>
                        <button
                            onClick={handleConfirmAdd}
                            className="shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-colors shadow-sm"
                        >
                            <PlusIcon size={14} />
                            내역서에 추가
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// 우측 최종 내역서(Quantity Statement)용 단순 렌더링 컴포넌트
interface StatementRowProps {
    item: any;
    onRemove: (id: number) => void;
}

const StatementRow: React.FC<StatementRowProps> = ({ item, onRemove }) => {
    return (
        <tr className="group hover:bg-gray-50/50 transition-colors border-y border-gray-50">
            <td className="px-4 py-4">
                <p className="text-sm font-black text-gray-800">{item.name}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">{item.spec}</p>
                {item.params && Object.keys(item.params).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(item.params).map(([key, value]) => (
                            <span key={key} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold">
                                {key}: {String(value)}
                            </span>
                        ))}
                    </div>
                )}
            </td>
            <td className="px-4 py-4">
                <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-black uppercase">{item.unit}</span>
            </td>
            <td className="px-4 py-4">
                <p className="text-sm font-black text-blue-600">{item.quantity?.toLocaleString(undefined, { maximumFractionDigits: 3 })}</p>
            </td>
            <td className="px-4 py-4">
                {item.derivation && (
                    <div className="p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-[10px] font-bold text-blue-800 font-mono inline-flex items-center gap-1.5">
                        <Calculator size={12} className="text-blue-400 shrink-0" />
                        <span className="whitespace-normal break-keep max-w-[300px]">{item.derivation}</span>
                    </div>
                )}
            </td>
            <td className="px-4 py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-2 max-w-[200px]">
                    <Brain size={14} className="text-purple-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-gray-500 leading-normal whitespace-normal break-keep">{item.basis}</p>
                </div>
                <button
                    onClick={() => onRemove(item.id)}
                    className="p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors shrink-0"
                    title="삭제"
                >
                    <Trash2 size={16} />
                </button>
            </td>
        </tr>
    );
};

const CivilQuantityTakeoff: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [dxfData, setDxfData] = useState<any>(null);
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [aiRecommendation, setAiRecommendation] = useState<string>("");

    // --- 환경 설정 ---
    const API_BASE_URL = 'https://us-central1-namhwa-safety-dashboard.cloudfunctions.net';

    // --- 핸들러 ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const uploadedFile = e.target.files[0];
            const fileName = uploadedFile.name.toLowerCase();

            if (fileName.endsWith('.dwg')) {
                alert("DWG 파일은 분석할 수 없습니다. DXF 형식으로 변환 후 업로드해주세요!");
                return;
            }

            if (!fileName.endsWith('.dxf')) {
                alert("DXF 형식의 도면 파일만 업로드 가능합니다.");
                return;
            }

            setFile(uploadedFile);

            // 도면 분석 API 호출
            setIsAnalyzing(true);
            const formData = new FormData();
            formData.append('file', uploadedFile);

            try {
                const response = await fetch(`${API_BASE_URL}/analyze_dxf`, {
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

    const handleAddItemToStatement = (finalItem: any) => {
        setSelectedItems([...selectedItems, finalItem]);
    };

    const handleExportExcel = async () => {
        if (selectedItems.length === 0) return;

        try {
            const response = await fetch(`${API_BASE_URL}/export_excel`, {
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

    const handleReset = () => {
        if (window.confirm("모든 산출 내역과 도면 데이터를 초기화하시겠습니까?")) {
            setFile(null);
            setDxfData(null);
            setSelectedItems([]);
            setAiRecommendation("");
        }
    };

    const handleRemoveItem = (idToRemove: number) => {
        setSelectedItems(prevItems => prevItems.filter(item => item.id !== idToRemove));
    };

    const handleUpdateItem = (idToUpdate: number, updates: any) => {
        setSelectedItems(prevItems => prevItems.map(item =>
            item.id === idToUpdate ? { ...item, ...updates } : item
        ));
    };

    return (
        <div className="max-w-[1600px] mx-auto p-8 space-y-8 bg-gray-50 min-h-screen font-sans">
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
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white text-gray-600 rounded-xl text-xs font-black border border-gray-200 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                    >
                        <RotateCcw size={16} />
                        전체 초기화
                    </button>
                    <div className="flex flex-col items-end border-l border-gray-200 pl-4 ml-2">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">System Status</span>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold uppercase">AI Engine Online</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* 1단계: 도면 분석 & 매핑 (Auto-Takeoff) */}
                <div className="col-span-12 xl:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full bg-gradient-to-b from-white to-gray-50/30">
                        <div className="flex items-center gap-2 font-black text-gray-800 mb-6">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black">1</div>
                            <span>Auto-Takeoff & Layer Mapper</span>
                        </div>

                        <div className="flex-1 space-y-6">
                            {/* 업로드 영역 */}
                            <label className="group relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                                <FileUp className="w-8 h-8 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                <div className="mt-3 flex flex-col items-center">
                                    <span className="text-sm font-black text-gray-600">DXF 도면 업로드</span>
                                    <span className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-widest">DXF 형식 권장 (R2018)</span>
                                </div>
                                <input type="file" className="hidden" accept=".dxf" onChange={handleFileUpload} />
                            </label>

                            {/* 상태 표시 */}
                            {(file || isAnalyzing) && (
                                <div className="p-3 bg-white rounded-xl flex items-center justify-between border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <Layers size={16} className="text-blue-500" />
                                        <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]">{file?.name || "분석 중..."}</span>
                                    </div>
                                    {isAnalyzing && <Clock size={16} className="text-blue-500 animate-spin" />}
                                </div>
                            )}

                            {/* 매핑 리스트 영역 */}
                            {dxfData && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                                            Extracted Layers Translator
                                        </p>
                                        <span className="text-[10px] font-bold text-gray-400">{Object.keys(dxfData).length} Layers Found</span>
                                    </div>

                                    <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                        {Object.entries(dxfData).map(([layer, data]: [string, any]) => (
                                            <CalculationRow
                                                key={layer}
                                                layerName={layer}
                                                baseQty={data.area > 0 ? data.area : data.length}
                                                unit={data.area > 0 ? "m2" : "m"}
                                                onAddToStatement={handleAddItemToStatement}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2단계: 최종 산출 내역서 (Quantity Statement) */}
                <div className="col-span-12 xl:col-span-7 space-y-6">
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
                                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Derivation (산출식)</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Basis (AI Recommend)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 whitespace-nowrap">
                                        {selectedItems.map((item) => (
                                            <StatementRow
                                                key={item.id}
                                                item={item}
                                                onRemove={handleRemoveItem}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-2 shadow-inner border border-gray-100">
                                    <FileSpreadsheet size={32} />
                                </div>
                                <div>
                                    <p className="text-[15px] font-black text-gray-700">추가된 산출 내역이 없습니다</p>
                                    <p className="text-[11px] text-gray-400 font-bold mt-2 leading-relaxed">
                                        좌측 분석 패널에서 도면 레이어를 매핑하고<br />
                                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono text-gray-500 mx-1">+ 내역서에 추가</kbd> 버튼을 누르면 이 곳에 정리됩니다.
                                    </p>
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
