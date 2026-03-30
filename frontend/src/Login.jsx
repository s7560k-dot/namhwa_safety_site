import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from './firebase';
import { useAuth } from './context/AuthContext';

const Login = () => {
    const { setMockUser, isMock } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // /ProtectedRoute에서 보낸 '승인 대기' 상태 확인
    const isPendingApproval = location.state?.pendingApproval;

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // [수정] 로그인되어 있더라도 승인되지 않은 유저는 /login에 머물며 상태를 보여줌
                try {
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        const isHardcodedAdmin = user.email === 's7560k@gmail.com';
                        const isApproved = userData.isApproved === true || String(userData.isApproved) === 'true';
                        const isHardcodedStaff = ['s7560k@gmail.com', 'leejaehoon5712@gmail.com'].includes(user.email);
                        if (isApproved || userData.role === 'admin' || isHardcodedStaff) {
                            navigate('/');
                        } else {
                            // 승인되지 않은 유저는 보안을 위해 즉시 강제 로그아웃
                            await auth.signOut();
                            setError("⚠️ 아직 관리자 승인이 완료되지 않았습니다. 승인 후 이용 가능합니다.");
                        }
                    } else {
                        // 문서가 없는 경우 (신규 가입 유도 등)
                        await auth.signOut();
                        setError("📝 회원가입이 접수되었습니다. 관리자 승인 후 이용 가능합니다.");
                    }
                } catch (err) {
                    console.error("Auto-auth check error:", err);
                    // 에러 시 보안을 위해 /login 유지
                }
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Firestore에서 사용자 정보 및 승인 상태 확인
            const userDoc = await db.collection('users').doc(user.uid).get();
            const isHardcodedAdmin = user.email === 's7560k@gmail.com';

            if (userDoc.exists) {
                const userData = userDoc.data();
                const isApproved = userData.isApproved === true || String(userData.isApproved) === 'true';
                const isHardcodedStaff = ['s7560k@gmail.com', 'leejaehoon5712@gmail.com'].includes(user.email);
                if (userData.role === 'admin' || isHardcodedStaff) {
                    localStorage.setItem('userRole', isHardcodedStaff && user.email !== 's7560k@gmail.com' ? 'user' : 'admin');
                    navigate(user.email === 's7560k@gmail.com' ? '/admin' : '/');
                } else if (!isApproved) {
                    await auth.signOut(); // 미승인 유저는 세션 바로 파기
                    setError("⚠️ 아직 관리자 승인이 완료되지 않았습니다. 승인 후 이용 가능합니다.");
                } else {
                    navigate('/');
                }
            } else {
                // 신규 유저 문서 생성은 AuthContext에서 처리
                if (isHardcodedAdmin) {
                     localStorage.setItem('userRole', 'admin');
                     navigate('/admin');
                } else {
                    await auth.signOut(); // 신규 가입자도 승인 전까지 접근 제한 (바로 파기)
                    setError("📝 회원가입이 접수되었습니다. 관리자 승인 후 이용 가능합니다.");
                }
            }
        } catch (err) {
            console.error("Login error", err);
            let msg = "로그인 중 오류가 발생했습니다.";
            switch (err.code) {
                case 'auth/invalid-email':
                    msg = "유효하지 않은 이메일 형식입니다.";
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    msg = "이메일 또는 비밀번호가 올바르지 않습니다. 아래 '비밀번호 재설정' 버튼을 이용해주세요.";
                    break;
                case 'auth/too-many-requests':
                    msg = "너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
                    break;
                default:
                    msg = `오류 (${err.code}): ${err.message}`;
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // [추가] 비밀번호 재설정 이메일 발송
    const handleResetPassword = async () => {
        if (!email) {
            setError("비밀번호를 재설정할 이메일 주소를 먼저 입력해주세요.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            await auth.sendPasswordResetEmail(email);
            setError(''); 
            alert(`✅ 비밀번호 재설정 이메일을 "${email}"로 발송했습니다.\n받은 편지함을 확인해주세요.`);
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                setError("해당 이메일로 등록된 계정이 없습니다. 관리자에게 문의하세요.");
            } else {
                setError(`재설정 이메일 발송 실패: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full blur-[120px] opacity-10 -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-10 -ml-48 -mb-48"></div>

            <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/20 relative z-10 transition-all">
                <div className="text-center mb-10">
                    <img src="/namhwa_symbol.png" alt="Logo" className="h-16 mx-auto mb-4" />
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">NAMHWA SAFETY</h1>
                    <p className="text-slate-400 mt-2 font-bold text-sm uppercase tracking-widest">Authorized Access Only</p>
                </div>

                {/* 승인 대기 또는 에러 메시지 */}
                {isPendingApproval && !error && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col items-center text-center gap-2">
                        <span className="text-amber-800 text-sm font-black italic">ACCESS DENIED</span>
                        <p className="text-amber-700 text-xs font-bold leading-relaxed">
                            로그인은 완료되었으나, 아직 **관리자 승인**이 되지 않았습니다.<br />
                            담당자에게 승인을 요청해 주세요.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-center text-xs font-bold leading-relaxed">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">이메일 계정</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-5 py-4 bg-slate-100 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-slate-900 shadow-inner"
                            placeholder="example@namhwa.com"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-5 py-4 bg-slate-100 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-slate-900 shadow-inner"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all flex justify-center items-center gap-2 active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? '인증 중...' : '시스템 접속'}
                    </button>
                </form>



                <div className="mt-4 flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={handleResetPassword}
                        className="text-xs font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                        비밀번호 재설정 이메일 발송
                    </button>
                </div>

                <div className="mt-10 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">&copy; 2024 NAMHWA CONSTRUCTION</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
