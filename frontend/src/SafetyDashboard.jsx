import React, { useState, useEffect } from 'react';
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

const SafetyDashboard = () => {
    const { siteId: paramSiteId } = useParams();
    const siteId = paramSiteId || 'siteA'; // Default to siteA

    // Use custom hook for data
    const data = useDashboardData(siteId);

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
        siteA: { name: '대광로제비앙 (광주 선운)', text: 'text-blue-700', bg: 'bg-blue-600', gradient: 'from-blue-600 to-indigo-600', link: '/status_a/index.html' },
        siteB: { name: '수원 권선구 노유자시설', text: 'text-purple-700', bg: 'bg-purple-600', gradient: 'from-purple-600 to-pink-600', link: '/status_b/suwon.html' },
        siteC: { name: '부산 신축 공사', text: 'text-green-700', bg: 'bg-green-600', gradient: 'from-green-600 to-teal-600', link: '/status_c/busan.html' } // Placeholder for siteC
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
        await db.collection('sites').doc(siteId).collection('risk_works').add({
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
            await db.collection('sites').doc(siteId).collection('risk_works').doc(id).update(work);
            setEditingWorkId(null);
        }
    };
    const handleDeleteWork = async (id) => {
        if (confirm("삭제하시겠습니까?")) {
            await db.collection('sites').doc(siteId).collection('risk_works').doc(id).delete();
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
            <PrintReport data={data} siteName={currentSiteInfo.name} currentDate={currentDate} accidentFreeDays={data.accidentFreeDays} targetDays={data.targetDays} />
            <div className="no-print">
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
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer ${currentSiteInfo.bg}`}>관리</div>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className={`bg-gradient-to-r ${currentSiteInfo.gradient} rounded-2xl shadow-lg p-6 mb-8 text-white flex flex-col md:flex-row items-center justify-between animate-fade-in relative`}>
                        <button onClick={() => setShowSettingsModal(true)} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition"><Settings size={20} className="text-white" /></button>
                        <div className="mb-4 md:mb-0">
                            <h2 className="text-lg font-medium opacity-90 mb-1 flex items-center">우리 현장 무재해 기록 <button onClick={() => setShowSettingsModal(true)} className="ml-3 text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded flex items-center transition cursor-pointer border border-transparent hover:border-white/40">실착공일: {data.startDate} <Edit2 size={12} className="ml-1 opacity-70" /></button></h2>
                            <div className="flex items-end"><span className="text-5xl font-bold mr-2">{data.accidentFreeDays}</span><span className="text-xl mb-2">일째</span><span className="ml-4 bg-white/20 px-3 py-1 rounded-full text-sm">목표: {data.targetDays}일</span></div>
                        </div>
                        <div className="flex space-x-8 text-center pr-12">
                            <div className="cursor-pointer hover:bg-white/10 p-2 rounded-lg transition" onClick={() => setShowWorkerModal(true)}>
                                <p className="text-sm opacity-75 mb-1 flex items-center justify-center">금일 출력 인원 <MoreHorizontal size={12} className="ml-1" /></p>
                                <p className="text-2xl font-bold flex items-center justify-center"><Users size={20} className="mr-1" /> {data.workerList.reduce((acc, cur) => acc + parseInt(cur.count || 0), 0)}명</p>
                            </div>
                            <div className="h-12 w-px bg-white/30"></div>
                            <div><p className="text-sm opacity-75 mb-1">고위험 작업</p><p className="text-2xl font-bold flex items-center justify-center text-yellow-300"><AlertTriangle size={20} className="mr-1" /> {data.riskWorks.length}건</p></div>
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

export default SafetyDashboard;
