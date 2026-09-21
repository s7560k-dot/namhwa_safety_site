import { describe, it, expect } from 'vitest';
import { checkEligibility, checkHeadquartersUsageCap } from '../domain/eligibility';

describe('checkEligibility', () => {
    it('인정 항목이면 APPROVED', () => {
        const result = checkEligibility('PPE');
        expect(result.status).toBe('APPROVED');
    });

    it('인정 목록에 없는 코드면 REJECTED이고 대체 비목을 안내한다', () => {
        // @ts-expect-error 테스트 목적: 목록에 없는 코드를 의도적으로 전달
        const result = checkEligibility('UNKNOWN_CODE', ['PPE']);
        expect(result.status).toBe('REJECTED');
        expect(result.reason).toContain('SITE_GENERAL_EXPENSE');
    });
});

describe('checkHeadquartersUsageCap', () => {
    it('한도 비율이 설정되지 않았으면 등록을 막는다', () => {
        const result = checkHeadquartersUsageCap(100, 1000, undefined);
        expect(result.allowed).toBe(false);
    });

    it('사용분이 한도 이내면 허용한다', () => {
        const result = checkHeadquartersUsageCap(100, 1000, 20); // 한도 200
        expect(result.allowed).toBe(true);
    });

    it('사용분이 한도를 초과하면 막는다', () => {
        const result = checkHeadquartersUsageCap(300, 1000, 20); // 한도 200
        expect(result.allowed).toBe(false);
    });

    it('사용분이 정확히 한도와 같으면 허용한다', () => {
        const result = checkHeadquartersUsageCap(200, 1000, 20); // 한도 200
        expect(result.allowed).toBe(true);
    });
});
