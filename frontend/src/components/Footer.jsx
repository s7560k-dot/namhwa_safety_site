import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer Component Props
 * 
 * @typedef {Object} FooterProps
 * @property {boolean} isAdmin - 관리자인지 여부
 * @property {() => void} onOpenCookieSettings - 쿠키 설정 모달오픈 함수
 */

const Footer = ({ isAdmin, onOpenCookieSettings }) => {
    return (
        <footer className="w-full bg-[#0B1120] py-16 px-6 md:px-12">
            <div className="max-w-7xl mx-auto">

                {/* 상단: 로고 및 내비게이션 메뉴 */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 lg:gap-8 mb-16">

                    {/* 좌측 로고 영역 */}
                    <div className="flex items-center gap-4 shrink-0">
                        <img src="/namhwa-symbol1.png" alt="남화토건 심볼" className="h-10 md:h-12 object-contain" />
                        <img src="/namhwa-text1.png" alt="남화토건 텍스트" className="h-10 md:h-14 object-contain brightness-0 invert" />
                    </div>

                    {/* 우측 메뉴 영역 */}
                    <ul className="flex flex-wrap md:flex-nowrap items-center lg:justify-end gap-x-8 lg:gap-x-16 gap-y-8 uppercase tracking-[0.15em] text-[#64748B] text-[10px] md:text-xs font-semibold w-full lg:w-auto">

                        <li>
                            <Link to="/privacy" className="inline-block text-left leading-relaxed hover:text-white transition-colors duration-300">
                                PRIVACY<br />POLICY
                            </Link>
                        </li>

                        <li>
                            <Link to="/terms" className="inline-block text-left leading-relaxed hover:text-white transition-colors duration-300">
                                TERMS OF<br />USE
                            </Link>
                        </li>

                        <li>
                            <button onClick={onOpenCookieSettings} className="inline-block text-left leading-relaxed hover:text-white transition-colors duration-300 uppercase tracking-[0.15em] font-semibold text-[10px] md:text-xs">
                                COOKIE<br />SETTINGS
                            </button>
                        </li>

                        <li>
                            <Link to="/support" className="inline-block text-left leading-relaxed hover:text-white transition-colors duration-300">
                                CONTACT<br />SUPPORT
                            </Link>
                        </li>

                        {isAdmin && (
                            <li>
                                <Link to="/admin" className="inline-block text-left leading-relaxed hover:text-white transition-colors duration-300">
                                    ADMIN<br />DASHBOARD
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>

                {/* 하단: 구분선 및 Copyright */}
                <div className="border-t border-slate-800/80 pt-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <p className="text-[9px] md:text-[10px] font-medium text-[#64748B] tracking-widest uppercase">
                        &copy; 2026 Namhwa Construction Co., Ltd. Safety &amp; Health Team.
                    </p>
                    <p className="text-[9px] md:text-[10px] font-black text-[#7F0000] tracking-widest uppercase">
                        Safety ON: Lighting up the Future
                    </p>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
