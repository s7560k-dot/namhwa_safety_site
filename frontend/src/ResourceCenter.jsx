import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { auth } from './firebase';

const ResourceCenter = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // [NEW] Hardcoded Menu Data (Fallback for Firestore)
    const systems = [
        { id: 'sys1', title: "안전보건경영시스템 (웹 매뉴얼)", link: "/System/", bg: "bg-[#0891b2]", active: true },
        { id: 'sys2', title: "안전보건 매뉴얼 (PDF)", link: "/safety_manual.pdf", bg: "bg-[#0891b2]", active: true },
        { id: 'sys3', title: "R&R (준비중)", link: "#", bg: "bg-gray-400", active: false }
    ];

    const sops = [
        { id: 'sop1', title: "SHM SYSTEM", link: "/shm_system/", bg: "bg-[#f59e0b]" },
        { id: 'sop2', title: "PRE CHECK", link: "/pre_check/", bg: "bg-[#f59e0b]" },
        { id: 'sop3', title: "DAILY ARCH", link: "/daily_arch/", bg: "bg-[#f59e0b]" },
        { id: 'sop4', title: "DAILY CE", link: "/daily_ce/", bg: "bg-[#f59e0b]" },
        { id: 'sop5', title: "SH CHECK", link: "/sh_check/", bg: "bg-[#f59e0b]" },
        { id: 'sop6', title: "AHA", link: "/AHA/", bg: "bg-[#f59e0b]" },
        { id: 'sop7', title: "PTW", link: "/PTW/", bg: "bg-[#f59e0b]" },
        { id: 'sop8', title: "WSHCC", link: "/WSHCC/", bg: "bg-[#f59e0b]" }
    ];

    const calcs = [
        { id: 'calc1', title: "중량물취급 안전율 계산기", link: "/work/", bg: "bg-[#059669]" },
        { id: 'calc2', title: "아웃트리거 받침철판 규격 계산기", link: "/OUT/", bg: "bg-[#059669]" }
    ];

    const sites = [
        { id: 'siteA', title: "대광 새마을금고 골프연습장", link: "/dashboard/siteA", bg: "bg-purple-600", active: true },
        { id: 'siteB', title: "수원 노유자시설 신축공사", link: "/dashboard/siteB", bg: "bg-purple-600", active: true },
        { id: 'siteC', title: "평택 세탁소 시설 신축공사", link: "/dashboard/siteC", bg: "bg-[#059669]", active: true }
    ];

    useEffect(() => {
        // [FIX] Check guest mode immediately to bypass loading
        const isGuest = sessionStorage.getItem('guestMode') === 'true';
        if (isGuest) {
            setLoading(false);
            return;
        }

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
                sessionStorage.removeItem('guestMode'); // Clear guest flag
                alert("로그아웃 되었습니다.");
                navigate('/login');
            } catch (error) {
                console.error("로그아웃 실패:", error);
            }
        }
    };

    useEffect(() => {
        const isGuest = sessionStorage.getItem('guestMode') === 'true';
        if (!loading && !user && !isGuest) {
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

    // While redirecting, return null or a loader (removed duplicate null check for clarity)
    // if (!user) return null; // This might block render if guest but user is null. Removed.

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
                        {systems.map(item => (
                            item.active ? (
                                <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className={`block p-4 ${item.bg} hover:brightness-110 text-white text-center rounded-lg shadow transition transform hover:-translate-y-1 font-semibold flex items-center justify-center min-h-[80px]`}>
                                    {item.title}
                                </a>
                            ) : (
                                <div key={item.id} className={`block p-4 ${item.bg} text-gray-800 opacity-70 cursor-not-allowed text-center rounded-lg shadow font-semibold flex items-center justify-center min-h-[80px]`}>
                                    {item.title}
                                </div>
                            )
                        ))}
                    </div>
                </section>

                {/* SOP & Checklists */}
                <section>
                    <h2 className="text-2xl font-semibold text-gray-800 mt-10 mb-5 border-b-2 border-amber-500 pb-2">
                        SOP & 점검표 (SOPs & Checklists)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {sops.map(item => (
                            <a key={item.id} href={item.link} className={`block p-4 ${item.bg} hover:brightness-110 text-white text-center rounded-lg shadow transition transform hover:-translate-y-1 font-semibold flex items-center justify-center min-h-[80px]`}>
                                {item.title} (바로가기)
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
                        {calcs.map(item => (
                            <a key={item.id} href={item.link} className={`block p-4 ${item.bg} hover:brightness-110 text-white text-center rounded-lg shadow transition transform hover:-translate-y-1 font-semibold flex items-center justify-center min-h-[80px]`}>
                                {item.title}
                            </a>
                        ))}
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
                        {sites.map(item => (
                            <Link key={item.id} to={item.link} className={`block p-4 ${item.bg} hover:brightness-110 text-white text-center rounded-lg shadow transition transform hover:-translate-y-1 font-semibold flex items-center justify-center min-h-[80px]`}>
                                {item.title}
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ResourceCenter;
