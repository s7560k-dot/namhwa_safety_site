(function() {
    // [1] 초기 상태: 바디 숨김 (인증 확인 전까지 내용 노출 방지)
    const style = document.createElement('style');
    style.innerHTML = 'body { display: none !important; }';
    document.head.appendChild(style);

    // [2] Firebase 설정 (Vite .env의 값을 정적으로 주입)
    const firebaseConfig = {
        apiKey: "AIzaSyDbVG3iL3FBJe6alPLZnhFW_QAGpzeqFoY",
        authDomain: "namhwa-safety-dashboard.firebaseapp.com",
        projectId: "namhwa-safety-dashboard",
        storageBucket: "namhwa-safety-dashboard.firebasestorage.app",
        messagingSenderId: "152864778612",
        appId: "1:152864778612:web:ecc482adce93a1534a2421"
    };

    function initAuth() {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        firebase.auth().onAuthStateChanged(async (user) => {
            if (!user) {
                // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
                window.location.href = '/login';
                return;
            }

            try {
                // Firestore에서 승인 여부 실시간 확인
                const doc = await firebase.firestore().collection('users').doc(user.uid).get();
                if (doc.exists && (doc.data().isApproved === true || doc.data().role === 'admin')) {
                    // 승인된 사용자: 페이지 표시 허용
                    style.remove(); 
                } else {
                    // 미승인 사용자: 로그인 페이지로 튕기며 승인 대기 메시지 유도
                    window.location.href = '/login?pendingApproval=true';
                }
            } catch (err) {
                console.error("Auth check error:", err);
                window.location.href = '/login';
            }
        });
    }

    // [3] Firebase SDK 동적 로드 (Compat API 사용)
    if (typeof firebase === 'undefined') {
        const script = document.createElement('script');
        script.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";
        script.onload = () => {
            const authScript = document.createElement('script');
            authScript.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js";
            authScript.onload = () => {
                const dbScript = document.createElement('script');
                dbScript.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js";
                dbScript.onload = initAuth;
                document.head.appendChild(dbScript);
            };
            document.head.appendChild(authScript);
        };
        document.head.appendChild(script);
    } else {
        initAuth();
    }
})();
