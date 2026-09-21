// AuthContext.jsx의 최소 타입 선언. safetyBudget 등 strict TS 코드에서 소비하기 위한 용도이며
// 기존 AuthContext.jsx 구현은 건드리지 않는다.
export interface AuthUser {
    email: string | null;
    uid: string;
    displayName?: string | null;
}

export interface AuthUserData {
    name?: string;
    email?: string;
    role?: string;
    isApproved?: boolean;
    [key: string]: unknown;
}

export interface AuthContextValue {
    user: AuthUser | null;
    userData: AuthUserData | null;
    loading: boolean;
    isAdmin: boolean;
}

export function useAuth(): AuthContextValue;
export function AuthProvider(props: { children: unknown }): unknown;
