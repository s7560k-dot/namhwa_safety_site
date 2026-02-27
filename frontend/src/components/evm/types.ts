export interface WbsTask {
    id: string;
    name: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    pv: number; // Planned Value (계획가치)
    ev: number; // Earned Value (기성가치)
    ac: number; // Actual Cost (실제투입원가)
}

export interface EvmMetrics {
    cv: number; // Cost Variance (비용 차이) = EV - AC
    sv: number; // Schedule Variance (일정 차이) = EV - PV
    cpi: number; // Cost Performance Index (비용 성과 지수) = EV / AC
    spi: number; // Schedule Performance Index (일정 성과 지수) = EV / PV
}

export const calculateEvmMetrics = (task: WbsTask): EvmMetrics => {
    const { pv, ev, ac } = task;

    const cv = ev - ac;
    const sv = ev - pv;

    // 0으로 나누는 경우를 방지하기 위해 최소값 설정 (또는 0일 경우 0 처리)
    const cpi = ac > 0 ? Number((ev / ac).toFixed(2)) : 0;
    const spi = pv > 0 ? Number((ev / pv).toFixed(2)) : 0;

    return { cv, sv, cpi, spi };
};
