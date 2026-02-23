import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfUse = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-semibold">
                        <ArrowLeft size={20} />
                        <span>홈으로 돌아가기</span>
                    </Link>
                    <div className="font-black tracking-tighter text-xl text-slate-900">
                        남화토건<span className="font-light">주식회사</span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-8">서비스 이용약관</h1>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-8">

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">제 1 조 (목적)</h2>
                        <p className="mt-4">
                            본 약관은 남화토건주식회사(이하 '회사')가 제공하는 종합 안전보건 관리 시스템인 Safety Hub 서비스(이하 '서비스')의 이용과 관련하여 회사와 사용자(협력사 및 임직원 포함) 간의 권리, 의무, 책임사항 및 기본적인 절차를 규정함을 목적으로 합니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">제 2 조 (용어의 정의)</h2>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li>"서비스"란 회사가 사업장 안전관리를 위해 디지털 형태로 제공하는 문서 관리, 게시판, 공정 현황 등의 온라인 플랫폼을 말합니다.</li>
                            <li>"이용자"란 서비스에 접속하여 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                            <li>"협력사"란 회사와 도급, 용역, 위탁 등의 계약을 체결하고 현장에서 업무를 수행하는 사업체를 말합니다.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">제 3 조 (서비스의 제공 및 변경)</h2>
                        <p className="mt-4">
                            회사는 이용자에게 안전보건 법령 준수 및 체계적인 현장 관리를 위한 제반 시스템을 제공합니다. 단, 시스템 정기점검 또는 기술적 필요에 의해 사전 공지 후 서비스의 일부 또는 전부를 변경하거나 중단할 수 있습니다.
                        </p>
                        <div className="bg-red-50 p-6 rounded-xl border border-red-100 mt-4 text-red-800 text-sm">
                            <strong className="block mb-2 text-red-900"><AlertTriangle className="inline-block mr-1 mb-1" size={16} /> 안전 수칙 준수 의무</strong>
                            본 시스템의 사용이 현장에서의 실제적인 안전보건 의무(보호구 착용, 위험성 평가 실시 등)를 대체하지 않으며, 모든 이용자는 관계 법령 및 현장의 안전 수칙을 최우선으로 준수해야 합니다.
                        </div>
                    </section>

                    <p className="text-sm text-slate-400 mt-12 pt-8 border-t border-slate-200">
                        본 이용약관은 2026년 1월 1일부터 시행됩니다. (예시 데이터입니다)
                    </p>

                </div>
            </main>
        </div>
    );
};

// SVG Icon for Alert
const AlertTriangle = ({ size = 24, color = "currentColor", className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
    </svg>
);

export default TermsOfUse;
