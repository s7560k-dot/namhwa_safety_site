import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Info, Check } from 'lucide-react';

/**
 * CookieSettingsModal Component
 * 사용자가 웹사이트의 쿠키 사용 동의 및 설정을 관리할 수 있는 모달입니다.
 */
const CookieSettingsModal = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState({
        necessary: true, // 필수 쿠키는 항상 true
        functional: true,
        analytics: false,
        marketing: false,
    });

    const [isSaved, setIsSaved] = useState(false);

    // 저장된 설정 불러오기
    useEffect(() => {
        const savedSettings = localStorage.getItem('cookieSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleToggle = (key) => {
        if (key === 'necessary') return; // 필수 쿠키는 변경 불가
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        localStorage.setItem('cookieSettings', JSON.stringify(settings));
        setIsSaved(true);
        setTimeout(() => {
            setIsSaved(false);
            onClose();
        }, 1500);
    };

    const handleAcceptAll = () => {
        const allAccepted = {
            necessary: true,
            functional: true,
            analytics: true,
            marketing: true,
        };
        setSettings(allAccepted);
        localStorage.setItem('cookieSettings', JSON.stringify(allAccepted));
        setIsSaved(true);
        setTimeout(() => {
            setIsSaved(false);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-end p-6 md:p-12 pointer-events-none">
            {/* Backdrop - 클릭 시 닫기 위해 별도로 배치하거나 팝업형이라 제거/축소 */}
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] pointer-events-auto cursor-pointer" onClick={onClose}></div>

            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-200 pointer-events-auto animate-in slide-in-from-bottom-20 duration-500 relative z-20">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-900 p-2 rounded-xl text-white">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">쿠키 설정</h2>
                            <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Settings</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-300"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 py-8 max-h-[60vh] overflow-y-auto space-y-6">
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        남화토건 안전보건 자료실은 서비스 품질 향상 및 사용자 경험 최적화를 위해 쿠키를 사용합니다. 각 카테고리별 허용 여부를 선택해 주세요.
                    </p>

                    <div className="space-y-4">
                        {/* 필수 쿠키 */}
                        <div className="group flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-slate-900">필수 쿠키</h3>
                                    <span className="text-[10px] font-black px-2 py-0.5 bg-slate-200 text-slate-500 rounded-full uppercase tracking-tighter">Essential</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-normal">사이트의 기본 기능(로그인, 보안 등)을 위해 반드시 필요하며 비활성화할 수 없습니다.</p>
                            </div>
                            <div className="ml-4 w-12 h-6 bg-blue-600 rounded-full flex items-center px-1 opacity-50 cursor-not-allowed">
                                <div className="w-4 h-4 bg-white rounded-full translate-x-6"></div>
                            </div>
                        </div>

                        {/* 기능 쿠키 */}
                        <div className="group flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-slate-900">기능 쿠키</h3>
                                    <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-400 rounded-full uppercase tracking-tighter">Functional</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-normal">다크모드 설정, 언어 선택 등 개인화된 서비스 제공을 위해 사용됩니다.</p>
                            </div>
                            <button
                                onClick={() => handleToggle('functional')}
                                className={`ml-4 w-12 h-6 rounded-full flex items-center px-1 transition-all duration-300 ${settings.functional ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${settings.functional ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </button>
                        </div>

                        {/*분석 쿠키 */}
                        <div className="group flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-slate-900">분석 쿠키</h3>
                                    <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-500 rounded-full uppercase tracking-tighter">Analytics</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-normal">방문자 수, 체류 시간 등 서비스 개선을 위한 통계 데이터를 수집합니다.</p>
                            </div>
                            <button
                                onClick={() => handleToggle('analytics')}
                                className={`ml-4 w-12 h-6 rounded-full flex items-center px-1 transition-all duration-300 ${settings.analytics ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${settings.analytics ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-6 border-t border-slate-50 flex flex-col gap-2">
                    <button
                        onClick={handleAcceptAll}
                        disabled={isSaved}
                        className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"
                    >
                        모든 쿠키 허용
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaved}
                        className={`h-12 rounded-2xl font-black text-xs transition-all active:scale-95 ${isSaved ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'}`}
                    >
                        {isSaved ? <><Check size={14} /> 설정 저장됨</> : '기본 설정 유지 및 저장'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieSettingsModal;
