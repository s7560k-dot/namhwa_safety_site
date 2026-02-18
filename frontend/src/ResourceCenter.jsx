import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Shield,
    BookOpen,
    CheckSquare,
    Calculator,
    Zap,
    FileText,
    AlertTriangle,
    ClipboardCheck,
    Menu,
    X,
    ArrowRight,
    Lock,
    LayoutDashboard
} from 'lucide-react';

// CI 규정집 색상 (R127 G0 B0)
const BRAND_RED = "#7F0000";

// ----------------------------------------------------------------------
// [로고 심볼 컴포넌트]
// ----------------------------------------------------------------------
const NamhwaSymbol = ({ className }) => (
    <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <mask id="nh-logo-mask">
            <path d="M50 0 L100 30 L50 60 L0 30 Z" fill="white" />
            <path d="M36 8.4 L72 30 L68 32.4 L32 10.8 Z" fill="black" />
            <path d="M68 49.2 L32 27.6 L28 30 L64 51.6 Z" fill="black" />
        </mask>
        <rect x="0" y="0" width="100" height="60" fill={BRAND_RED} mask="url(#nh-logo-mask)" />
    </svg>
);

// ----------------------------------------------------------------------
// [모던 폰트가 적용된 로고 컴포넌트]
// ----------------------------------------------------------------------
const NamhwaLogo = ({ type = "horizontal", className = "", isScrolled = false }) => {
    return (
        <div className={`flex ${type === 'vertical' ? 'flex-col items-center' : 'items-center gap-3'} ${className}`}>
            <NamhwaSymbol className={type === 'vertical' ? "w-16 h-10 mb-3" : "w-10 h-8"} />
            <div className={`flex flex-col leading-none ${type === 'vertical' ? 'items-center' : 'items-start'}`}>
                <span className={`font-black tracking-tighter ${type === 'vertical' || isScrolled ? 'text-slate-900' : 'text-white'} ${type === 'vertical' ? 'text-2xl' : 'text-xl'} font-sans`}>
                    남화토건<span className="font-light">주식회사</span>
                </span>
                {type === 'vertical' && (
                    <span className="text-[0.55rem] font-medium text-slate-400 tracking-[0.2em] mt-1 uppercase font-sans">
                        Namhwa Construction Co., Ltd.
                    </span>
                )}
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// [메인 앱 컴포넌트]
// ----------------------------------------------------------------------
const ResourceCenter = () => {
    const [isSafetyOn, setIsSafetyOn] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [bgError, setBgError] = useState(false);

    // Background Image URL (Local SVG Asset - Created for guaranteed reliability)
    const BG_IMAGE_URL = "/bg_city_night.svg";

    const toggleSafety = () => {
        setIsSafetyOn(!isSafetyOn);
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const sites = [
        { id: 'siteA', title: "대광 새마을금고 골프연습장", link: "/dashboard/siteA", status: "진행중" },
        { id: 'siteB', title: "수원 노유자시설 신축공사", link: "/dashboard/siteB", status: "진행중" },
        { id: 'siteC', title: "평택 세탁소 시설 신축공사", link: "/dashboard/siteC", status: "진행중" }
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-red-100 antialiased overflow-x-hidden">
            {/* Google Fonts Pre-load (Inter) & Pretendard Stack */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700;900&display=swap');
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Pretendard Variable", "Pretendard", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; }
      `}</style>

            {/* Background Image Layer: Moved to Root for Fixed Positioning Context */}
            <div className={`fixed inset-0 z-0 transition-opacity duration-1000 ease-in-out ${isSafetyOn ? 'opacity-100' : 'opacity-0'}`}>
                {!bgError ? (
                    <img
                        src={BG_IMAGE_URL}
                        alt="Hong Kong Night Skyline"
                        className="w-full h-full object-cover pointer-events-none"
                        onError={() => setBgError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-black" />
                )}
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Navigation */}
            <nav className={`fixed w-full z-50 transition-all duration-500 ease-out ${isScrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm py-3' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <NamhwaLogo type="horizontal" isScrolled={isScrolled} />
                        <div className={`h-6 w-px hidden md:block ${isScrolled ? 'bg-slate-200' : 'bg-white/20'}`}></div>
                        <span className={`text-xs font-semibold tracking-widest uppercase hidden md:block pt-0.5 ${isScrolled ? 'text-slate-400' : 'text-white/60'}`}>
                            Safety Hub
                        </span>
                    </div>

                    <div className={`hidden md:flex gap-10 text-[13px] font-bold uppercase tracking-wider ${isScrolled ? 'text-slate-600' : 'text-white'}`}>
                        <a href="#systems" className="hover:text-red-500 transition-colors">Systems</a>
                        <a href="#sites" className="hover:text-red-500 transition-colors">Sites</a>
                        <a href="#sops" className="hover:text-red-500 transition-colors">Checklists</a>
                        <a href="#tools" className="hover:text-red-500 transition-colors">Tools</a>
                    </div>

                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`md:hidden ${isScrolled ? 'text-slate-800' : 'text-white'}`}>
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="absolute top-full left-0 w-full bg-white shadow-2xl py-6 px-8 flex flex-col gap-6 md:hidden border-t border-slate-50">
                        <a href="#systems" onClick={() => setMobileMenuOpen(false)} className="text-slate-900 font-bold text-lg">시스템 & 매뉴얼</a>
                        <a href="#sites" onClick={() => setMobileMenuOpen(false)} className="text-slate-900 font-bold text-lg">현장 대시보드</a>
                        <a href="#sops" onClick={() => setMobileMenuOpen(false)} className="text-slate-900 font-bold text-lg">SOP & 점검표</a>
                        <a href="#tools" onClick={() => setMobileMenuOpen(false)} className="text-slate-900 font-bold text-lg">안전 계산기</a>
                    </div>
                )}
            </nav>

            {/* Hero Section: Night View Background Logic */}
            <section className={`relative min-h-screen flex items-center justify-center overflow-hidden transition-all duration-1000 ${isSafetyOn ? 'bg-transparent' : 'bg-slate-950'}`}>



                <div className="relative z-10 container mx-auto px-6 text-center">
                    <div className="mb-16 space-y-6">
                        <h2 className={`text-xs md:text-sm font-black tracking-[0.4em] uppercase transition-colors duration-700 ${isSafetyOn ? 'text-red-400' : 'text-slate-600'}`}>
                            Safety Health Environment
                        </h2>
                        <h1 className={`text-6xl md:text-9xl font-black tracking-tighter mb-4 transition-all duration-1000 ${isSafetyOn ? 'text-white scale-100 blur-0' : 'text-slate-800 scale-95 blur-[2px]'}`}>
                            Safety <span className={isSafetyOn ? "text-red-600" : "text-slate-700"}>ON</span>
                        </h1>
                        <p className={`text-xl md:text-3xl font-light tracking-tight transition-all duration-1000 delay-300 ${isSafetyOn ? 'text-white opacity-100 translate-y-0' : 'text-slate-700 opacity-0 translate-y-4'}`}>
                            남화의 미래를 켜다
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <button
                            onClick={toggleSafety}
                            className={`group relative w-20 h-36 md:w-24 md:h-44 rounded-full border-[1px] transition-all duration-500 cursor-pointer ${isSafetyOn ? 'bg-black/50 border-red-600 shadow-2xl shadow-red-900/50 backdrop-blur-sm' : 'bg-slate-900 border-slate-800'}`}
                        >
                            <div className={`absolute left-1/2 -translate-x-1/2 w-14 h-14 md:w-18 md:h-18 rounded-full shadow-lg flex items-center justify-center transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${isSafetyOn ? 'top-3 bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.8)]' : 'bottom-3 bg-slate-800 text-slate-600'}`}>
                                <Zap size={28} className={isSafetyOn ? 'fill-white' : ''} />
                            </div>
                        </button>
                        <p className={`text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-500 ${isSafetyOn ? 'text-white animate-pulse' : 'text-slate-700'}`}>
                            {isSafetyOn ? "System Active" : "Initialize System"}
                        </p>
                    </div>
                </div>

                {isSafetyOn && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce text-white/50">
                        <ArrowRight className="rotate-90" size={20} />
                    </div>
                )}
            </section>

            {/* Content Container */}
            <div className={`transition-all duration-1000 ${isSafetyOn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none h-0 overflow-hidden'}`}>

                {/* Systems Section */}
                <section id="systems" className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="mb-20">
                            <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-4">Systems <span className="text-red-600">.</span></h3>
                            <p className="text-slate-400 font-medium tracking-wide uppercase text-sm">시스템 및 경영 매뉴얼</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="group relative bg-slate-50 rounded-3xl p-10 border border-slate-100 hover:border-red-100 hover:bg-white hover:shadow-2xl transition-all duration-500">
                                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                                    <Shield size={32} />
                                </div>
                                <h4 className="text-2xl font-black tracking-tight text-slate-900 mb-4 leading-tight">안전보건<br />경영시스템</h4>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">ISO 45001 기준에 맞춘 통합 안전보건 관리 매뉴얼을 확인하십시오.</p>
                                <button className="inline-flex items-center gap-2 text-red-600 font-bold text-sm tracking-tight hover:gap-4 transition-all">
                                    VIEW DOCUMENT <ArrowRight size={16} />
                                </button>
                            </div>

                            {[
                                { title: "안전보건 매뉴얼", desc: "현장 안전 관리를 위한 상세 표준 지침서" },
                                { title: "R&R 정의서", desc: "조직 내 구성원별 역할과 책임 정의" }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-slate-50/50 rounded-3xl p-10 border border-dashed border-slate-200 flex flex-col justify-between opacity-60">
                                    <div>
                                        <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-2xl flex items-center justify-center mb-8">
                                            <Lock size={28} />
                                        </div>
                                        <h4 className="text-2xl font-black tracking-tight text-slate-400 mb-4 leading-tight">{item.title}</h4>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed">{item.desc}</p>
                                    </div>
                                    <span className="mt-8 text-[10px] font-black tracking-widest text-slate-300 uppercase">Updating Soon</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Sites Section [NEW] */}
                <section id="sites" className="py-24 bg-slate-50 border-y border-slate-200">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="mb-20 text-center md:text-left">
                            <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-4">Active Projects <span className="text-red-600">.</span></h3>
                            <p className="text-slate-400 font-medium tracking-wide uppercase text-sm">진행 중인 현장 스마트 대시보드</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sites.map((site) => (
                                <Link to={site.link} key={site.id} className="group relative p-8 rounded-3xl bg-white border border-slate-100 hover:border-red-500 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                                    <div className="absolute top-8 right-8">
                                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                            {site.status}
                                        </span>
                                    </div>
                                    <div className="w-14 h-14 bg-slate-50 text-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors duration-500">
                                        <LayoutDashboard size={24} />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-red-600 transition-colors">{site.title}</h4>
                                    <p className="text-sm text-slate-400 font-medium">실시간 안전 현황 모니터링</p>

                                    <div className="mt-8 flex items-center text-slate-300 text-sm font-bold group-hover:text-red-600 transition-colors">
                                        ENTER DASHBOARD <ArrowRight size={16} className="ml-2" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Checklists Section */}
                <section id="sops" className="py-32 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="mb-20 text-center md:text-left">
                            <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-4">Checklists <span className="text-red-600">.</span></h3>
                            <p className="text-slate-400 font-medium tracking-wide uppercase text-sm">현장별 맞춤 점검표 및 절차서</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { title: "안전보건 경영시스템 점검", sub: "SHM System Check", icon: <ClipboardCheck /> },
                                { title: "신규 착공 현장 체크리스트", sub: "New Site Initial Check", icon: <CheckSquare /> },
                                { title: "건축공사 일일 안전점검", sub: "Daily Building Check", icon: <ClipboardCheck /> },
                                { title: "토목공사 일일 안전점검", sub: "Daily Civil Eng. Check", icon: <ClipboardCheck /> },
                                { title: "위험성 평가표 (AHA)", sub: "Risk Assessment Form", icon: <AlertTriangle /> },
                                { title: "작업허가서 (PTW)", sub: "Permit To Work System", icon: <FileText /> },
                            ].map((item, index) => (
                                <button
                                    key={index}
                                    className="group relative p-8 rounded-3xl bg-slate-50 border border-slate-100 text-left hover:bg-white hover:border-red-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="p-4 rounded-2xl bg-white text-slate-400 group-hover:bg-red-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                            {React.cloneElement(item.icon, { size: 24 })}
                                        </div>
                                        <ArrowRight className="text-slate-200 group-hover:text-red-500 group-hover:translate-x-1 transition-all" size={20} />
                                    </div>
                                    <h4 className="font-black text-lg text-slate-900 tracking-tight leading-tight mb-2">{item.title}</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.sub}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-slate-950 text-white py-24">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 mb-16 pb-16 border-b border-slate-900">
                            <NamhwaLogo type="vertical" className="brightness-0 invert" />
                            <div className="grid grid-cols-2 md:flex gap-12 text-[11px] font-black tracking-widest uppercase text-slate-500">
                                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                                <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
                                <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
                                <a href="#" className="hover:text-white transition-colors">Contact Support</a>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <p className="text-[10px] font-medium text-slate-600 tracking-wider uppercase">
                                &copy; 2024 Namhwa Construction Co., Ltd. Safety & Health Team.
                            </p>
                            <p className="text-[10px] font-black text-red-900 tracking-widest uppercase">
                                Safety ON: Lighting up the Future
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default ResourceCenter;
