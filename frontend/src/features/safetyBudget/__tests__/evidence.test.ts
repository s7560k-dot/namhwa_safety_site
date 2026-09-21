import { describe, it, expect } from 'vitest';
import { hasWeakEvidence } from '../domain/evidence';

describe('hasWeakEvidence', () => {
    it('증빙 링크와 PTW/TBM이 모두 있으면 약한 증빙이 아니다', () => {
        expect(hasWeakEvidence({ evidenceUrl: 'https://x.com/a', ptwId: 'ptw-1' })).toBe(false);
        expect(hasWeakEvidence({ evidenceUrl: 'https://x.com/a', tbmId: 'tbm-1' })).toBe(false);
    });

    it('증빙 링크가 없으면 PTW/TBM이 있어도 약한 증빙이다', () => {
        expect(hasWeakEvidence({ ptwId: 'ptw-1', tbmId: 'tbm-1' })).toBe(true);
    });

    it('PTW와 TBM이 모두 없으면 증빙 링크가 있어도 약한 증빙이다', () => {
        expect(hasWeakEvidence({ evidenceUrl: 'https://x.com/a' })).toBe(true);
    });

    it('아무것도 없으면 약한 증빙이다', () => {
        expect(hasWeakEvidence({})).toBe(true);
    });
});
