import { Link } from 'react-router-dom';

// '감사 준비도'(/audit) 탭은 법적 근거 없는 임의 가중치 점수라 실효성이 낮다는 판단에 따라 내비게이션에서만
// 제거했다. 페이지·컴포넌트·도메인 로직은 그대로 남아있어 필요하면 이 배열에 다시 추가하면 복원된다.
const TABS = [
    { path: '', label: '현황 대시보드' },
    { path: '/subcontractors', label: '협력사 잔액' },
    { path: '/settlement', label: '정산 시뮬레이션' },
    { path: '/import', label: '내역서 가져오기' },
    { path: '/proposal', label: '예산 품의서' },
] as const;

// active는 SafetyBudgetHeader의 activeTab과 동일한 넓은 타입을 받는다 — /audit처럼 TABS엔 없지만
// 여전히 유효한 라우트인 activeTab 값이 들어와도(그 페이지는 내비게이션에서만 숨겨진 것) 타입 에러 없이
// "일치하는 탭 없음 = 아무 탭도 하이라이트 안 함"으로 자연스럽게 처리되게 하기 위함.
export function SafetyBudgetTabs({ projectId, active }: { projectId: string; active: string }) {
    return (
        <nav className="flex gap-2 border-b border-slate-200 mb-8 overflow-x-auto">
            {TABS.map((tab) => (
                <Link
                    key={tab.path}
                    to={`/safety-budget/${projectId}${tab.path}`}
                    className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                        active === tab.path
                            ? 'border-red-600 text-red-600'
                            : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                >
                    {tab.label}
                </Link>
            ))}
        </nav>
    );
}
