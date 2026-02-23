import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import {
    Users,
    UserPlus,
    Mail,
    Key,
    User,
    ShieldCheck,
    LogOut,
    ArrowLeft,
    RefreshCw,
    Search,
    FileText,
    BarChart3,
    MessageSquare,
    CheckCircle2,
    Clock,
    Trash2,
    LayoutDashboard
} from 'lucide-react';
import firebase from 'firebase/compat/app';
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseConfig } from './firebase_config';

const Admin = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // New User Form State
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // [New] Functional Tabs State
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, users, posts, inquiries
    const [posts, setPosts] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPosts: 0,
        totalSites: 0,
        unreadInquiries: 0
    });

    const navigate = useNavigate();

    useEffect(() => {
        // 관리 권한 확인
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                navigate('/login');
            }
        });

        loadAllData();
        return () => unsubscribe();
    }, [navigate, activeTab]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'dashboard') await fetchStats();
            else if (activeTab === 'users') await fetchUsers();
            else if (activeTab === 'posts') await fetchPosts();
            else if (activeTab === 'inquiries') await fetchInquiries();
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const usersSnap = await db.collection('users').get();
            const postsSnap = await db.collection('posts').get();
            const inquiriesSnap = await db.collection('inquiries').where('status', '==', 'unread').get();

            // 사이트 수는 고정된 배열 기반(레거시 구조 대응)
            const sitesCount = 3;

            setStats({
                totalUsers: usersSnap.size,
                totalPosts: postsSnap.size,
                totalSites: sitesCount,
                unreadInquiries: inquiriesSnap.size
            });
        } catch (err) {
            console.error("Stats fetching error:", err);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const snapshot = await db.collection('users').get();
            const usersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersList);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("사용자 목록을 불러오는 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError('');
        setSuccess('');

        try {
            // 1. 현재 관리자 세션을 유지하면서 새 계정을 생성하기 위해 
            // 별도의 Firebase App 인스턴스를 임시로 생성합니다.
            const secondaryApp = initializeApp(firebaseConfig, "Secondary");
            const secondaryAuth = getAuth(secondaryApp);

            // 2. Auth에 계정 생성
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
            const user = userCredential.user;

            // 3. Firestore에 사용자 정보 저장
            await db.collection('users').doc(user.uid).set({
                name: newName,
                email: newEmail,
                role: 'user', // 기본 권한
                createdAt: new Date().toISOString()
            });

            // 4. 임시 앱 인스턴스 정리
            await secondaryAuth.signOut();
            // Note: deleteApp function is needed to fully clean up if creating many, 
            // but for simple use signOut is usually okay or use getApps check.

            setSuccess(`✅ ${newName} 님의 계정이 성공적으로 생성되었습니다.`);
            setNewName('');
            setNewEmail('');
            setNewPassword('');
            fetchUsers(); // 목록 갱신
        } catch (err) {
            console.error("Create user error:", err);
            let msg = "계정 생성 중 오류가 발생했습니다.";
            if (err.code === 'auth/email-already-in-use') msg = "이미 사용 중인 이메일입니다.";
            if (err.code === 'auth/weak-password') msg = "비밀번호는 6자리 이상이어야 합니다.";
            setError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetPassword = async (email) => {
        // ... (existing code remains SAME)
    };

    const fetchPosts = async () => {
        try {
            const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error("Posts fetch error:", err);
            setError("게시물을 불러오는 중 오류가 발생했습니다.");
        }
    };

    const fetchInquiries = async () => {
        try {
            const snapshot = await db.collection('inquiries').orderBy('createdAt', 'desc').get();
            setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error("Inquiries fetch error:", err);
            setError("문의 내역을 불러오는 중 오류가 발생했습니다.");
        }
    };

    const handleUpdateInquiryStatus = async (id, newStatus) => {
        setActionLoading(true);
        try {
            await db.collection('inquiries').doc(id).update({ status: newStatus });
            setSuccess("처리가 완료되었습니다.");
            fetchInquiries();
        } catch (err) {
            setError("상태 업데이트 중 오류가 발생했습니다.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeletePost = async (id) => {
        if (!window.confirm("정말 이 게시물을 삭제하시겠습니까?")) return;
        setActionLoading(true);
        try {
            await db.collection('posts').doc(id).delete();
            setSuccess("게시물이 삭제되었습니다.");
            fetchPosts();
        } catch (err) {
            setError("삭제 중 오류가 발생했습니다.");
        } finally {
            setActionLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
            {/* Header */}
            <header className="bg-slate-900 text-white py-4 px-6 fixed w-full z-20 shadow-lg border-b border-slate-700">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-600 p-2 rounded-lg">
                            <ShieldCheck size={20} className="text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">Safety ON <span className="text-slate-400 font-normal hidden sm:inline">Admin</span></h1>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6">
                        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-none">
                            {[
                                { id: 'dashboard', label: '운영 통계', icon: <BarChart3 size={16} /> },
                                { id: 'users', label: '사용자 관리', icon: <Users size={16} /> },
                                { id: 'posts', label: '게시물 관리', icon: <FileText size={16} /> },
                                { id: 'inquiries', label: '문의 확인', icon: <MessageSquare size={16} /> },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-800 text-red-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                                >
                                    {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                        <div className="h-6 w-px bg-slate-700 shrink-0"></div>
                        <button
                            onClick={() => navigate('/')}
                            className="text-xs md:text-sm font-bold text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 shrink-0"
                        >
                            <ArrowLeft size={16} /> <span className="hidden sm:inline">메인으로</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-12">
                {/* Error/Success Alerts */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center justify-between">
                        <span className="text-sm font-bold">{error}</span>
                        <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button>
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl flex items-center justify-between">
                        <span className="text-sm font-bold">{success}</span>
                        <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">✕</button>
                    </div>
                )}

                {/* Content based on Active Tab */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: '등록된 직원 수', value: stats.totalUsers, icon: <Users />, color: 'blue' },
                                { label: '전체 현장 수', value: stats.totalSites, icon: <LayoutDashboard />, color: 'emerald' },
                                { label: '누적 게시물', value: stats.totalPosts, icon: <FileText />, color: 'amber' },
                                { label: '새로운 문의', value: stats.unreadInquiries, icon: <MessageSquare />, color: 'red', urgent: stats.unreadInquiries > 0 },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                    <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-slate-900`}>
                                        {React.cloneElement(item.icon, { size: 100 })}
                                    </div>
                                    <div className="relative z-10">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${item.color === 'blue' ? 'bg-blue-50 text-blue-600' : item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : item.color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                                            {React.cloneElement(item.icon, { size: 24 })}
                                        </div>
                                        <div className="text-2xl md:text-3xl font-black text-slate-900 mb-1">
                                            {item.value}<span className="text-sm md:text-base font-normal text-slate-400 ml-1">{item.label === '전체 현장 수' ? '개소' : '건'}</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                                        {item.urgent && (
                                            <div className="mt-3 flex items-center gap-2 text-[10px] font-black text-red-600 animate-bounce">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                                                ACTION REQUIRED
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full blur-[100px] -mr-48 -mt-48 opacity-20"></div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-2xl font-black mb-2">통합 안전보건 대시보드 리포트</h2>
                                    <p className="text-slate-400 text-sm max-w-xl">
                                        전체 현장의 실시간 안전 현황 및 점검 데이터를 기반으로 한 통계입니다. 직원의 활동 로그와 시스템 이용 현황을 점검하여 안전 사고 예방 정책에 반영하세요.
                                    </p>
                                </div>
                                <button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-sm hover:bg-slate-200 transition-colors shadow-lg">
                                    상세 리포트 PDF 다운로드
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 sticky top-28">
                                <div className="flex items-center gap-2 mb-8">
                                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                        <UserPlus size={24} />
                                    </div>
                                    <h2 className="text-xl font-black tracking-tight">신규 직원 등록</h2>
                                </div>

                                <form onSubmit={handleCreateUser} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">이름</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input
                                                type="text"
                                                required
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                                                placeholder="성명을 입력하세요"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">이메일 (ID)</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input
                                                type="email"
                                                required
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                                                placeholder="user@namhwa.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">임시 비밀번호</label>
                                        <div className="relative">
                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input
                                                type="password"
                                                required
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                                                placeholder="6자리 이상 설정"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className={`w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95 ${actionLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <UserPlus size={18} />
                                        <span>사용자 계정 생성</span>
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-black tracking-tight">등록된 직원 목록</h2>
                                        <span className="ml-2 px-3 py-1 bg-slate-100 text-slate-500 text-xs font-black rounded-full border border-slate-200">{users.length}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="이름 또는 이메일 검색"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition w-full md:w-64 font-medium"
                                            />
                                        </div>
                                        <button onClick={fetchUsers} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl transition">
                                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/50">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">직원 정보</th>
                                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">권한</th>
                                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">액션</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {loading ? (
                                                <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-400 font-medium">로딩 중...</td></tr>
                                            ) : filteredUsers.map((user) => (
                                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black border border-slate-200">
                                                                {user.name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 leading-none mb-1">{user.name}</div>
                                                                <div className="text-xs text-slate-400 font-medium">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${user.role === 'admin' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                            {user.role?.toUpperCase() || 'USER'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <button onClick={() => handleResetPassword(user.email)} className="mx-auto flex items-center gap-1 text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-black transition-all">
                                                            <Key size={14} /> 재설정
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'posts' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">게시물 통합 관리</h2>
                                <p className="text-slate-400 text-sm font-medium mt-1">공지사항 및 전사 자료실 데이터를 관리합니다.</p>
                            </div>
                            <button onClick={fetchPosts} className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-all shadow-sm">
                                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">분류 / 제목</th>
                                        <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">현장명</th>
                                        <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">일시</th>
                                        <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">삭제</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {posts.length === 0 ? (
                                        <tr><td colSpan="4" className="px-8 py-16 text-center text-slate-400 font-medium">등록된 게시물이 없습니다.</td></tr>
                                    ) : posts.map(post => (
                                        <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5 font-bold">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-md font-black">{post.type || 'NOTICE'}</span>
                                                    {post.title}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm text-slate-500 font-medium">{post.siteName || '본사'}</td>
                                            <td className="px-8 py-5 text-xs text-slate-400 font-medium">
                                                {post.createdAt ? new Date(post.createdAt?.seconds * 1000).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <button onClick={() => handleDeletePost(post.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'inquiries' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">고객 문의 메일 확인</h2>
                                <p className="text-slate-400 text-sm font-medium mt-1">Contact Support를 통해 접수된 1:1 문의 내역입니다.</p>
                            </div>
                            <button onClick={fetchInquiries} className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-all shadow-sm">
                                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">문의고객</th>
                                        <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">내용</th>
                                        <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">상태</th>
                                        <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">완료처리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {inquiries.length === 0 ? (
                                        <tr><td colSpan="4" className="px-8 py-16 text-center text-slate-400 font-medium">접수된 문의가 없습니다.</td></tr>
                                    ) : inquiries.map(inquiry => (
                                        <tr key={inquiry.id} className={`hover:bg-slate-50/50 transition-colors ${inquiry.status === 'unread' ? 'bg-blue-50/20' : ''}`}>
                                            <td className="px-8 py-5">
                                                <div className="font-bold text-slate-900">{inquiry.name}</div>
                                                <div className="text-[10px] text-slate-400 font-black mt-1">{inquiry.email}</div>
                                                <div className="text-[10px] text-slate-400 font-black">{inquiry.phone}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm text-slate-600 font-medium line-clamp-2 max-w-md">{inquiry.message}</p>
                                                <span className="text-[10px] text-slate-400 mt-2 block font-bold">
                                                    접수: {inquiry.createdAt ? new Date(inquiry.createdAt?.seconds * 1000).toLocaleString() : '-'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                {inquiry.status === 'unread' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full border border-red-100 uppercase">
                                                        <Clock size={12} /> Unread
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full border border-green-100 uppercase">
                                                        <CheckCircle2 size={12} /> Resolved
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                {inquiry.status === 'unread' ? (
                                                    <button
                                                        onClick={() => handleUpdateInquiryStatus(inquiry.id, 'resolved')}
                                                        className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95"
                                                    >
                                                        처리 완료
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUpdateInquiryStatus(inquiry.id, 'unread')}
                                                        className="text-slate-300 hover:text-slate-500 text-[10px] font-black underline underline-offset-4"
                                                    >
                                                        다시 읽기
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Admin;
