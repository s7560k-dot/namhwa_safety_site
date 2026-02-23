import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Compat SDK: auth.onAuthStateChanged
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                navigate('/');
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

            // [추가] Firestore에서 사용자 역할 확인 및 로컬 스토리지 저장
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.role === 'admin') {
                    localStorage.setItem('userRole', 'admin');
                }
            } else if (email.endsWith('@namhwa.com') || email === 'nhs1033@nate.com') {
                // 화이트리스트 이메일의 경우 레거시 호환을 위해 설정
                localStorage.setItem('userRole', 'admin');
            }

            navigate('/');
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
                case 'auth/requests-from-referer-blocked':
                case 'auth/unauthorized-domain':
                    msg = `도메인 차단됨: ${err.message}. Firebase Console 또는 Google Cloud Console의 API Key 설정을 확인하세요.`;
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
            setError(''); // 에러 메시지 초기화
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
        <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">남화토건(주)</h1>
                    <p className="text-gray-500 mt-2">안전보건팀 자료실 로그인</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">이메일 (ID)</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="example@namhwa.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="비밀번호 입력"
                        />
                    </div>

                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow transition duration-200 flex justify-center items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <span>로그인</span>
                        )}
                    </button>
                </form>

                <div className="mt-4 flex flex-col gap-3">
                    {/* 비밀번호 재설정 */}
                    <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={loading}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg shadow transition duration-200"
                    >
                        🔑 비밀번호 재설정 이메일 발송
                    </button>
                    {/* 게스트 로그인 (개발용) */}
                    <button
                        onClick={async () => {
                            setLoading(true);
                            try {
                                await auth.signInAnonymously();
                                navigate('/');
                            } catch (err) {
                                console.warn("Anonymous login failed, forcing Guest Mode:", err);
                                sessionStorage.setItem('guestMode', 'true');
                                navigate('/');
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-lg shadow transition duration-200 flex justify-center items-center"
                    >
                        게스트 로그인 (개발용)
                    </button>
                </div>

                <div className="mt-6 text-center text-xs text-gray-400">
                    &copy; 2024 Namhwa Construction Co., Ltd.
                </div>
            </div>
        </div>
    );
};

export default Login;
