import { describe, it, expect } from 'vitest';
import { calculateAuditReadiness } from '../domain/auditReadiness';
import { reconcileLedger } from '../domain/reconciliation';

describe('calculateAuditReadiness', () => {
    it('지출이 없으면 문서화/증빙 지표는 만점, 의심 건수는 0건이다', () => {
        const reconciliation = reconcileLedger(1000, []);
        const result = calculateAuditReadiness([], reconciliation, 0);
        expect(result.documentationRate).toBe(100);
        expect(result.evidenceAttachmentRate).toBe(100);
        expect(result.suspiciousCount).toBe(0);
        expect(result.weightedScore).toBeCloseTo(100);
    });

    it('모든 지출이 완벽히 문서화되고 편차가 없으면 만점에 가깝다', () => {
        const expenses = [
            { date: '2026-01-01', amount: 300, ptwId: 'ptw-1', evidenceUrl: 'https://x.com/1' },
            { date: '2026-01-02', amount: 300, tbmId: 'tbm-1', evidenceUrl: 'https://x.com/2' },
        ];
        const reconciliation = reconcileLedger(1000, expenses.map((e) => e.amount));
        const result = calculateAuditReadiness(expenses, reconciliation, 0);
        expect(result.documentationRate).toBe(100);
        expect(result.evidenceAttachmentRate).toBe(100);
        expect(result.weightedScore).toBeCloseTo(100);
    });

    it('문서화와 증빙이 전혀 없으면 해당 지표가 0점이다', () => {
        const expenses = [
            { date: '2026-01-01', amount: 300 },
            { date: '2026-01-02', amount: 300 },
        ];
        const reconciliation = reconcileLedger(1000, expenses.map((e) => e.amount));
        const result = calculateAuditReadiness(expenses, reconciliation, 0);
        expect(result.documentationRate).toBe(0);
        expect(result.evidenceAttachmentRate).toBe(0);
    });

    it('의심 건수가 늘수록 의심 점수가 감점된다', () => {
        const expenses = [
            { date: '2026-01-01', amount: 600 },
            { date: '2026-01-02', amount: 600 }, // 누적 1200 > 1000 → 1건 초과
        ];
        const reconciliation = reconcileLedger(1000, expenses.map((e) => e.amount));
        const result = calculateAuditReadiness(expenses, reconciliation, 0);
        expect(result.suspiciousCount).toBe(1);
        expect(result.suspiciousScore).toBe(80); // 100 - 20*1
    });

    it('편차가 클수록 편차 점수가 감점되고, 감점은 0 밑으로 내려가지 않는다', () => {
        const reconciliation = reconcileLedger(1000, [500]);
        const result = calculateAuditReadiness([], reconciliation, 50); // |50|*5 = 250 감점 → 0 하한
        expect(result.deviationScore).toBe(0);
    });
});
