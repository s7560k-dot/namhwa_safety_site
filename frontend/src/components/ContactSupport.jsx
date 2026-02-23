import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Clock } from 'lucide-react';

const ContactSupport = () => {
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
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">고객 지원 및 문의</h1>
                    <p className="text-slate-500 font-medium">서비스 이용 중 불편하신 점이나 안전보건 관련 문의사항을 남겨주시면 신속하게 답변해 드리겠습니다.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* 연락처 정보 */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Contact Information</h2>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">대표 전화</h3>
                                    <p className="text-slate-500 mt-1">062-520-1090</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">이메일 문의</h3>
                                    <a href="mailto:nhs1033@nate.com" className="text-blue-600 hover:underline mt-1 inline-block">nhs1033@nate.com</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">본사 위치</h3>
                                    <p className="text-slate-500 mt-1 leading-relaxed">광주광역시 북구 금남로 146(남화빌딩)<br />안전보건팀 (우) 61241</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-slate-100 p-3 rounded-xl text-slate-600">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">운영 시간</h3>
                                    <p className="text-slate-500 mt-1">평일 09:00 - 18:00 (점심시간 12:00 - 13:00)</p>
                                    <p className="text-slate-400 text-sm mt-1">주말 및 공휴일 휴무</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 시스템 오류 문의 안내 (가상 섹션) */}
                    <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>

                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-4">시스템 1:1 오류 접수</h2>
                            <p className="text-slate-400 leading-relaxed mb-8">
                                대시보드 접속 에러, 로그인 실패, 데이터 동기화 지연 등 시스템적인 오류가 발생한 경우 빠른 로그 확인을 위해 아래 버튼을 클릭하여 안전보건팀에 접수해 주세요.
                            </p>
                        </div>

                        <div className="relative z-10 flex flex-col gap-3">
                            <a href="mailto:nhs1033@nate.com?subject=[오류접수]%20시스템%20장애%20리포트" className="block text-center bg-blue-600 hover:bg-blue-500 transition-colors text-white font-bold py-4 rounded-xl shadow-lg">
                                안전보건팀에 이메일 보내기
                            </a>
                            <p className="text-center text-xs text-slate-500">
                                업무시간 외의 장애 접수는 익일 오전 중으로 순차 처리됩니다.
                            </p>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default ContactSupport;
