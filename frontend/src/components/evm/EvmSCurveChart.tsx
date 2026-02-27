import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { WbsTask } from './types';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Activity } from 'lucide-react';

interface EvmSCurveChartProps {
    projectId: string;
}

// 차트 렌더링용 데이터 포맷
interface ChartData {
    time: string; // X축 (예: 날짜, 주차 또는 작업명)
    PV: number;
    EV: number;
    AC: number;
}

const EvmSCurveChart: React.FC<EvmSCurveChartProps> = ({ projectId }) => {
    const [data, setData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Firestore 데이터를 불러와 누적치를 계산하거나 차트 모양으로 매핑
        // 실제 환경에서는 날짜별 누적 데이터를 계산해야 하나, 
        // 여기서는 작업(Task) 순서대로 누적(S-Curve 형상을 위해)된다고 가정
        const unsubscribe = db
            .collection('sites')
            .doc(projectId)
            .collection('wbs_tasks')
            .orderBy('startDate', 'asc') // 시작일 기준 정렬로 시간 흐름 표현
            .onSnapshot((snapshot: any) => {
                let cumulativePV = 0;
                let cumulativeEV = 0;
                let cumulativeAC = 0;

                const chartData: ChartData[] = snapshot.docs.map((doc: any) => {
                    const taskData = doc.data() as WbsTask;

                    cumulativePV += taskData.pv || 0;
                    cumulativeEV += taskData.ev || 0;
                    cumulativeAC += taskData.ac || 0;

                    return {
                        time: taskData.name || doc.id, // x축에 표시될 라벨 (실제로는 Month 등)
                        PV: cumulativePV,
                        EV: cumulativeEV,
                        AC: cumulativeAC,
                    };
                });

                setData(chartData);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [projectId]);

    if (loading) {
        return <div className="p-4 text-center text-gray-500">차트를 불러오는 중입니다...</div>;
    }

    if (data.length === 0) {
        return null; // 데이터가 없으면 차트를 그리지 않음
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <Activity className="text-indigo-500 mr-2" size={20} /> S-Curve (기성 실적 현황)
                    <span className="ml-3 text-xs text-gray-400 font-normal tracking-wide">(단위: 백만 원)</span>
                </h3>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            width={80}
                            tickFormatter={(value) => (value / 1000000).toLocaleString()}
                        />
                        <Tooltip
                            formatter={(value: any) => [`${Number(value).toLocaleString()} 원`, '']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line
                            type="monotone"
                            dataKey="PV"
                            name="계획가치(PV)"
                            stroke="#9CA3AF" // 회색 (계획 선)
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="EV"
                            name="기성실적(EV)"
                            stroke="#3B82F6" // 파란색 (당초 기성 선)
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="AC"
                            name="투입원가(AC)"
                            stroke="#EF4444" // 빨간색 (실 투입액)
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default EvmSCurveChart;
