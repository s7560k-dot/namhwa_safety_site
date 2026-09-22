import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SITE_OPTIONS } from '../config/constants';
import { SafetyBudgetTabs } from './SafetyBudgetTabs';

interface SafetyBudgetHeaderProps {
    projectId: string;
    projectName: string;
    activeTab: '' | '/subcontractors' | '/settlement' | '/audit' | '/import';
    rightSlot?: ReactNode;
}

/** 산안비 페이지 공통 헤더: 뒤로가기, 제목, 현장 전환, 탭 네비게이션. */
export function SafetyBudgetHeader({ projectId, projectName, activeTab, rightSlot }: SafetyBudgetHeaderProps) {
    const navigate = useNavigate();

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-red-600 text-sm font-bold mb-3">
                        <ArrowLeft size={16} /> 자료실로
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900">{projectName}</h1>
                    <p className="text-slate-500 font-medium">산안비 실행예산 관리</p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={projectId}
                        onChange={(e) => navigate(`/safety-budget/${e.target.value}${activeTab}`)}
                        className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 bg-white"
                    >
                        {SITE_OPTIONS.map((site) => (
                            <option key={site.id} value={site.id}>
                                {site.label}
                            </option>
                        ))}
                    </select>
                    {rightSlot}
                </div>
            </div>
            <SafetyBudgetTabs projectId={projectId} active={activeTab} />
        </>
    );
}
