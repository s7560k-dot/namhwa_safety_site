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
    const [isSafetyOn, setIsSafetyOn] = useState(() => {
        return sessionStorage.getItem('safetyOn') === 'true';
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [bgError, setBgError] = useState(false);

    // Background Image URL (Local Asset per user request)
    const BG_IMAGE_URL = "/night_view.jpg";

    const toggleSafety = () => {
        const newValue = !isSafetyOn;
        setIsSafetyOn(newValue);
        sessionStorage.setItem('safetyOn', newValue);
    };

    useEffect(() => {
        // 복귀 시(새로고침/뒤로가기)에만 스크롤 위치 복구
        const isInitiallyOn = sessionStorage.getItem('safetyOn') === 'true';
        if (isInitiallyOn) {
            const savedScroll = sessionStorage.getItem('dashboardScroll');
            if (savedScroll) {
                setTimeout(() => window.scrollTo(0, parseInt(savedScroll, 10)), 50);
            }
        }

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLinkClick = () => {
        // 다른 페이지 이동 직전 스크롤 위치 저장
        sessionStorage.setItem('dashboardScroll', window.scrollY.toString());
    };

    const sites = [
        { id: 'siteA', title: "대광 새마을금고 골프연습장", link: "/dashboard/siteA", status: "진행중" },
        { id: 'siteB', title: "수원 노유자시설 신축공사", link: "/dashboard/siteB", status: "진행중" },
        { id: 'siteC', title: "평택 세탁소 시설 신축공사", link: "/dashboard/siteC", status: "진행중" }
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-red-100 antialiased">
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
                <div className="absolute inset-0 bg-black/70"></div>
            </div>

            {/* Navigation */}
            <nav className={`fixed w-full z-50 transition-all duration-500 ease-out ${isScrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm py-3' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {/* 1. 로고 심볼 (벽돌색 유지) */}
                        <img
                            src="/namhwa_symbol.png"
                            alt="Namhwa Symbol"
                            className="h-10 md:h-12 object-contain"
                        />
                        {/* 2. 로고 텍스트 (야간 배경에서만 흰색으로 반전) */}
                        <img
                            src="/namhwa_text.png"
                            alt="Namhwa Text"
                            className={`h-8 md:h-10 object-contain transition-all duration-300 ${!isScrolled ? 'brightness-0 invert' : ''}`}
                        />
                        <div className={`h-6 w-px hidden md:block ml-2 ${isScrolled ? 'bg-slate-200' : 'bg-white/20'}`}></div>
                        <span className={`text-xs font-semibold tracking-widest uppercase hidden md:block pt-0.5 ${isScrolled ? 'text-slate-400' : 'text-white/60'}`}>
                            Safety Hub
                        </span>
                    </div>

                    <div className={`hidden md:flex gap-10 text-[13px] font-bold uppercase tracking-wider ${isScrolled ? 'text-slate-600' : 'text-white'}`}>
                        <a href="#systems" className="hover:text-red-500 transition-colors">Systems</a>
                        <a href="#sites" className="hover:text-red-500 transition-colors">Sites</a>
                        <a href="#sops" className="hover:text-red-500 transition-colors">Checklists</a>
                        <a href="#tools" className="hover:text-red-500 transition-colors">Tools</a>
                        <a href="#board" className="hover:text-red-500 transition-colors">Board</a>
                    </div>

                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`md:hidden ${isScrolled ? 'text-slate-800' : 'text-white'}`}>
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="absolute top-full left-0 w-full bg-white shadow-2xl py-6 px-8 flex flex-col gap-6 md:hidden border-t border-slate-50">
                        <a href="#systems" onClick={() => setMobileMenuOpen(false)} className="text-slate-900 font-bold text-lg">Systems</a>
                        <a href="#sites" onClick={() => setMobileMenuOpen(false)} className="text-slate-900 font-bold text-lg">Sites</a>
                        <a href="#sops" onClick={() => setMobileMenuOpen(false)} className="text-slate-900 font-bold text-lg">Checklists</a>
                        <a href="#tools" onClick={() => setMobileMenuOpen(false)} className="text-slate-900 font-bold text-lg">Tools</a>
                        <a href="#board" onClick={() => setMobileMenuOpen(false)} className="text-slate-900 font-bold text-lg">Board</a>
                    </div>
                )}
            </nav>

            {/* Hero Section: Night View Background Logic */}
            <section className={`relative min-h-screen flex items-center justify-center overflow-hidden transition-all duration-1000 ${isSafetyOn ? 'bg-transparent' : 'bg-slate-950'}`}>



                <div className="relative z-10 container mx-auto px-6 text-center">
                    <div className="mb-6 space-y-6">
                        <h2 className={`text-xs md:text-sm font-black tracking-[0.4em] uppercase transition-all duration-1000 ease-in-out ${isSafetyOn ? 'text-red-400 opacity-100 translate-y-0' : 'text-red-400 opacity-0 -translate-y-8'}`}>
                            Safety Health Environment
                        </h2>
                        <h1 className="text-6xl md:text-9xl font-black mb-20 flex justify-center tracking-tighter overflow-visible">
                            <span className={`inline-block transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSafetyOn ? 'text-white translate-x-0 translate-y-0 opacity-100 blur-0 rotate-0 scale-100' : 'text-transparent -translate-x-[20vw] -translate-y-[20vh] opacity-0 blur-xl -rotate-45 scale-150'}`}>S</span>
                            <span className={`inline-block transition-all duration-1000 delay-75 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSafetyOn ? 'text-white translate-x-0 translate-y-0 opacity-100 blur-0 rotate-0 scale-100' : 'text-transparent -translate-x-[10vw] translate-y-[30vh] opacity-0 blur-xl rotate-12 scale-50'}`}>a</span>
                            <span className={`inline-block transition-all duration-1000 delay-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSafetyOn ? 'text-white translate-x-0 translate-y-0 opacity-100 blur-0 rotate-0 scale-100' : 'text-transparent translate-x-[5vw] -translate-y-[25vh] opacity-0 blur-xl -rotate-12 scale-150'}`}>f</span>
                            <span className={`inline-block transition-all duration-1000 delay-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSafetyOn ? 'text-white translate-x-0 translate-y-0 opacity-100 blur-0 rotate-0 scale-100' : 'text-transparent translate-x-[20vw] translate-y-[15vh] opacity-0 blur-xl rotate-45 scale-75'}`}>e</span>
                            <span className={`inline-block transition-all duration-1000 delay-100 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSafetyOn ? 'text-white translate-x-0 translate-y-0 opacity-100 blur-0 rotate-0 scale-100' : 'text-transparent -translate-x-[15vw] translate-y-[10vh] opacity-0 blur-xl rotate-90 scale-125'}`}>t</span>
                            <span className={`inline-block transition-all duration-1000 delay-[250ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSafetyOn ? 'text-white translate-x-0 translate-y-0 opacity-100 blur-0 rotate-0 scale-100' : 'text-transparent translate-x-[30vw] -translate-y-[10vh] opacity-0 blur-xl -rotate-90 scale-50'}`}>y</span>
                            <span className="w-4 md:w-8"></span> {/* 공백 */}
                            <span className={`inline-block transition-all duration-1000 delay-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSafetyOn ? 'text-red-600 translate-x-0 translate-y-0 opacity-100 blur-0 rotate-0 scale-100' : 'text-transparent translate-x-[10vw] translate-y-[40vh] opacity-0 blur-xl rotate-180 scale-150'}`}>O</span>
                            <span className={`inline-block transition-all duration-1000 delay-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSafetyOn ? 'text-red-600 translate-x-0 translate-y-0 opacity-100 blur-0 rotate-0 scale-100' : 'text-transparent translate-x-[30vw] translate-y-[20vh] opacity-0 blur-xl rotate-45 scale-125'}`}>N</span>
                        </h1>
                        <p className={`text-xl md:text-3xl font-light transition-all duration-1000 delay-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSafetyOn ? 'text-white opacity-100 translate-y-0 scale-100 tracking-tight blur-0' : 'text-white opacity-0 translate-y-12 scale-90 tracking-widest blur-sm'}`}>
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
                        <p className={`text-sm font-bold tracking-widest transition-all duration-500 ${isSafetyOn ? 'text-red-400 animate-pulse' : 'text-slate-500'}`}>
                            {isSafetyOn ? "안전 시스템 가동 중" : "당신의 안전스위치를 켜주세요"}
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
                <section id="systems" className="py-24 bg-cyan-50/85 backdrop-blur-xl border-t border-white/20 shadow-[inset_0_0_100px_rgba(255,255,255,0.4)]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="mb-20">
                            <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-4">Systems <span className="text-cyan-600">.</span></h3>
                            <p className="text-cyan-700 font-medium tracking-wide uppercase text-sm">시스템 및 경영 매뉴얼</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="group relative bg-slate-50 rounded-3xl p-10 border border-slate-100 hover:border-red-100 hover:bg-white hover:shadow-2xl transition-all duration-500">
                                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                                    <Shield size={32} />
                                </div>
                                <h4 className="text-2xl font-black tracking-tight text-slate-900 mb-4 leading-tight">안전보건<br />경영시스템</h4>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">ISO 45001 기준에 맞춘 통합 안전보건 관리 매뉴얼을 확인하십시오.</p>
                                <a href="/System/index.html" onClick={handleLinkClick} className="inline-flex items-center gap-2 text-red-600 font-bold text-sm tracking-tight hover:gap-4 transition-all">
                                    VIEW DOCUMENT <ArrowRight size={16} />
                                </a>
                            </div>

                            {[
                                { title: "안전보건 매뉴얼", desc: "현장 안전 관리를 위한 상세 표준 지침서", link: "/safety_manual.pdf", target: "_blank" },
                                { title: "R&R 정의서", desc: "조직 내 구성원별 역할과 책임 정의", link: "#", target: "_self" }
                            ].map((item, idx) => (
                                <a href={item.link} target={item.target} onClick={handleLinkClick} key={idx} className={`bg-slate-50/50 rounded-3xl p-10 border border-dashed border-slate-200 flex flex-col justify-between ${item.link === '#' ? 'opacity-60 cursor-not-allowed' : 'hover:border-red-300 hover:bg-white transition-all hover:shadow-xl'}`}>
                                    <div>
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${item.link === '#' ? 'bg-slate-100 text-slate-300' : 'bg-red-50 text-red-500'}`}>
                                            <Lock size={28} />
                                        </div>
                                        <h4 className={`text-2xl font-black tracking-tight mb-4 leading-tight ${item.link === '#' ? 'text-slate-400' : 'text-slate-800'}`}>{item.title}</h4>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed">{item.desc}</p>
                                    </div>
                                    <span className={`mt-8 text-[10px] font-black tracking-widest uppercase ${item.link === '#' ? 'text-slate-300' : 'text-red-500'}`}>
                                        {item.link === '#' ? 'Updating Soon' : 'View PDF'}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Sites Section [NEW] */}
                <section id="sites" className="py-24 bg-purple-50/85 backdrop-blur-xl border-y border-white/20 shadow-[inset_0_0_100px_rgba(255,255,255,0.4)]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="mb-20 text-center md:text-left">
                            <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-4">Active Projects <span className="text-purple-600">.</span></h3>
                            <p className="text-purple-700 font-medium tracking-wide uppercase text-sm">진행 중인 현장 스마트 대시보드</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="group relative p-8 rounded-3xl bg-slate-100/50 border border-dashed border-slate-200 opacity-70 flex flex-col justify-center items-center text-center">
                                <div className="w-14 h-14 bg-slate-200 text-slate-400 rounded-2xl flex items-center justify-center mb-6">
                                    <LayoutDashboard size={24} />
                                </div>
                                <h4 className="text-xl font-bold text-slate-600 mb-2">현장 목록 전체보기</h4>
                                <span className="mt-4 px-3 py-1 bg-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                    준비중 (Coming Soon)
                                </span>
                            </div>
                            {sites.map((site) => (
                                <Link to={site.link} onClick={handleLinkClick} key={site.id} className="group relative p-8 rounded-3xl bg-white border border-slate-100 hover:border-red-500 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
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
                <section id="sops" className="py-28 bg-amber-50/85 backdrop-blur-xl border-b border-white/20 shadow-[inset_0_0_100px_rgba(255,255,255,0.4)]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="mb-20 text-center md:text-left">
                            <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-4">Checklists <span className="text-amber-600">.</span></h3>
                            <p className="text-amber-700 font-medium tracking-wide uppercase text-sm">현장별 맞춤 점검표 및 절차서</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { title: "SHM SYSTEM", sub: "Web System", icon: <Shield />, link: "/shm_system/index.html" },
                                { title: "PRE CHECK", sub: "Checklist", icon: <CheckSquare />, link: "/pre_check/index.html" },
                                { title: "DAILY ARCH", sub: "Architecture", icon: <ClipboardCheck />, link: "/daily_arch/index.html" },
                                { title: "DAILY CE", sub: "Civil Eng.", icon: <ClipboardCheck />, link: "/daily_ce/index.html" },
                                { title: "SH CHECK", sub: "Inspection", icon: <AlertTriangle />, link: "/sh_check/index.html" },
                                { title: "AHA", sub: "Risk Assessment", icon: <FileText />, link: "/AHA/index.html" },
                                { title: "PTW", sub: "Permit to Work", icon: <Lock />, link: "/PTW/index.html" },
                                { title: "WSHCC", sub: "Council", icon: <BookOpen />, link: "/WSHCC/index.html" },
                            ].map((item, index) => (
                                <a
                                    href={item.link}
                                    onClick={handleLinkClick}
                                    key={index}
                                    className="block group relative p-8 rounded-3xl bg-slate-50 border border-slate-100 text-left hover:bg-white hover:border-red-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="p-4 rounded-2xl bg-white text-slate-400 group-hover:bg-red-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                            {React.cloneElement(item.icon, { size: 24 })}
                                        </div>
                                        <ArrowRight className="text-slate-200 group-hover:text-red-500 group-hover:translate-x-1 transition-all" size={20} />
                                    </div>
                                    <h4 className="font-black text-lg text-slate-900 tracking-tight leading-tight mb-2">{item.title}</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.sub}</p>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Calculators Section [NEW from color-block request] */}
                <section id="tools" className="py-24 bg-emerald-50/85 backdrop-blur-xl border-t border-white/20 shadow-[inset_0_0_100px_rgba(255,255,255,0.4)]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="mb-20 text-center md:text-left">
                            <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-4">Calculators <span className="text-emerald-600">.</span></h3>
                            <p className="text-emerald-700 font-medium tracking-wide uppercase text-sm">현장 전용 안전율 및 규격 계산기 (Web Tools)</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { title: "중량물취급 안전율 계산기", sub: "Safety Factor Calc", icon: <Calculator />, link: "/work/index.html" },
                                { title: "아웃트리거 받침철판 규격 계산기", sub: "Outrigger Plate Calc", icon: <Calculator />, link: "/OUT/index.html" }
                            ].map((item, index) => (
                                <a
                                    href={item.link}
                                    onClick={handleLinkClick}
                                    key={index}
                                    className="block group relative p-10 rounded-3xl bg-white border border-slate-100 text-left hover:border-red-500 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-10 group-hover:bg-red-50 transition-colors duration-500"></div>
                                    <div className="w-16 h-16 bg-slate-50 text-slate-800 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-red-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                                        {React.cloneElement(item.icon, { size: 32 })}
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-red-600 transition-colors">{item.title}</h4>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{item.sub}</p>

                                    <div className="mt-8 flex items-center text-slate-300 text-sm font-bold group-hover:text-red-600 transition-colors">
                                        LAUNCH TOOL <ArrowRight size={16} className="ml-2" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Board Section [NEW] */}
                <section id="board" className="py-24 bg-blue-50/85 backdrop-blur-xl border-y border-white/20 shadow-[inset_0_0_100px_rgba(255,255,255,0.4)]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="mb-20 text-center md:text-left">
                            <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-4">Board <span className="text-blue-600">.</span></h3>
                            <p className="text-blue-700 font-medium tracking-wide uppercase text-sm">현장 및 본사 공지사항 / 게시판</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { title: "전사 공지사항", sub: "Notice", icon: <FileText />, link: "#", isReady: false },
                                { title: "현장 건의함", sub: "Suggestion", icon: <BookOpen />, link: "#", isReady: false },
                                { title: "안전보건 자료실", sub: "Data Room", icon: <CheckSquare />, link: "#", isReady: false }
                            ].map((item, index) => (
                                <a
                                    href={item.link}
                                    onClick={(e) => { if (!item.isReady) e.preventDefault(); else handleLinkClick(); }}
                                    key={index}
                                    className={`block group relative p-10 rounded-3xl bg-white border border-slate-100 text-left transition-all duration-500 overflow-hidden ${item.isReady ? 'hover:border-red-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-10 group-hover:bg-blue-50 transition-colors duration-500"></div>
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm transition-colors duration-500 ${item.isReady ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        {React.cloneElement(item.icon, { size: 32 })}
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-900 mb-2">{item.title}</h4>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{item.sub}</p>

                                    <div className={`mt-8 flex items-center text-sm font-bold ${item.isReady ? 'text-blue-500 group-hover:text-blue-700 transition-colors' : 'text-slate-300'}`}>
                                        {item.isReady ? (
                                            <>ENTER <ArrowRight size={16} className="ml-2" /></>
                                        ) : (
                                            <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] tracking-wider">준비중</span>
                                        )}
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-slate-950 text-white py-24">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 mb-16 pb-16 border-b border-slate-900">
                            <div className="flex items-center gap-4">
                                <img src="/namhwa-symbol1.png" alt="남화토건 심볼" className="h-12 md:h-16 object-contain" />
                                <img src="/namhwa-text1.png" alt="남화토건 텍스트" className="h-14 md:h-20 object-contain brightness-0 invert" />
                            </div>
                            <div className="grid grid-cols-2 md:flex gap-12 text-[11px] font-black tracking-widest uppercase text-slate-500">
                                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                                <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
                                <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
                                <a href="#" className="hover:text-white transition-colors">Contact Support</a>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <p className="text-[10px] font-medium text-slate-600 tracking-wider uppercase">
                                &copy; 2026 Namhwa Construction Co., Ltd. Safety & Health Team.
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
