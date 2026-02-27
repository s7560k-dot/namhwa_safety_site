import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Firebase 경로는 프로젝트 구조에 맞게
import { WbsTask, calculateEvmMetrics } from './types';
import { Activity } from 'lucide-react';
import EvmUpdateModal from './EvmUpdateModal';
import ExcelWbsUploader from './ExcelWbsUploader';

interface EvmDashboardProps {
    projectId: string;
}

const EvmDashboard: React.FC<EvmDashboardProps> = ({ projectId }) => {
    const [tasks, setTasks] = useState<WbsTask[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<WbsTask | null>(null);

    useEffect(() => {
        // Firestore에서 현장의 WBS 데이터를 불러옴
        const unsubscribe = db
            .collection('sites')
            .doc(projectId)
            .collection('wbs_tasks')
            .onSnapshot((snapshot: any) => {
                const tasksData: WbsTask[] = snapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setTasks(tasksData);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [projectId]);

    if (loading) {
        return <div className="p-4 text-center text-gray-500">데이터를 불러오는 중입니다...</div>;
    }

    // 임시: 더미 데이터 주입 로직
    const addDummyData = async () => {
        if (!confirm('현재 프로젝트(siteA 등)에 지표 테스트를 위한 더미 WBS 데이터를 5개 주입하시겠습니까? (기존 데이터가 있다면 추가 생성됩니다)')) return;

        setLoading(true);
        const dummyTasks = [
            { name: '1월: 가설공사', startDate: '2026-01-01', endDate: '2026-01-31', pv: 10000000, ev: 10000000, ac: 9500000 },
            { name: '2월: 토공사', startDate: '2026-02-01', endDate: '2026-02-28', pv: 25000000, ev: 20000000, ac: 24000000 },
            { name: '3월: 골조공사(지하)', startDate: '2026-03-01', endDate: '2026-03-31', pv: 40000000, ev: 15000000, ac: 18000000 },
            { name: '4월: 골조공사(1층)', startDate: '2026-04-01', endDate: '2026-04-30', pv: 30000000, ev: 0, ac: 0 },
            { name: '5월: 골조공사(2층)', startDate: '2026-05-01', endDate: '2026-05-31', pv: 20000000, ev: 0, ac: 0 }
        ];

        try {
            const batch = db.batch();
            const colRef = db.collection('sites').doc(projectId).collection('wbs_tasks');

            dummyTasks.forEach((task, idx) => {
                // 순서 구분을 위해 id에 인덱스를 붙여 삽입
                const docRef = colRef.doc(`dummy_task_${idx + 1}`);
                batch.set(docRef, task);
            });

            await batch.commit();
            alert('✅ 더미 데이터가 성공적으로 주입되었습니다! 차트와 표를 확인해주세요.');
        } catch (e) {
            console.error(e);
            alert('데이터 주입 실패: 콘솔을 확인해주세요.');
        } finally {
            setLoading(false);
        }
    };

    // 데이터가 없을 경우 표시할 UI
    if (tasks.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <ExcelWbsUploader projectId={projectId} existingTasks={tasks} onSuccess={() => { }} />

                <div className="flex items-center justify-between mb-4 flex-wrap sm:flex-nowrap gap-2 overflow-x-auto">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center whitespace-nowrap shrink-0">
                        <Activity className="text-blue-500 mr-2" size={20} /> 공정 등록 지표 (EVM)
                    </h3>
                    <button
                        onClick={addDummyData}
                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors whitespace-nowrap shrink-0"
                    >
                        임시: 🧪 더미 데이터 5건 넣기
                    </button>
                </div>
                <div className="py-10 text-center text-gray-300 font-bold italic text-sm">등록된 공정 데이터가 없습니다.</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <ExcelWbsUploader projectId={projectId} existingTasks={tasks} onSuccess={() => { }} />

            <div className="flex items-center justify-between mb-4 flex-wrap sm:flex-nowrap gap-2 overflow-x-auto">
                <h3 className="text-lg font-bold text-gray-800 flex items-center whitespace-nowrap shrink-0">
                    <Activity className="text-blue-500 mr-2" size={20} /> 공정 등록 지표 (EVM)
                </h3>
                <div className="flex gap-2 shrink-0">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-bold whitespace-nowrap">
                        SPI/CPI &lt; 1.0 (지연/초과)
                    </span>
                    <button
                        onClick={addDummyData}
                        className="text-xs bg-indigo-50 text-indigo-600 px-2 flex items-center rounded font-bold hover:bg-indigo-100 transition-colors whitespace-nowrap"
                    >
                        + 더미 추가
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-center">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-3 py-4 rounded-l-lg whitespace-nowrap">작업명</th>
                            <th className="px-3 py-4 text-right whitespace-nowrap">계획가치(PV)</th>
                            <th className="px-3 py-4 text-right whitespace-nowrap">기성(EV)</th>
                            <th className="px-3 py-4 text-right whitespace-nowrap">실투입(AC)</th>
                            <th className="px-3 py-4 border-l border-gray-200 whitespace-nowrap">일정지수(SPI)</th>
                            <th className="px-3 py-4 whitespace-nowrap">비용지수(CPI)</th>
                            <th className="px-3 py-4 rounded-r-lg whitespace-nowrap border-l border-gray-200">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tasks.map((task) => {
                            const { spi, cpi } = calculateEvmMetrics(task);
                            const isDelayed = spi < 1;
                            const isOverBudget = cpi < 1;

                            return (
                                <tr key={task.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-3 py-4 font-bold text-gray-700 text-left whitespace-nowrap">{task.name}</td>
                                    <td className="px-3 py-4 text-gray-600 font-medium text-right whitespace-nowrap">{task.pv.toLocaleString()}</td>
                                    <td className="px-3 py-4 font-black text-gray-800 text-right whitespace-nowrap">{task.ev.toLocaleString()}</td>
                                    <td className="px-3 py-4 text-gray-600 font-medium text-right whitespace-nowrap">{task.ac.toLocaleString()}</td>

                                    <td className="px-3 py-4 border-l border-gray-200 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-md font-bold ${isDelayed ? 'bg-red-50 text-red-600 border border-red-100' : 'text-green-600'}`}>
                                            {spi.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-md font-bold ${isOverBudget ? 'bg-red-50 text-red-600 border border-red-100' : 'text-green-600'}`}>
                                            {cpi.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4 border-l border-gray-200 whitespace-nowrap">
                                        <button
                                            onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                                            className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded font-black hover:bg-indigo-100 transition-colors shadow-sm active:scale-95"
                                        >
                                            실적 입력
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* 실적 입력 모달 포탈 */}
            <EvmUpdateModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedTask(null); }}
                projectId={projectId}
                task={selectedTask}
                onSuccess={() => { setIsModalOpen(false); setSelectedTask(null); }}
            />
        </div>
    );
};

export default EvmDashboard;
