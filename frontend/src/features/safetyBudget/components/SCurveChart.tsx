import { useMemo } from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { getTargetCumulativeExecutionRate } from '../domain/sCurve';
import type { SCurveShape } from '../domain/sCurve';

interface SCurveChartProps {
    /** 현재 위험 가중 공정률 (0~100) */
    weightedProgressPct: number;
    /** 현재 실제 누적 집행률 (0~100) */
    actualCumulativeExecutionPct: number;
    shape?: SCurveShape;
}

/** S-곡선 목표선과 현재 위치(실제 지점)를 함께 그린다. */
export function SCurveChart({ weightedProgressPct, actualCumulativeExecutionPct, shape }: SCurveChartProps) {
    const targetCurveData = useMemo(() => {
        const points = [];
        for (let progress = 0; progress <= 100; progress += 5) {
            points.push({ progress, target: getTargetCumulativeExecutionRate(progress, shape) });
        }
        return points;
    }, [shape]);

    const actualPoint = [{ progress: weightedProgressPct, actual: actualCumulativeExecutionPct }];

    return (
        <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={targetCurveData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        dataKey="progress"
                        type="number"
                        domain={[0, 100]}
                        unit="%"
                        tick={{ fontSize: 12 }}
                        label={{ value: '위험 가중 공정률', position: 'insideBottom', offset: -5, fontSize: 12 }}
                    />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value?: number) => `${(value ?? 0).toFixed(1)}%`} />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="target"
                        name="목표 누적 집행률"
                        stroke="#7F0000"
                        dot={false}
                        strokeWidth={2}
                    />
                    <Scatter data={actualPoint} dataKey="actual" name="현재 실제 집행률" fill="#0f172a" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
