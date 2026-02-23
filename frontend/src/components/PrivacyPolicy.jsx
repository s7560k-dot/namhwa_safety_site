import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200">
            {/* Header */}
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

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-8">개인정보 처리방침</h1>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-8">

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">1. 개인정보의 처리 목적</h2>
                        <p>남화토건주식회사(이하 '회사')는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li>안전보건 관리 시스템(Safety Hub) 회원 가입 및 관리</li>
                            <li>현장 작업자 안전 규정 준수 여부 점검 및 관리</li>
                            <li>중대재해처벌법 등 관계 법령에 따른 안전보건 확보 의무 이행 증빙</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">2. 처리하는 개인정보의 항목</h2>
                        <p>회사는 안전보건 관리 및 서비스 제공을 위해 다음의 개인정보 항목을 처리하고 있습니다.</p>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 mt-4 shadow-sm">
                            <ul className="space-y-3">
                                <li><strong className="text-slate-800 text-sm bg-slate-100 px-2 py-1 rounded mr-2">필수항목</strong> 성명, 연락처, 소속(협력사명), 직책, 접속 IP 정보, 쿠키, 서비스 이용 기록</li>
                                <li><strong className="text-blue-600 text-sm bg-blue-50 px-2 py-1 rounded mr-2">선택항목</strong> 이메일 주소</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">3. 개인정보의 처리 및 보유 기간</h2>
                        <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-sm">
                            <li><strong>안전보건 관리 서비스 제공</strong>: 해당 현장 준공 및 정산 완료 시까지</li>
                            <li><strong>산업안전보건법에 따른 기록</strong>: 관련 법령에서 정한 기간(보통 3~5년) 동안 보관</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">4. 개인정보 파기 절차 및 방법</h2>
                        <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-sm">
                            <li><strong>전자적 파일</strong>: 기록을 재생할 수 없는 기술적 방법(로우레벨 포맷 등)을 사용하여 삭제</li>
                            <li><strong>종이 문서</strong>: 분쇄기로 분쇄하거나 소각하여 파기</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">5. 개인정보의 안전성 확보 조치</h2>
                        <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-sm">
                            <li><strong>관리적 조치</strong>: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
                            <li><strong>기술적 조치</strong>: 개인정보처리시스템 등의 접근권한 관리, 접속기록의 보관, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                            <li><strong>물리적 조치</strong>: 전산실, 자료보관실 등의 접근통제</li>
                        </ul>
                    </section>

                    <p className="text-sm text-slate-400 mt-12 pt-8 border-t border-slate-200">
                        본 방침은 2026년 2월 24일부터 시행됩니다.
                    </p>

                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
