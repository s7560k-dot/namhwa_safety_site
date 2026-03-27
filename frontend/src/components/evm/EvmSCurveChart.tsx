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
import { CPM_TASK_LISTS } from '../../constants/cpmData';

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

    const siteTasks = CPM_TASK_LISTS[projectId] || CPM_TASK_LISTS['siteA'];

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

                // 1. 실적이 입력된 마지막 공종의 인덱스를 찾습니다.
                let lastIndexWithData = -1;
                siteTasks.forEach((t, i) => {
                    const taskData = tasksMap[t.id];
                    // ev나 ac가 존재하고 0보다 큰 경우 (실제 실적 입력이 있는 경우)를 '데이터가 있는 지점'으로 간주
                    if (taskData && (taskData.ev > 0 || taskData.ac > 0)) {
                        lastIndexWithData = i;
                    }
                });

                // 2. 마스터 데이터(siteTasks) 순서에 따라 누적 데이터 생성
                const chartData: ChartData[] = siteTasks.map((cpmTask, index) => {
                    const taskData = tasksMap[cpmTask.id];

                    // PV는 DB 데이터와 상관없이 항상 공정표(CPM) 상의 계획 예산을 누적합니다. (Fixes zero PV bug)
                    cumulativePV += cpmTask.cost;

                    if (taskData) {
                        cumulativeEV += taskData.ev || 0;
                        cumulativeAC += taskData.ac || 0;
                    }

                    // 현재 시점(오늘)까지만 선을 그리기 위해 lastIndexWithData를 기준으로 값을 할당합니다.
                    // 데이터가 없는 미래 구간은 null을 반환하여 그래프가 끊기게 합니다.
                    const hasActuals = index <= lastIndexWithData;

                    return {
                        time: cpmTask.name, // X축 라벨: CPM 공종명
                        PV: cumulativePV,
                        EV: hasActuals ? cumulativeEV : (null as any),
                        AC: hasActuals ? cumulativeAC : (null as any),
                    };
                });

                setData(chartData);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [projectId, siteTasks]);

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

