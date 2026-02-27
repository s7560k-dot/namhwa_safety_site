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
import { CPM_TASKS } from '../../constants/cpmData';

interface EvmSCurveChartProps {
    projectId: string;
}

interface ChartData {
    time: string; // 작업명 (X축)
    PV: number;
    EV: number;
    AC: number;
}

const EvmSCurveChart: React.FC<EvmSCurveChartProps> = ({ projectId }) => {
    const [data, setData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Firestore 데이터를 불러와 CPM 작업 순서대로 누적치 계산
        const unsubscribe = db
            .collection('sites')
            .doc(projectId)
            .collection('wbs_tasks')
            .onSnapshot((snapshot: any) => {
                const tasksMap: { [key: string]: WbsTask } = {};
                snapshot.forEach((doc: any) => {
                    tasksMap[doc.id] = { id: doc.id, ...doc.data() } as WbsTask;
                });

                let cumulativePV = 0;
                let cumulativeEV = 0;
                let cumulativeAC = 0;

                // 마스터 데이터(CPM_TASKS) 순서에 따라 누적 데이터 생성
                const chartData: ChartData[] = CPM_TASKS.map((cpmTask) => {
                    const taskData = tasksMap[cpmTask.id];

                    if (taskData) {
                        cumulativePV += taskData.pv || 0;
                        cumulativeEV += taskData.ev || 0;
                        cumulativeAC += taskData.ac || 0;
                    } else {
                        // DB에 아직 생성되지 않은 경우 (초기화 전) CPM 기본 배정액 누적
                        cumulativePV += cpmTask.cost;
                    }

                    return {
                        time: cpmTask.name, // X축 라벨: CPM 공종명
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
        return null;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <Activity className="text-indigo-500 mr-2" size={20} /> S-Curve (기성 실적 현황)
                    <span className="ml-3 text-xs text-gray-400 font-normal tracking-wide">(단위: 원)</span>
                </h3>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#6B7280' }}
                            interval={0}
                            angle={-15}
                            textAnchor="end"
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            width={100}
                            tickFormatter={(value) => (value / 100000000).toFixed(1) + "억"}
                        />
                        <Tooltip
                            formatter={(value: any) => [`${Number(value).toLocaleString()} 원`, '']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Line
                            type="monotone"
                            dataKey="PV"
                            name="계획가치(PV)"
                            stroke="#9CA3AF"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="EV"
                            name="기성실적(EV)"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="AC"
                            name="투입원가(AC)"
                            stroke="#EF4444"
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

