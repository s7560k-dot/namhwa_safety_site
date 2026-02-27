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
    const [earnedValue, setEarnedValue] = useState<number>(0); // 직접 입력 기성액
    const [actualCost, setActualCost] = useState<number>(0);
    const [isSaving, setIsSaving] = useState(false);

    // 모달이 열릴 때 선택된 task의 기존 데이터로 폼 초기화
    useEffect(() => {
        if (task && isOpen) {
            // 기존 진도율 계산: EV / PV * 100
            const currentProgress = task.pv > 0 ? Math.round((task.ev / task.pv) * 100) : 0;
            setProgress(currentProgress);
            setEarnedValue(task.ev || 0);
            setActualCost(task.ac || 0);
        }
    }, [task, isOpen]);

    // 진도율 변경 시 기성액 자동 계산
    const handleProgressChange = (newProgress: number) => {
        if (!task) return;
        const boundedProgress = Math.min(100, Math.max(0, newProgress));
        setProgress(boundedProgress);
        setEarnedValue(Math.round(task.pv * (boundedProgress / 100)));
    };

    // 기성액 변경 시 진도율 자동 역산
    const handleEVChange = (newEV: number) => {
        if (!task || task.pv <= 0) return;
        setEarnedValue(newEV);
        const calculatedProgress = Math.round((newEV / task.pv) * 100);
        setProgress(Math.min(100, calculatedProgress));
    };

    if (!isOpen || !task) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await db.collection('sites').doc(projectId).collection('wbs_tasks').doc(task.id).update({
                ev: earnedValue,
                ac: actualCost,
                currentProgress: progress,
                actualCost: actualCost,
                updatedAt: new Date().toISOString()
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">공정 실적 업데이트</h3>
                        <p className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-2 inline-block">
                            {task.name}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* 폼 영역 */}
                <div className="p-8 space-y-8">
                    {/* 계획 정보 섹션 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">계획 예산 (PV)</span>
                            <span className="text-sm font-black text-gray-900">{task.pv.toLocaleString()} <span className="text-[10px]">원</span></span>
                        </div>
                        <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">현재 상태</span>
                            <span className="text-sm font-black text-indigo-600">{progress}% <span className="text-[10px]">완료</span></span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* 기종(EV) 입력 섹션 */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black tracking-widest text-gray-500 uppercase flex items-center justify-between">
                                <span>기성 실적 (Earned Value)</span>
                                <span className="text-blue-600 font-black italic">DIRECT INPUT</span>
                            </label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    value={earnedValue}
                                    onChange={(e) => handleEVChange(Number(e.target.value))}
                                    className="w-full text-lg font-black bg-gray-50 border-2 border-gray-100 text-gray-900 rounded-2xl pl-5 pr-12 py-4 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                                    placeholder="금액 입력"
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-gray-300 group-focus-within:text-blue-500">원</span>
                            </div>
                        </div>

                        {/* 진도율 슬라이더 */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                <span>진도율 자동 역산</span>
                                <span className="text-gray-900">{progress}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress}
                                onChange={(e) => handleProgressChange(Number(e.target.value))}
                                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all hover:h-3"
                            />
                        </div>

                        {/* 실제 투입원가(AC) 섹션 */}
                        <div className="space-y-3 pt-4 border-t border-gray-50">
                            <label className="text-[11px] font-black tracking-widest text-gray-500 uppercase">
                                실제 투입 원가 (Actual Cost)
                            </label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    value={actualCost}
                                    onChange={(e) => setActualCost(Number(e.target.value))}
                                    className="w-full text-lg font-black bg-gray-50 border-2 border-gray-100 text-gray-900 rounded-2xl pl-5 pr-12 py-4 focus:outline-none focus:border-red-500 focus:bg-white transition-all shadow-inner"
                                    placeholder="투입 원가 입력"
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-gray-300 group-focus-within:text-red-500">원</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 하단 버튼 */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-4">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="py-4 text-xs font-black tracking-widest text-gray-500 bg-white border border-gray-200 hover:bg-gray-100 rounded-2xl transition-all uppercase"
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center justify-center py-4 text-xs font-black tracking-widest text-white bg-gray-900 hover:bg-black rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 uppercase"
                    >
                        {isSaving ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>
                        ) : (
                            <>
                                <Save size={16} className="mr-2" /> SAVE DATA
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};


export default EvmUpdateModal;
