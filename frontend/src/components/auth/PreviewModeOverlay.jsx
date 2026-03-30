import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Eye } from 'lucide-react';

const PreviewModeOverlay = () => {
    const { isMock, setMockUser } = useAuth();

    if (!isMock) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-bounce">
            <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-black tracking-tight text-slate-300">PREVIEW MODE</span>
                </div>
                <div className="h-4 w-px bg-white/10"></div>
                <div className="flex items-center gap-2">
                    <Eye size={14} className="text-blue-300" />
                    <span className="text-sm font-bold text-white">이재훈님 계정 체험 중</span>
                </div>
                <button 
                    onClick={() => {
                        setMockUser(null);
                        window.location.href = '/login';
                    }}
                    className="ml-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-black"
                >
                    <LogOut size={14} />
                    미리보기 종료
                </button>
            </div>
        </div>
    );
};

export default PreviewModeOverlay;
