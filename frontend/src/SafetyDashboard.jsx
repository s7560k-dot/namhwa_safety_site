import React, { useState, useEffect, Component } from 'react';
import { useParams } from 'react-router-dom';
import { db, storage } from './firebase';
import { useDashboardData } from './hooks/useDashboardData';
import PrintReport from './components/PrintReport';
import {
    CalendarIcon, Bell, Settings, Edit2, Users, MoreHorizontal, AlertTriangle,
    AlertOctagon, Save, Plus, ClipboardCheck, MessageSquare, CheckCircle,
    Activity, Truck, Tool, FlaskConical, LinkIcon, Printer, Trash, Upload
} from './components/Icons';
import * as Modals from './components/Modals';

class ErrorBoundary extends Component {
    constructor(props) { super(props); this.state = { hasError: false, errorInfo: null, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true }; }
    componentDidCatch(error, errorInfo) { this.setState({ errorInfo, error }); console.error("ErrorBoundary caught an error", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 bg-red-50 text-red-900 h-screen font-mono">
                    <h2 className="text-2xl font-bold mb-4">🚨 Rendering Error in SafetyDashboard</h2>
                    <p className="mb-2 whitespace-pre-wrap font-bold">{this.state.error?.toString()}</p>
                    <details className="cursor-pointer bg-white p-4 rounded shadow">
                        <summary className="font-bold outline-none">Toggle Stack Trace</summary>
                        <pre className="mt-2 text-xs overflow-auto whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre>
                    </details>
                </div>
            );
        }
        return this.props.children;
    }
}

const SafetyDashboardInner = () => {
    const { siteId: paramSiteId } = useParams();
    const siteId = paramSiteId || 'siteA'; // Default to siteA

    // Use custom hook for data
    const data = useDashboardData(siteId);
    const { approvals, activityLogs, taskDetails } = data;

    // [DEBUG] Log new data
    useEffect(() => {
        if (approvals?.length > 0) console.log("✅ Approvals loaded:", approvals);
        if (activityLogs?.length > 0) console.log("✅ ActivityLogs loaded:", activityLogs);
        if (taskDetails?.length > 0) console.log("✅ TaskDetails loaded:", taskDetails);
    }, [approvals, activityLogs, taskDetails]);

    // Local UI State
    const [currentDate, setCurrentDate] = useState("");
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showWorkerModal, setShowWorkerModal] = useState(false);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [showInspectionModal, setShowInspectionModal] = useState(false);
    const [showNoticeWriteModal, setShowNoticeWriteModal] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);

    // Modal specific state
    const [selectedIssueType, setSelectedIssueType] = useState('new');
    const [inspectionType, setInspectionType] = useState('');
    const [editingWorkId, setEditingWorkId] = useState(null);

    // Temp state for new/editing items
    const [inspectionImages, setInspectionImages] = useState([]);
    const [noticeFile, setNoticeFile] = useState(null);

    // Site Config
    const siteConfig = {
        siteA: { name: '대광새마을금고 신축공사', text: 'text-blue-700', bg: 'bg-blue-600', gradient: 'from-blue-600 to-indigo-600', link: '/status_a/index.html' },
        siteB: { name: '수원 노유자시설 신축공사', text: 'text-purple-700', bg: 'bg-purple-600', gradient: 'from-purple-600 to-pink-600', link: '/status_b/suwon.html' },
        siteC: { name: '평택 세탁소 시설 신축공사', text: 'text-green-700', bg: 'bg-green-600', gradient: 'from-green-600 to-teal-600', link: '/status_c/busan.html' }
    };
    const currentSiteInfo = siteConfig[siteId] || siteConfig['siteA'];

    useEffect(() => {
        const now = new Date();
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        setCurrentDate(`${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${days[now.getDay()]})`);
    }, []);

    // --- Handlers (Adapted from legacy) ---
    const handleToggleNotifications = () => {
        setShowNotifications(!showNotifications);
        if (!showNotifications && data.notificationCount > 0) {
            // In a real app, we might mark them as read here
            data.setNotificationCount(0);
        }
    };

    const handleSaveSettings = (e) => {
        e.preventDefault();
        const newStartDate = e.target.startDate.value;
        const newTargetDays = parseInt(e.target.targetDays.value);
        if (db) {
            db.collection('sites').doc(siteId).set({
                startDate: newStartDate, targetDays: newTargetDays
            }, { merge: true });
        }
        setShowSettingsModal(false);
    };

    // Worker Handlers
    const handleAddWorker = () => {
        const newWorker = { trade: '', count: 0 };
        data.setWorkerList([...data.workerList, newWorker]);
    };
    const handleWorkerChange = (id, field, value) => {
        data.setWorkerList(data.workerList.map(w => w.id === id ? { ...w, [field]: value } : w));
        // Note: Logic needs adaptation if id is missing (new item). 
        // For simplicity in migration, assume we might need a temp ID or handle submit differently.
        // Actually, let's just update local state and save all on "Save".
    };
    // The legacy code used direct DB updates or local state. 
    // Adapting `handleWorkerChange` to work with the mapped list index if ID is missing is tricky.
    // Let's rely on index for new items in the modal.
    const handleWorkerChangeByIndex = (index, field, value) => {
        const newList = [...data.workerList];
        newList[index] = { ...newList[index], [field]: value };
        data.setWorkerList(newList);
    }
    const handleDeleteWorker = (index) => {
        const newList = [...data.workerList];
        newList.splice(index, 1);
        data.setWorkerList(newList);
    };
    const saveWorkersToDB = async () => {
        const batch = db.batch();
        const ref = db.collection('sites').doc(siteId).collection('workers');
        // Delete all and rewrite? Or merge? Legacy logic was vague.
        // Simplest strategy: delete all existing in subcollection and add current list.
        // But deleting collection is hard in client SDK.
        // Let's just update existing documents and add new ones, delete removed ones.
        // For Migration MVP: Just add/update current ones.

        // Actually, legacy code just did: db.collection...add/set.
        // Let's try to overwrite properly if possible.
        // A simple way is to use a fixed document for the list, but it's a collection.
        // We'll skip complex sync logic for now and just add/update. 
        // *Correction*: Legacy code used `doc.id` for updates.

        for (const worker of data.workerList) {
            if (worker.id) {
                batch.set(ref.doc(worker.id), { trade: worker.trade, count: worker.count });
            } else {
                batch.set(ref.doc(), { trade: worker.trade, count: worker.count });
            }
        }
        await batch.commit();
        setShowWorkerModal(false);
    };

    // Risk Work Handlers
    const handleAddWork = async () => {
        await db.collection('sites').doc(siteId).collection('riskWorks').add({
            team: '신규팀', task: '작업 내용', risk: '중', workerCount: 0, manager: '', status: '예정',
            eduCompleted: 0, assessment: '', createdAt: Date.now()
        });
    };
    const handleWorkEdit = (id) => setEditingWorkId(id);
    const handleWorkChange = (id, field, value) => {
        data.setRiskWorks(data.riskWorks.map(w => w.id === id ? { ...w, [field]: value } : w));
    };
    const handleWorkSave = async (id) => {
        const work = data.riskWorks.find(w => w.id === id);
        if (work) {
            await db.collection('sites').doc(siteId).collection('riskWorks').doc(id).update(work);
            setEditingWorkId(null);
        }
    };
    const handleDeleteWork = async (id) => {
        if (confirm("삭제하시겠습니까?")) {
            await db.collection('sites').doc(siteId).collection('riskWorks').doc(id).delete();
        }
    };

    // Issue Handlers
    const handleAddIssue = async () => {
        await db.collection('sites').doc(siteId).collection('issues').add({
            status: 'new', loc: '', finder: '', desc: '', beforeImg: null, afterImg: null, createdAt: Date.now()
        });
    };
    const handleIssueChange = (id, field, value) => {
        data.setIssueList(data.issueList.map(i => i.id === id ? { ...i, [field]: value } : i));
    };
    const handleIssueImageUpload = async (id, field, e) => {
        const file = e.target.files[0];
        if (!file) return;
        const ref = storage.ref(`site_issues/${Date.now()}_${file.name}`);
        await ref.put(file);
        const url = await ref.getDownloadURL();
        handleIssueChange(id, field, url);
        // Auto save to DB
        await db.collection('sites').doc(siteId).collection('issues').doc(id).update({ [field]: url });
    };
    const saveIssueChanges = async (id) => {
        const issue = data.issueList.find(i => i.id === id);
        if (issue) {
            await db.collection('sites').doc(siteId).collection('issues').doc(id).update(issue);
            alert("저장되었습니다.");
        }
    };
    const changeIssueStatus = async (id, status) => {
        await db.collection('sites').doc(siteId).collection('issues').doc(id).update({ status });
    };

    // Inspection Handlers
    const openInspectionModal = (type) => {
        setInspectionType(type);
        setInspectionImages([]);
        setShowInspectionModal(true);
    };
    const handleInspectionImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        const newAttachments = await Promise.all(files.map(async file => {
            const ref = storage.ref(`site_inspections/${Date.now()}_${file.name}`);
            await ref.put(file);
            const url = await ref.getDownloadURL();
            return { type: file.type.includes('pdf') ? 'pdf' : 'image', url, name: file.name };
        }));
        setInspectionImages(prev => [...prev, ...newAttachments]);
    };
    const handleRemoveInspectionImage = (index) => {
        setInspectionImages(prev => prev.filter((_, i) => i !== index));
    };
    const handleSaveInspection = async (e) => {
        e.preventDefault();
        await db.collection('sites').doc(siteId).collection('inspections').add({
            type: inspectionType,
            item: e.target.item.value,
            date: new Date().toISOString().slice(5, 10),
            status: e.target.result.value,
            images: inspectionImages,
            createdAt: Date.now()
        });
        setShowInspectionModal(false);
    };

    // Notice Handlers
    const handleAddNotice = () => {
        setShowNoticeWriteModal(true);
        setNoticeFile(null);
    };
    const handleSaveNotice = async (e) => {
        e.preventDefault();
        let attachment = null;
        if (noticeFile) {
            const ref = storage.ref(`site_notices/${Date.now()}_${noticeFile.name}`);
            await ref.put(noticeFile);
            const url = await ref.getDownloadURL();
            attachment = { url, type: noticeFile.type.includes('pdf') ? 'pdf' : 'image', name: noticeFile.name };
        }
        await db.collection('sites').doc(siteId).collection('notices').add({
            type: '공지', title: e.target.title.value, content: e.target.content.value,
            author: '관리자', date: new Date().toISOString().slice(5, 10),
            attachment, createdAt: Date.now()
        });
        setShowNoticeWriteModal(false);
    };
    const handleDeleteNotice = async (id) => {
        if (confirm("삭제하시겠습니까? (비밀번호: 1234)")) {
            const pwd = prompt("관리자 비밀번호");
            if (pwd === "1234") {
                await db.collection('sites').doc(siteId).collection('notices').doc(id).delete();
            } else {
                alert("비밀번호 오류");
            }
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans relative pb-20">
            {/* Report: Hidden on screen, Visible on print */}
            <div id="print-area" className="hidden">
                <PrintReport data={data} siteName={currentSiteInfo.name} currentDate={currentDate} accidentFreeDays={data.accidentFreeDays} targetDays={data.targetDays} />
            </div>

            {/* Dashboard: Visible on screen, Hidden on print */}
            <div id="screen-area">
                <header className={`bg-white shadow-sm sticky top-0 z-30 border-b-4 ${siteId === 'siteA' ? 'border-blue-500' : 'border-purple-500'}`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                        <div className="flex items-center w-1/4">
                            <div><h1 className="text-xl font-bold text-gray-900 leading-tight">Safety ON</h1><p className="text-xs text-gray-500">스마트 안전보건 플랫폼</p></div>
                        </div>
                        <div className="flex-1 text-center">
                            <h2 className={`text-2xl font-extrabold tracking-wide drop-shadow-sm ${currentSiteInfo.text}`}>{currentSiteInfo.name}</h2>
                            <p className="text-xs text-gray-400 mt-1">" 남화의 미래를 켜다 "</p>
                        </div>
                        <div className="flex items-center justify-end space-x-6 w-1/4">
                            <span className="text-sm font-medium text-gray-500 flex items-center hidden sm:flex"><CalendarIcon className="mr-2" size={16} /> {currentDate}</span>
                            <div className="relative cursor-pointer z-[105]" onClick={handleToggleNotifications}>
                                <Bell className={`hover:text-gray-600 transition ${showNotifications ? 'text-blue-500' : 'text-gray-400'}`} />
                                {data.notificationCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-bounce">{data.notificationCount}</span>}

                                {/* Notification Dropdown */}
                                {showNotifications && (
                                    <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in z-50">
                                        <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
                                            <h4 className="font-bold text-gray-700">알림</h4>
                                            <span className="text-xs text-blue-500 cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); data.setNotifications([]); data.setNotificationCount(0); }}>모두 읽음</span>
                                        </div>
                                        {data.notifications && data.notifications.length > 0 ? (
                                            <div className="max-h-80 overflow-y-auto">
                                                {data.notifications.map((notif, idx) => (
                                                    <div key={idx} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition cursor-pointer">
                                                        <div className="flex items-start">
                                                            <div className={`mt-1 w-2 h-2 rounded-full mr-3 shrink-0 ${notif.type === '공지' ? 'bg-blue-500' : notif.type === '부적합' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-800">{notif.message}</p>
                                                                <p className="text-xs text-gray-400 mt-1">{notif.date} · {notif.type}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="px-4 py-8 text-center text-gray-400 text-sm">새로운 알림이 없습니다.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer ${currentSiteInfo.bg}`}>관리</div>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className={`bg-gradient-to-r ${currentSiteInfo.gradient} rounded-xl shadow-lg p-6 mb-8 text-white flex flex-col md:flex-row items-center justify-between animate-fade-in relative overflow-hidden`}>
                        {/* 설정 버튼 (절대 위치 우측 고정) */}
                        <button onClick={() => setShowSettingsModal(true)} className="absolute top-1/2 -translate-y-1/2 right-6 w-11 h-11 bg-white/15 rounded-full hover:bg-white/25 transition flex items-center justify-center backdrop-blur-md border border-white/10 z-10 shadow-sm">
                            <Settings size={20} className="text-white opacity-90" />
                        </button>

                        {/* 왼쪽 영역: 무재해 기록 */}
                        <div className="flex-1 mb-6 md:mb-0">
                            <div className="flex items-center mb-2">
                                <h2 className="text-[17px] font-medium tracking-wide text-white/95">우리 현장 무재해 기록</h2>
                                <button onClick={() => setShowSettingsModal(true)} className="ml-3 text-[11px] bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md flex items-center transition cursor-pointer border border-white/5 tracking-wide text-white/90">
                                    실착공일: {data.startDate} <Edit2 size={10} className="ml-1.5 opacity-70" />
                                </button>
                            </div>
                            <div className="flex items-end">
                                <span className="text-5xl md:text-[54px] font-black leading-none">{data.accidentFreeDays}</span>
                                <span className="text-lg font-medium ml-2 pb-1 opacity-90">일째</span>
                                <div className="ml-5 bg-white/15 px-3 py-1 mb-1.5 rounded-full text-[13px] font-medium flex items-center border border-white/5 pb-1">
                                    목표: {data.headerInfo?.goal || data.targetDays}일
                                </div>
                            </div>
                        </div>

                        {/* 오른쪽 영역: 금일 출력 인원 및 고위험 작업 */}
                        <div className="flex items-center space-x-6 md:space-x-8 pr-[4.5rem]">
                            {/* 금일 출력 인원 */}
                            <div className="flex flex-col items-end cursor-pointer group" onClick={() => setShowWorkerModal(true)}>
                                <p className="text-[13px] text-white/80 mb-2 flex items-center font-medium tracking-wide">
                                    금일 출력 인원 <MoreHorizontal size={14} className="ml-1 opacity-60" />
                                </p>
                                <p className="text-[26px] font-bold flex items-center tracking-tight">
                                    <Users size={20} className="mr-1.5 opacity-90" strokeWidth={2.5} />
                                    {data.workerList.reduce((acc, cur) => acc + parseInt(cur.count || 0), 0)}명
                                </p>
                            </div>

                            {/* 세로 구분선 */}
                            <div className="h-12 w-px bg-white/25 mx-2 rounded-full"></div>

                            {/* 고위험 작업 */}
                            <div className="flex flex-col items-start pr-2">
                                <p className="text-[13px] text-white/80 mb-2 font-medium tracking-wide">고위험 작업</p>
                                <p className="text-[26px] font-bold flex items-center text-yellow-300 tracking-tight">
                                    <AlertTriangle size={18} className="mr-1.5" strokeWidth={2.5} />
                                    {data.riskWorks.length}건
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Risk Works Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center"><AlertOctagon className="text-red-500 mr-2" size={20} /> 금일 고위험 작업 현황</h3>
                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-bold animate-pulse">● 실시간 동기화 중</span>
                                </div>
                                <div className="overflow-x-auto mb-2">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500"><tr><th className="px-3 py-3 rounded-l-lg">작업팀</th><th className="px-3 py-3">작업 내용</th><th className="px-3 py-3">위험도</th><th className="px-3 py-3">투입 인원</th><th className="px-3 py-3">감독자</th><th className="px-3 py-3">상태</th><th className="px-3 py-3 rounded-r-lg w-16">관리</th></tr></thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {data.riskWorks.map((work) => (
                                                <tr key={work.id} className="hover:bg-gray-50">
                                                    {editingWorkId === work.id ? (
                                                        <>
                                                            <td className="px-3 py-2"><input className="border rounded px-1 w-full" value={work.team} onChange={(e) => handleWorkChange(work.id, 'team', e.target.value)} /></td>
                                                            <td className="px-3 py-2"><input className="border rounded px-1 w-full" value={work.task} onChange={(e) => handleWorkChange(work.id, 'task', e.target.value)} /></td>
                                                            <td className="px-3 py-2"><select className="border rounded px-1" value={work.risk} onChange={(e) => handleWorkChange(work.id, 'risk', e.target.value)}><option value="상">상</option><option value="중">중</option><option value="하">하</option></select></td>
                                                            <td className="px-3 py-2"><input type="number" className="border rounded px-1 w-full" value={work.workerCount} onChange={(e) => handleWorkChange(work.id, 'workerCount', e.target.value)} /></td>
                                                            <td className="px-3 py-2"><input className="border rounded px-1 w-full" value={work.manager} onChange={(e) => handleWorkChange(work.id, 'manager', e.target.value)} /></td>
                                                            <td className="px-3 py-2"><select className="border rounded px-1" value={work.status} onChange={(e) => handleWorkChange(work.id, 'status', e.target.value)}><option value="예정">예정</option><option value="진행">진행</option><option value="완료">완료</option></select></td>
                                                            <td className="px-3 py-2 text-center"><button onClick={() => handleWorkSave(work.id)} className="text-green-600 bg-green-100 p-1 rounded"><Save size={16} /></button></td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-3 py-3 font-medium">{work.team}</td>
                                                            <td className="px-3 py-3">{work.task}</td>
                                                            <td className="px-3 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${work.risk === '상' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{work.risk}</span></td>
                                                            <td className="px-3 py-3 font-bold text-blue-600">{work.workerCount}명</td>
                                                            <td className="px-3 py-3">{work.manager}</td>
                                                            <td className="px-3 py-3"><span className="flex items-center text-gray-500"><span className={`w-2 h-2 rounded-full mr-2 ${work.status === '진행' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>{work.status}</span></td>
                                                            <td className="px-3 py-3 text-center">
                                                                <button onClick={() => handleWorkEdit(work.id)} className="text-blue-500 p-1 rounded hover:bg-blue-50"><Edit2 size={16} /></button>
                                                                <button onClick={() => handleDeleteWork(work.id)} className="text-red-500 p-1 rounded hover:bg-red-50 ml-1"><Trash size={16} /></button>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button onClick={handleAddWork} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 transition text-sm font-bold flex items-center justify-center"><Plus size={16} className="mr-1" /> 작업 추가하기</button>
                            </div>

                            {/* 2. 안전 교육 및 위험성평가 현황 (Restored) */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                                <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold text-gray-800 flex items-center"><ClipboardCheck className="text-blue-500 mr-2" size={20} /> 고위험 작업 안전 관리 (교육 & 위험성평가)</h3></div>
                                {data.riskWorks.length === 0 ? <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">등록된 고위험 작업이 없습니다.</div> : (
                                    <div className="space-y-6">
                                        {data.riskWorks.map((work) => {
                                            const eduCompleted = parseInt(work.eduCompleted) || 0;
                                            const workerCount = parseInt(work.workerCount) || 0;
                                            const rate = workerCount > 0 ? Math.round((eduCompleted / workerCount) * 100) : 0;
                                            const isOverflow = rate > 100;
                                            const normalWidth = isOverflow ? 100 : rate;
                                            const overflowWidth = isOverflow ? (rate - 100) : 0;

                                            return (
                                                <div key={work.id} className="border border-gray-200 rounded-xl p-5 bg-gray-50 hover:bg-white transition hover:shadow-md">
                                                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1"><span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded font-bold">{work.team}</span><span className={`text-xs px-2 py-0.5 rounded font-bold ${work.risk === '상' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>위험도 {work.risk}</span></div>
                                                            <h4 className="font-bold text-gray-800 text-lg">{work.task}</h4>
                                                        </div>
                                                        <div className="flex-1 max-w-md bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-sm font-bold text-gray-600">특별 안전 교육 이수 현황</span>
                                                                <span className={`text-sm font-bold ${rate >= 100 ? 'text-green-600' : rate >= 80 ? 'text-blue-600' : 'text-orange-500'}`}>
                                                                    {rate}% {isOverflow ? '(초과 달성!)' : '달성'}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 relative overflow-hidden">
                                                                <div className={`h-2.5 ${isOverflow ? 'rounded-l-full' : 'rounded-full'} transition-all duration-500 ${rate >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${normalWidth}%` }}></div>
                                                                {isOverflow && (
                                                                    <div className="h-2.5 bg-red-400 rounded-r-full transition-all duration-500 absolute left-full -translate-x-full" style={{ width: `${Math.min(overflowWidth, 20)}%` }} title={`초과: ${overflowWidth}%`}></div>
                                                                )}
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-500">교육 대상: <strong className="text-gray-800">{work.workerCount}명</strong></span>
                                                                <div className="flex items-center gap-2">
                                                                    <span>이수 완료:</span>
                                                                    <input type="number" min="0" className="w-16 border rounded px-1 py-0.5 text-center font-bold" value={work.eduCompleted} onChange={(e) => handleWorkChange(work.id, 'eduCompleted', parseInt(e.target.value) || 0)} onBlur={() => handleWorkSave(work.id)} />
                                                                    <span>명</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3">
                                                        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">사전 위험성평가 및 중점 관리 대책</label>
                                                        <textarea className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none bg-white" rows="2" placeholder="주요 위험 요인과 안전 대책을 입력하세요." value={work.assessment} onChange={(e) => handleWorkChange(work.id, 'assessment', e.target.value)} onBlur={() => handleWorkSave(work.id)}></textarea>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Notice Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center"><MessageSquare className="text-purple-500 mr-2" size={20} /> Safety 알림 게시판</h3>
                                    <button onClick={handleAddNotice} className="text-sm px-3 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition flex items-center"><Plus size={12} className="mr-1" /> 글쓰기</button>
                                </div>
                                <div className="space-y-3">
                                    {data.noticeData.map((notice) => (
                                        <div key={notice.id} onClick={() => setSelectedNotice(notice)} className="flex items-center justify-between p-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer group">
                                            <div className="flex items-center gap-3"><span className={`text-xs font-bold px-2 py-1 rounded ${notice.type === '공지' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{notice.type}</span><span className="text-sm font-medium text-gray-800 hover:text-blue-600 transition">{notice.title}</span></div>
                                            <div className="flex items-center text-xs text-gray-400 gap-3">
                                                <span>{notice.author}</span><span>{notice.date}</span>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteNotice(notice.id); }} className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500 transition ml-2"><Trash size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Issues Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><CheckCircle className="text-green-500 mr-2" size={20} /> 안전 부적합 조치</h3>
                                <div className="space-y-3">
                                    <div onClick={() => { setSelectedIssueType('new'); setShowIssueModal(true); }} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100 cursor-pointer hover:-translate-y-1 transition"><div className="flex items-center"><div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center text-red-600 mr-3"><AlertTriangle size={16} /></div><span className="text-sm font-bold text-gray-700">신규 발견 (접수 대기)</span></div><span className="text-xl font-bold text-red-600">{data.issueCounts.new}</span></div>
                                    <div onClick={() => { setSelectedIssueType('processing'); setShowIssueModal(true); }} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100 cursor-pointer hover:-translate-y-1 transition"><div className="flex items-center"><div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-600 mr-3"><Activity size={16} /></div><span className="text-sm font-bold text-gray-700">조치 중 (진행)</span></div><span className="text-xl font-bold text-yellow-600">{data.issueCounts.processing}</span></div>
                                    <div onClick={() => { setSelectedIssueType('done'); setShowIssueModal(true); }} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100 cursor-pointer hover:-translate-y-1 transition"><div className="flex items-center"><div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-600 mr-3"><CheckCircle size={16} /></div><span className="text-sm font-bold text-gray-700">조치 완료</span></div><span className="text-xl font-bold text-green-600">{data.issueCounts.done}</span></div>
                                </div>
                            </div>

                            {/* Inspections Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">반입 점검 및 알림</h3>
                                <div className="grid grid-cols-1 gap-2 mb-4">
                                    <button onClick={() => openInspectionModal('건설장비')} className="py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100 flex items-center justify-center border border-blue-100"><Truck size={16} className="mr-2" /> 건설장비 점검</button>
                                    <button onClick={() => openInspectionModal('기계기구')} className="py-2.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-bold hover:bg-orange-100 flex items-center justify-center border border-orange-100"><Tool size={16} className="mr-2" /> 기계기구 점검</button>
                                    <button onClick={() => openInspectionModal('유해화학물질')} className="py-2.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-bold hover:bg-purple-100 flex items-center justify-center border border-purple-100"><FlaskConical size={16} className="mr-2" /> 유해화학물질 점검</button>
                                </div>
                                <ul className="space-y-3 mt-4">
                                    {data.inspectionLog.slice(0, 5).map(log => (
                                        <li key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 text-sm">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-700">{log.item}</span>
                                                <span className="text-xs text-gray-500">{log.type} | {log.date}</span>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded font-bold ${log.status === '합격' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{log.status}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-gray-200 mt-8 relative flex justify-center items-center">
                    <p className="text-gray-400 text-sm font-medium">남화토건(주) 안전보건팀</p>
                    <div className="absolute right-4 flex space-x-2">
                        <button onClick={() => window.print()} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition shadow-sm whitespace-nowrap"><Printer size={16} className="mr-2" /> PDF 보고서 출력</button>
                        <a href={currentSiteInfo.link} target="_blank" className="flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap border border-purple-400/30"><LinkIcon size={18} className="mr-2" /> 예정공정표 바로가기</a>
                    </div>
                </footer>

                {/* Modals */}
                <Modals.SettingsModal show={showSettingsModal} onClose={() => setShowSettingsModal(false)} onSave={handleSaveSettings} startDate={data.startDate} targetDays={data.targetDays} />
                <Modals.WorkerModal show={showWorkerModal} onClose={() => setShowWorkerModal(false)} workerList={data.workerList} onChange={handleWorkerChangeByIndex} onAdd={handleAddWorker} onDelete={handleDeleteWorker} onSave={saveWorkersToDB} />
                <Modals.IssueModal show={showIssueModal} onClose={() => setShowIssueModal(false)} issues={data.issueList} type={selectedIssueType} onAdd={handleAddIssue} onChange={handleIssueChange} onImageUpload={handleIssueImageUpload} onSave={saveIssueChanges} onStatusChange={changeIssueStatus} />
                <Modals.InspectionModal show={showInspectionModal} onClose={() => setShowInspectionModal(false)} type={inspectionType} onSave={handleSaveInspection} images={inspectionImages} onImageUpload={handleInspectionImageUpload} onRemoveImage={handleRemoveInspectionImage} setPreview={setPreviewFile} />
                <Modals.NoticeModal show={!!selectedNotice} onClose={() => setSelectedNotice(null)} notice={selectedNotice} />
                <Modals.NoticeWriteModal show={showNoticeWriteModal} onClose={() => setShowNoticeWriteModal(false)} onSave={handleSaveNotice} setFile={setNoticeFile} />
                <Modals.PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
            </div>
        </div>
    );
};

const SafetyDashboard = () => (
    <ErrorBoundary>
        <SafetyDashboardInner />
    </ErrorBoundary>
);

export default SafetyDashboard;
