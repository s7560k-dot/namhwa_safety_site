import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { auth } from './firebase';

const ResourceCenter = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Compat SDK: auth.onAuthStateChanged
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
        if (window.confirm("로그아웃 하시겠습니까?")) {
            try {
                // Compat SDK: auth.signOut
                await auth.signOut();
                alert("로그아웃 되었습니다.");
            } catch (error) {
                console.error("로그아웃 실패:", error);
            }
        }
    };

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-[#7F0050] rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600 font-medium">로딩 중...</p>
                </div>
            </div>
        );
    }

    // While redirecting, return null or a loader
    if (!user) return null;

    return (
        <div className="bg-gray-100 min-h-screen py-12 px-4 font-sans">
            <div className="flex justify-end max-w-5xl mx-auto mb-4">
                <button onClick={handleLogout} className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded shadow transition duration-200">
                    로그아웃
                </button>
            </div>

            <div className="max-w-5xl mx-auto bg-white p-6 md:p-10 rounded-xl shadow-2xl">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-10">
                    남화토건(주) 안전보건팀 자료실
                </h1>

                {/* Systems & Manuals */}
                <section>
                    <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-5 border-b-2 border-cyan-500 pb-2">
                        시스템 & 매뉴얼 (Systems & Manuals)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <a href="/System/" className="block p-4 bg-[#0891b2] hover:bg-[#0e7490] text-white text-center rounded-lg shadow transition transform hover:-translate-y-1 font-semibold flex items-center justify-center min-h-[80px]">
                            안전보건경영시스템 (웹 매뉴얼)
                        </a>
                        <div className="block p-4 bg-gray-400 text-gray-800 opacity-70 cursor-not-allowed text-center rounded-lg shadow font-semibold flex items-center justify-center min-h-[80px]">
                            안전보건 매뉴얼 (준비중)
                        </div>
                        <div className="block p-4 bg-gray-400 text-gray-800 opacity-70 cursor-not-allowed text-center rounded-lg shadow font-semibold flex items-center justify-center min-h-[80px]">
                            R&R (준비중)
                        </div>
                    </div>
                </section>

                {/* SOP & Checklists */}
                <section>
                    <h2 className="text-2xl font-semibold text-gray-800 mt-10 mb-5 border-b-2 border-amber-500 pb-2">
                        SOP & 점검표 (SOPs & Checklists)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Note: These links assume static files are served from public/ or root */}
                        {['shm_system', 'pre_check', 'daily_arch', 'daily_ce', 'sh_check', 'AHA', 'PTW', 'WSHCC'].map(item => (
                            <a key={item} href={`/${item}/`} className="block p-4 bg-[#f59e0b] hover:bg-[#d97706] text-white text-center rounded-lg shadow transition transform hover:-translate-y-1 font-semibold flex items-center justify-center min-h-[80px]">
                                {item.toUpperCase()} (바로가기)
                            </a>
                        ))}
                    </div>
                </section>

                {/* Calculators */}
                <section>
                    <h2 className="text-2xl font-semibold text-gray-800 mt-10 mb-5 border-b-2 border-emerald-500 pb-2">
                        안전 계산기 (Safety Calculators)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <a href="/work/" className="block p-4 bg-[#059669] hover:bg-[#047857] text-white text-center rounded-lg shadow transition transform hover:-translate-y-1 font-semibold flex items-center justify-center min-h-[80px]">
                            중량물취급 안전율 계산기
                        </a>
                        <a href="/OUT/" className="block p-4 bg-[#059669] hover:bg-[#047857] text-white text-center rounded-lg shadow transition transform hover:-translate-y-1 font-semibold flex items-center justify-center min-h-[80px]">
                            아웃트리거 받침철판 규격 계산기
                        </a>
                    </div>
                </section>

                {/* Sites */}
                <section>
                    <h2 className="text-2xl font-semibold text-gray-800 mt-10 mb-5 border-b-2 border-purple-500 pb-2">
                        현장 (Sites)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="block p-4 bg-purple-600 opacity-70 cursor-not-allowed text-white text-center rounded-lg shadow font-semibold flex items-center justify-center min-h-[80px]">
                            현장 목록 전체보기 (준비중)
                        </div>
                        <Link to="/dashboard/siteA" className="block p-4 bg-purple-600 hover:bg-purple-700 text-white text-center rounded-lg shadow transition transform hover:-translate-y-1 font-semibold flex items-center justify-center min-h-[80px]">
                            대광 새마을금고 골프연습장
                        </Link>
                        <Link to="/dashboard/siteB" className="block p-4 bg-purple-600 hover:bg-purple-700 text-white text-center rounded-lg shadow transition transform hover:-translate-y-1 font-semibold flex items-center justify-center min-h-[80px]">
                            수원 노유자시설 신축공사
                        </Link>
                        <Link to="/dashboard/siteC" className="block p-4 bg-[#059669] hover:bg-[#047857] text-white text-center rounded-lg shadow transition transform hover:-translate-y-1 font-semibold flex items-center justify-center min-h-[80px]">
                            평택 세탁소 시설 신축공사
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ResourceCenter;
