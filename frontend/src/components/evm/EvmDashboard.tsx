import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { WbsTask, calculateEvmMetrics } from './types';
import { Activity } from 'lucide-react';
import EvmUpdateModal from './EvmUpdateModal';
import { CPM_TASK_LISTS, CPM_CONFIGS } from '../../constants/cpmData';

interface EvmDashboardProps {
    projectId: string;
}

const EvmDashboard: React.FC<EvmDashboardProps> = ({ projectId }) => {
    const [tasks, setTasks] = useState<WbsTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<WbsTask | null>(null);

    // 해당 사이트의 설정과 태스크 목록 가져오기
    const siteTasks = CPM_TASK_LISTS[projectId] || CPM_TASK_LISTS['siteA'];
    const siteConfig = CPM_CONFIGS[projectId] || CPM_CONFIGS['siteA'];

    useEffect(() => {
        // Firestore에서 실적 데이터(EV, AC)만 불러옴
        const unsubscribe = db
            .collection('sites')
            .doc(projectId)
            .collection('wbs_tasks')
            .onSnapshot(async (snapshot: any) => {
                const firestoreDataMap: { [key: string]: any } = {};
                snapshot.forEach((doc: any) => {
                    firestoreDataMap[doc.id] = doc.data();
                });

                // siteTasks 마스터 데이터를 기준으로 UI용 데이터 병합
                const mergedTasks: WbsTask[] = siteTasks.map(cpmTask => {
                    const dbMetrics = firestoreDataMap[cpmTask.id] || {};
                    return {
                        id: cpmTask.id,
                        name: cpmTask.name, // 마스터 데이터(CPM) 최우선 지원
                        pv: cpmTask.cost,  // 마스터 데이터(CPM) 최우선 (자동 반영 보장)
                        ev: dbMetrics.ev || 0,
                        ac: dbMetrics.ac || 0,
                        startDate: siteConfig.startDate,
                        endDate: siteConfig.startDate, // 단순화: 전체 시작일 기준 (필요시 태스크별 계산)
                        updatedAt: dbMetrics.updatedAt || new Date().toISOString()
                    };
                });

                setTasks(mergedTasks);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [projectId, siteTasks, siteConfig]);

    // CPM 데이터를 기반으로 Firestore 실적 데이터 초기화 (이름/예산은 상수를 따라가므로 실적만 리셋)
    const initializeFromCpm = async (pid: string, force: boolean = false) => {
        if (force && !confirm('현재 등록된 실적(기성, 원가)을 모두 0으로 초기화하시겠습니까? 작업명과 예산은 공정표(CPM) 설정을 자동으로 따라갑니다.')) return;

        setIsSyncing(true);
        try {
            const colRef = db.collection('sites').doc(pid).collection('wbs_tasks');
            const batch = db.batch();

            // 기존 데이터의 메타데이터(이름, PV)를 제거하고 실적만 관리하도록 전환
            siteTasks.forEach((cpmTask) => {
                const docRef = colRef.doc(cpmTask.id);
                batch.set(docRef, {
                    ev: 0,
                    ac: 0,
                    updatedAt: new Date().toISOString()
                }, { merge: true }); // merge: true로 실적 필드만 0으로 세팅
            });

            await batch.commit();
            console.log("✅ Performance metrics reset to 0 based on CPM baseline.");
            if (force) alert('✅ 실적이 초기화되었습니다. 이름과 예산은 CPM 상수를 실시간으로 따릅니다.');
        } catch (err) {
            console.error("Initialization Error:", err);
            alert('초기화 중 오류가 발생했습니다.');
        } finally {
            setIsSyncing(false);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                <div className="text-gray-500 font-bold">공정 데이터를 초기화하는 중입니다...</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap sm:flex-nowrap gap-2 overflow-x-auto">
                <h3 className="text-lg font-bold text-gray-800 flex items-center whitespace-nowrap shrink-0">
                    <Activity className="text-blue-500 mr-2" size={20} /> 공정 등록 지표 (EVM)
                    <span className="ml-2 text-xs text-gray-400 font-normal">| CPM 연동 완료</span>
                </h3>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={() => initializeFromCpm(projectId, true)}
                        disabled={isSyncing}
                        className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded font-black border border-red-100 hover:bg-red-100 transition-colors"
                    >
                        🔄 CPM 기준 초기화
                    </button>
                    <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded font-bold whitespace-nowrap border border-blue-100">
                        SSOT: CPM Network
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-center border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider font-black">
                        <tr>
                            <th className="px-3 py-4 rounded-l-lg text-left pl-6">작업명</th>
                            <th className="px-3 py-4 text-right">계획가치(PV)</th>
                            <th className="px-3 py-4 text-right">기성실적(EV)</th>
                            <th className="px-3 py-4 text-right">실투입원가(AC)</th>
                            <th className="px-3 py-4 border-l border-gray-100">일정지수(SPI)</th>
                            <th className="px-3 py-4">비용지수(CPI)</th>
                            <th className="px-3 py-4 rounded-r-lg border-l border-gray-100">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tasks.length > 0 ? tasks.map((task) => {
                            const { spi, cpi } = calculateEvmMetrics(task);
                            const isDelayed = spi < 1 && task.pv > 0;
                            const isOverBudget = cpi < 1 && task.ac > 0;

                            return (
                                <tr key={task.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-3 py-4 font-bold text-gray-700 text-left pl-6 text-xs">{task.name}</td>
                                    <td className="px-3 py-4 text-gray-600 font-medium text-right text-xs">{task.pv.toLocaleString()}</td>
                                    <td className="px-3 py-4 font-black text-gray-900 text-right text-xs bg-gray-50/50">{task.ev.toLocaleString()}</td>
                                    <td className="px-3 py-4 text-gray-600 font-medium text-right text-xs">{task.ac.toLocaleString()}</td>

                                    <td className="px-3 py-4 border-l border-gray-100">
                                        <span className={`px-2 py-1 rounded-md font-bold text-[11px] ${isDelayed ? 'bg-red-50 text-red-600 border border-red-100' : (task.pv > 0 ? 'text-green-600' : 'text-gray-300')}`}>
                                            {task.pv > 0 ? spi.toFixed(2) : '-'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4">
                                        <span className={`px-2 py-1 rounded-md font-bold text-[11px] ${isOverBudget ? 'bg-red-50 text-red-600 border border-red-100' : (task.ac > 0 ? 'text-green-600' : 'text-gray-300')}`}>
                                            {task.ac > 0 ? cpi.toFixed(2) : '-'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4 border-l border-gray-100">
                                        <button
                                            onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                                            className="text-[10px] bg-white text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg font-black hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm active:scale-95"
                                        >
                                            실적 입력
                                        </button>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={7} className="py-20 text-center text-gray-400 font-bold italic">
                                    등록된 공정 데이터가 없습니다. 상단의 초기화 버튼을 눌러주세요.
                                </td>
                            </tr>
                        )}
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

