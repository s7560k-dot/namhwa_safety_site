import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';

const ContactSupport = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        message: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitInquiry = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) {
            alert("성함, 이메일, 문의 내용은 필수 입력 항목입니다.");
            return;
        }

        setSubmitting(true);
        try {
            await db.collection('inquiries').add({
                ...formData,
                status: 'unread',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("문의가 성공적으로 전달되었습니다. 담당자가 확인 후 연락드리겠습니다.");
            setFormData({ name: '', phone: '', email: '', message: '' });
        } catch (error) {
            console.error("Error submitting inquiry:", error);
            alert("문의 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-semibold text-sm md:text-base">
                        <ArrowLeft size={18} md:size={20} />
                        <span>홈으로</span>
                    </Link>
                    <div className="font-black tracking-tighter text-lg md:text-xl text-slate-900">
                        남화토건<span className="font-light">주식회사</span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16">
                <div className="text-center mb-10 md:mb-16">
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">고객 지원 및 문의</h1>
                    <p className="text-sm md:text-base text-slate-500 font-medium px-4">서비스 이용 중 불편하신 점이나 안전보건 관련 문의사항을 남겨주시면 신속하게 답변해 드리겠습니다.</p>
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

                    {/* 시스템 오류 문의 안내 및 문의 폼 */}
                    <div className="space-y-8">
                        {/* 1:1 오류 접수 요약 카드 */}
                        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl -mr-20 -mt-20 opacity-40 pointer-events-none"></div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold mb-3">전담팀 1:1 빠른 지원</h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                    대시보드 접속 에러나 데이터 동기화 등 기술적 지원이 필요한 경우, 아래 폼을 작성해 주시면 담당자가 확인 후 연락드립니다.
                                </p>
                                <div className="flex items-center gap-3 text-xs font-bold text-blue-400 uppercase tracking-widest">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                    Average Response: 2 Hours
                                </div>
                            </div>
                        </div>

                        {/* 문의 작성 폼 */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Mail className="text-blue-600" size={24} />
                                문의하기
                            </h2>
                            <form className="space-y-4" onSubmit={handleSubmitInquiry}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">성함</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="홍길동"
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">연락처</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="010-0000-0000"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">이메일 주소</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="example@namhwa.com"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">문의 내용</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        rows="4"
                                        placeholder="불편 사항이나 궁금하신 점을 상세히 적어주세요."
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm resize-none"
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {submitting ? '전송 중...' : '문의 보내기'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default ContactSupport;
