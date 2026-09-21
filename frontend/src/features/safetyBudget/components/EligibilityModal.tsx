import { AlertTriangle, X } from 'lucide-react';

interface EligibilityModalProps {
    open: boolean;
    reason: string;
    onClose: () => void;
}

/** 결제 적격성 불인정 시 표시하는 페이지 내 모달. 브라우저 기본 alert 대신 사용한다. */
export function EligibilityModal({ open, reason, onClose }: EligibilityModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-700"
                    aria-label="닫기"
                >
                    <X size={20} />
                </button>
                <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-6">
                    <AlertTriangle size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">산안비 인정 항목이 아닙니다</h3>
                <p className="text-slate-600 leading-relaxed mb-8">{reason}</p>
                <button
                    onClick={onClose}
                    className="w-full bg-slate-900 text-white font-bold rounded-xl py-3 hover:bg-red-600 transition-colors"
                >
                    확인
                </button>
            </div>
        </div>
    );
}
