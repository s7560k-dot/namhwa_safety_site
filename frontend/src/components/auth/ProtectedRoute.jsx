import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * AuthenticatedRoute
 * 로그인이 필요한 페이지 보호. 로그인하지 않은 사용자는 /login으로 이동.
 */
export const AuthenticatedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

/**
 * ApprovedRoute
 * 관리자 승인이 완료된 인원만 접근 가능하도록 보호.
 * 승인되지 않은 경우 /login으로 이동하되, 승인 대기 메시지를 표시하도록 함.
 */
export const ApprovedRoute = ({ children }) => {
    const { user, userData, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 관리자가 직접 승인(isApproved: true)해야 접근 가능
    if (userData && userData.isApproved !== true && userData.role !== 'admin') {
        return <Navigate to="/login" state={{ pendingApproval: true }} replace />;
    }

    return children;
};

/**
 * AdminRoute
 * 관리자 권한이 있는 인원만 접근 가능하도록 보호.
 */
export const AdminRoute = ({ children }) => {
    const { user, userData, loading } = useAuth();

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!user || (userData && userData.role !== 'admin')) {
        return <Navigate to="/" replace />;
    }

    return children;
};
