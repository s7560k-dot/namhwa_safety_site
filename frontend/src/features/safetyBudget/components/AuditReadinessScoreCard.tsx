import type { AuditReadinessBreakdown } from '../domain/auditReadiness';
import { SUSPICIOUS_EXPENSE_PENALTY_PER_CASE, DEVIATION_PENALTY_PER_PERCENT_POINT } from '../config/constants';

function Row({ label, value, weight }: { label: string; value: string; weight: number }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-50">
            <span className="text-slate-600">
                {label} <span className="text-xs text-slate-400">(가중치 {(weight * 100).toFixed(0)}%)</span>
            </span>
            <span className="font-bold text-slate-900">{value}</span>
        </div>
    );
}

export function AuditReadinessScoreCard({ breakdown }: { breakdown: AuditReadinessBreakdown }) {
    return (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-2">감사 준비도 점수</h3>
            <p className="text-5xl font-black text-red-600 mb-6">{breakdown.weightedScore.toFixed(1)}점</p>

            <div className="mb-4">
                <Row
                    label="명세서 작성률 (PTW/TBM 연결)"
                    value={`${breakdown.documentationRate.toFixed(1)}%`}
                    weight={breakdown.weights.documentation}
                />
                <Row
                    label="증빙 첨부율"
                    value={`${breakdown.evidenceAttachmentRate.toFixed(1)}%`}
                    weight={breakdown.weights.evidenceAttachment}
                />
                <Row
                    label="목적 외 의심 건수"
                    value={`${breakdown.suspiciousCount}건 (${breakdown.suspiciousScore.toFixed(1)}점)`}
                    weight={breakdown.weights.suspiciousCount}
                />
                <Row
                    label="소진율 편차 관리"
                    value={`${breakdown.deviationPct.toFixed(1)}%p (${breakdown.deviationScore.toFixed(1)}점)`}
                    weight={breakdown.weights.deviationControl}
                />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
                산식: 각 지표를 0~100점으로 환산한 뒤 가중 평균. 의심 건수는 건당 {SUSPICIOUS_EXPENSE_PENALTY_PER_CASE}점,
                편차는 %p당 {DEVIATION_PENALTY_PER_PERCENT_POINT}점을 감점합니다. 가중치는 법적 근거가 아닌 운영 기준이며
                조정 가능합니다.
            </p>
        </div>
    );
}
