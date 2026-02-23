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
    Search
} from 'lucide-react';
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

    const navigate = useNavigate();

    useEffect(() => {
        // 관리 권한 확인 (간단하게 로그인 여부만 체크 후 필요시 확장)
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                navigate('/login');
            }
        });
        fetchUsers();
        return () => unsubscribe();
    }, [navigate]);

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
        if (!window.confirm(`${email} 주소로 비밀번호 재설정 이메일을 발송하시겠습니까?`)) return;

        setActionLoading(true);
        try {
            await auth.sendPasswordResetEmail(email);
            alert("✅ 비밀번호 재설정 이메일이 발송되었습니다.");
        } catch (err) {
            alert("❌ 발송 실패: " + err.message);
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
            <header className="bg-slate-900 text-white py-4 px-6 fixed w-full z-10 shadow-lg">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-600 p-2 rounded-lg">
                            <ShieldCheck size={20} className="text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">Safety ON <span className="text-slate-400 font-normal">Admin</span></h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="text-sm font-medium hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                            <ArrowLeft size={16} /> 메인으로
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Create User Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
                            <div className="flex items-center gap-2 mb-6">
                                <UserPlus size={20} className="text-blue-600" />
                                <h2 className="text-lg font-bold">신규 직원 등록</h2>
                            </div>

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">이름</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <User size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            placeholder="홍길동"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">이메일 (ID)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <Mail size={16} />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            placeholder="user@namhwa.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">임시 비밀번호</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <Key size={16} />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            placeholder="6자리 이상"
                                        />
                                    </div>
                                </div>

                                {error && <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm">{error}</div>}
                                {success && <div className="p-3 bg-green-50 text-green-700 border border-green-100 rounded-lg text-sm">{success}</div>}

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className={`w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2 ${actionLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    <UserPlus size={18} />
                                    <span>사용자 계정 생성</span>
                                </button>
                            </form>
                            <p className="mt-4 text-[11px] text-slate-400 leading-relaxed text-center">
                                계정 생성 시 현재 세션은 유지됩니다.<br />
                                생성 직후 직원이 입력한 이메일로 접속 가능합니다.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: User List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <Users size={20} className="text-slate-400" />
                                    <h2 className="text-lg font-bold">등록된 직원 목록</h2>
                                    <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">{users.length}</span>
                                </div>

                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="이름 또는 이메일 검색"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition w-full md:w-64"
                                        />
                                    </div>
                                    <button
                                        onClick={fetchUsers}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        title="새로고침"
                                    >
                                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">직원 정보</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">권한</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">등록일시</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">액션</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center text-slate-400">데이터를 불러오는 중...</td>
                                            </tr>
                                        ) : filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center text-slate-400">등록된 직원이 없습니다.</td>
                                            </tr>
                                        ) : filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                                            {user.name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900">{user.name}</div>
                                                            <div className="text-xs text-slate-400">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                        {user.role || 'USER'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500">
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleResetPassword(user.email)}
                                                        className="text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 mx-auto transition"
                                                        title="비밀번호 재설정 이메일 발송"
                                                    >
                                                        <Key size={14} /> 재설정 발송
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
            </main>
        </div>
    );
};

export default Admin;
