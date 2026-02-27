import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { X, Save } from 'lucide-react';
import { WbsTask } from './types';

interface EvmUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    task: WbsTask | null;
    onSuccess: () => void;
}

const EvmUpdateModal: React.FC<EvmUpdateModalProps> = ({ isOpen, onClose, projectId, task, onSuccess }) => {
    // 폼 상태 관리
    const [progress, setProgress] = useState<number>(0);
    const [actualCost, setActualCost] = useState<number>(0);
    const [isSaving, setIsSaving] = useState(false);

    // 모달이 열릴 때 선택된 task의 기존 데이터로 폼 초기화 (현재 진도율은 EV와 PV 비율로 역산하거나 기존 값이 없으면 0)
    useEffect(() => {
        if (task && isOpen) {
            // 기존 진도율 계산: EV / PV * 100 (안전하게 처리)
            const currentProgress = task.pv > 0 ? Math.round((task.ev / task.pv) * 100) : 0;
            setProgress(currentProgress);
            setActualCost(task.ac || 0);
        }
    }, [task, isOpen]);

    if (!isOpen || !task) return null;

    const handleSave = async () => {
        if (progress < 0 || progress > 100) {
            alert('진도율은 0에서 100 사이어야 합니다.');
            return;
        }

        setIsSaving(true);
        try {
            // 실제 기성(EV)은 = 계획예산(PV) * (입력한 진도율 / 100) 로 계산하여 같이 저장
            const calculatedEV = Math.round(task.pv * (progress / 100));

            await db.collection('sites').doc(projectId).collection('wbs_tasks').doc(task.id).update({
                ev: calculatedEV,
                ac: actualCost,
                currentProgress: progress, // 사용자가 명시한 currentProgress, actualCost 필드도 저장 
                actualCost: actualCost
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to update EVM data:', error);
            alert('실적 업데이트 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-black text-gray-800 tracking-tight">실적 업데이트</h3>
                        <p className="text-xs text-gray-500 font-bold mt-1">{task.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* 폼 영역 */}
                <div className="p-6 space-y-6">
                    {/* 읽기 전용 정보 */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex justify-between items-center">
                        <span className="text-xs font-black text-blue-800/70 tracking-tight">계획예산 (BAC/PV)</span>
                        <span className="text-sm font-black text-blue-900">{task.pv.toLocaleString()} 원</span>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black tracking-widest text-gray-500 uppercase flex items-center justify-between">
                                실제 진도율 (%)
                                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">{progress}%</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={progress}
                                onChange={(e) => setProgress(Number(e.target.value))}
                                className="w-full text-sm font-bold bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:font-normal placeholder:text-gray-400"
                                placeholder="예: 45"
                            />
                            {/* 슬라이더 직관성 추가 */}
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress}
                                onChange={(e) => setProgress(Number(e.target.value))}
                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black tracking-widest text-gray-500 uppercase">
                                실제 투입원가 (AC, 원)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={actualCost || ''}
                                    onChange={(e) => setActualCost(Number(e.target.value))}
                                    className="w-full text-sm font-bold bg-gray-50 border border-gray-200 text-gray-800 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:font-normal placeholder:text-gray-400"
                                    placeholder="투입된 원가를 입력하세요"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">원</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 하단 버튼 */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-5 py-2.5 text-xs font-black tracking-wide text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center px-6 py-2.5 text-xs font-black tracking-wide text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                    >
                        {isSaving ? (
                            <span className="flex items-center">
                                <span className="animate-spin h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full mr-2"></span>
                                처리 중...
                            </span>
                        ) : (
                            <>
                                <Save size={14} className="mr-1.5" /> 저장
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EvmUpdateModal;
