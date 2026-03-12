import React, { useState, useEffect, Component } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, storage } from './firebase';
import { useDashboardData } from './hooks/useDashboardData';
import PrintReport from './components/PrintReport';
import {
    CalendarIcon, Bell, Settings, Edit2, Users, MoreHorizontal, AlertTriangle,
    AlertOctagon, Save, Plus, ClipboardCheck, MessageSquare, CheckCircle,
    Activity, Truck, Tool, FlaskConical, LinkIcon, Printer, Trash, Upload, ArrowRight, CheckSquare
} from './components/Icons';
import * as Modals from './components/Modals';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import NetworkScheduleDashboard from './components/evm/NetworkScheduleDashboard';

// ----------------------------------------------------------------------
// [로고 심볼 컴포넌트] - 브랜드 아이덴티티 강화
// ----------------------------------------------------------------------
const NamhwaSymbol = ({ className }) => (
    <img src="/namhwa_logo.png" alt="Namhwa Logo" className={className} />
);

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
            data.setNotificationCount(0);
        }
    };

    const handleSaveSettings = (e) => {
        e.preventDefault();
        const newStartDate = e.target.startDate.value;
        const newTargetDays = parseInt(e.target.targetDays.value);
        const newCctvUrl = e.target.cctvUrl.value;
        if (db) {
            db.collection('sites').doc(siteId).set({
                startDate: newStartDate, targetDays: newTargetDays, cctvUrl: newCctvUrl
            }, { merge: true });
        }
        setShowSettingsModal(false);
    };

    // Worker Handlers
    const handleAddWorker = () => {
        // 기존 배열에 id가 없는 점을 보완하기 위해 고유한 id(Date.now)를 부여
        const newWorker = { id: Date.now().toString(), trade: '', count: 0 };
        data.setWorkerList([...data.workerList, newWorker]);
    };

    const handleWorkerChangeByIndex = (id, field, value) => {
        // 기존에는 index로 받던 것을 id 기준으로 명확히 변경합니다. (Modal에서 worker.id 를 넘기고 있음)
        const newList = data.workerList.map(worker =>
            worker.id === id ? { ...worker, [field]: value } : worker
        );
        data.setWorkerList(newList);
    };
    const handleDeleteWorker = (id) => {
        // index 기반의 splice 대신 id를 기준으로 필터링하여 불변성을 유지합니다.
        const newList = data.workerList.filter(w => w.id !== id);
        data.setWorkerList(newList);
    };
    const saveWorkersToDB = async () => {
        try {
            const batch = db.batch();
            const ref = db.collection('sites').doc(siteId).collection('workers');

            // 1. 기존 DB 데이터 모두 삭제 (완전 동기화를 위함)
            const snapshot = await ref.get();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            // 2. 현재 화면의 리스트를 모두 새로 추가
            for (const worker of data.workerList) {
                // 공종명이 비어있으면 저장하지 않음
                if (!worker.trade || worker.trade.trim() === '') continue;

                const newDocRef = ref.doc();
                batch.set(newDocRef, { trade: worker.trade.trim(), count: parseInt(worker.count) || 0 });
            }

            await batch.commit();
            alert("출역 인원 정보가 저장되었습니다.");
            setShowWorkerModal(false);
        } catch (error) {
            console.error("출역 인원 저장 오류:", error);
            alert("출역 인원 저장에 실패했습니다.");
        }
    };

    // Risk Work Handlers
    const handleAddWork = async () => {
        await db.collection('sites').doc(siteId).collection('riskWorks').add({
            team: '신규팀', task: '작업 내용', risk: '중', workerCount: 0, manager: '', status: '예정',
            eduCompleted: 0, assessment: '', createdAt: Date.now()
        });
    };
    const handleWorkEdit = (id) => setEditingWorkId(id);
    // Image Compression Utility
    const compressImage = (file, maxWidth = 1280, quality = 0.7) => {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                resolve(file); // 이미지가 아니면 원본 반환 (PDF 등)
                return;
            }
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            // File 객체와 유사하게 name 속성 유지
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error("Canvas toBlob failed"));
                        }
                    }, 'image/jpeg', quality);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

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
            status: 'new', loc: '', finder: '', desc: '', beforeImg: null, afterImg: null, 
            archived: false, createdAt: Date.now()
        });
    };
    const handleIssueChange = (id, field, value) => {
        data.setIssueList(data.issueList.map(i => i.id === id ? { ...i, [field]: value } : i));
    };
    const handleIssueImageUpload = async (id, field, e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. 로컬 미리보기 생성 및 즉시 반영 (isUploading 표시를 위해 객체 형태로 저장 시도)
        const localUrl = URL.createObjectURL(file);
        handleIssueChange(id, field, { url: localUrl, isUploading: true });

        console.log(`[Issue Upload] Starting upload/compress for issue: ${id}, field: ${field}, file: ${file.name}`);
        try {
            // 2. 이미지 압축 (최대 1280px, 품질 0.7)
            const compressedFile = await compressImage(file);
            console.log(`[Issue Resize] Compressed: ${file.size} -> ${compressedFile.size} bytes`);

            const ref = storage.ref(`sites/${siteId}/issues/${Date.now()}_${file.name}`);
            await ref.put(compressedFile);
            const url = await ref.getDownloadURL();
            
            // 3. 서버 URL로 교체 (완료 상태)
            handleIssueChange(id, field, url);
            
            // DB sync
            await db.collection('sites').doc(siteId).collection('issues').doc(id).update({ [field]: url });
            console.log(`[Issue Upload] Success for: ${file.name}`);
        } catch (error) {
            console.error(`[Issue Upload] Failed:`, error);
            handleIssueChange(id, field, null); // 실패 시 초기화
            alert(`사진 업로드 중 오류가 발생했습니다: ${error.message}`);
        }
    };
    const saveIssueChanges = async (id) => {
        const issue = data.issueList.find(i => i.id === id);
        if (issue) {
            try {
                const updates = {
                    loc: issue.loc || "",
                    finder: issue.finder || "",
                    desc: issue.desc || "",
                    status: issue.status || "new",
                    updatedAt: Date.now()
                };

                // 임시 Blob URL은 DB에 저장하지 않고 서버 URL만 저장하도록 필터링
                if (issue.beforeImg && typeof issue.beforeImg === 'string' && !issue.beforeImg.startsWith('blob:')) updates.beforeImg = issue.beforeImg;
                if (issue.afterImg && typeof issue.afterImg === 'string' && !issue.afterImg.startsWith('blob:')) updates.afterImg = issue.afterImg;

                await db.collection('sites').doc(siteId).collection('issues').doc(id).update(updates);
                console.log(`[Issue Save] DB update success for issue: ${id}`);
                alert("성공적으로 저장되었습니다.");
            } catch (error) {
                console.error("Issue save error:", error);
                alert("저장 중 오류가 발생했습니다.");
            }
        }
    };
    const changeIssueStatus = async (id, status) => {
        const issue = data.issueList.find(i => i.id === id);
        if (!issue) return;

        console.log(`[Status Change] Moving issue ${id} to ${status}`);
        try {
            // blob URL은 DB에 저장하지 않음 (업로드 완료 후 별도 업데이트됨)
            const updates = { 
                status,
                loc: issue.loc || "",
                finder: issue.finder || "",
                desc: issue.desc || "",
                updatedAt: Date.now()
            };
            
            // 유효한 서버 URL만 포함 (미리보기 Blob 주소 제외)
            if (issue.beforeImg && !issue.beforeImg.startsWith('blob:')) updates.beforeImg = issue.beforeImg;
            if (issue.afterImg && !issue.afterImg.startsWith('blob:')) updates.afterImg = issue.afterImg;

            await db.collection('sites').doc(siteId).collection('issues').doc(id).update(updates);
            console.log(`[Status Change] DB sync success for status: ${status}`);
        } catch (error) {
            console.error("Status change error:", error);
            alert("상태 변경 중 오류가 발생했습니다.");
        }
    };
    const archiveIssue = async (id) => {
        if (!confirm("이 항목을 조치 완료 목록에서 제외하시겠습니까?\n(데이터는 서버에 안전하게 보관됩니다.)")) return;

        try {
            console.log(`[Issue Archive] Archiving issue: ${id}`);
            // 1. 로컬 상태 즉시 반영 (낙관적 업데이트)
            data.setIssueList(prev => prev.map(i => i.id === id ? { ...i, archived: true } : i));
            
            // 2. 서버 업데이트
            await db.collection('sites').doc(siteId).collection('issues').doc(id).update({ 
                archived: true,
                updatedAt: Date.now()
            });

            console.log(`[Issue Archive] Success`);
            // 3. 성공 알림 (모달은 부모의 filteredIssues 필터링에 의해 자동으로 항목이 사라지거나 빈 화면이 됨)
            alert("목록에서 안전하게 제거되었습니다.");
        } catch (error) {
            console.error("[Issue Archive] Error:", error);
            const msg = error.code === 'permission-denied' ? "권한이 없습니다. 관리자에게 문의하세요." : "목록에서 제거하는 중 오류가 발생했습니다.";
            alert(msg);
            // 실패 시 로컬 상태 복구
            data.setIssueList(prev => prev.map(i => i.id === id ? { ...i, archived: false } : i));
        }
    };

    const handlePrintAndSave = async () => {
        window.print();
        try {
            const printElement = document.getElementById('print-area');
            if (!printElement) return;
            printElement.classList.remove('hidden');
            const canvas = await html2canvas(printElement, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            printElement.classList.add('hidden');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            const blob = pdf.output('blob');
            const now = new Date();
            const timestamp = now.getFullYear() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0') + "_" + now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
            const fileName = `${currentSiteInfo.name}_안전보건일일리포트_${timestamp}.pdf`;
            const storageRef = storage.ref(`sites/${siteId}/reports/${fileName}`);
            await storageRef.put(blob);
        } catch (error) {
            console.error("❌ PDF 자동 저장 중 오류 발생:", error);
        }
    };

    // Inspection Handlers
    const openInspectionModal = (type) => {
        setInspectionType(type);
        setInspectionImages([]);
        setShowInspectionModal(true);
    };
    const handleInspectionImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // 1. 로컬 미리보기 즉시 생성 (사용자 경험 최우선)
        const tempIdPrefix = Date.now();
        const localItems = files.map((file, idx) => ({
            type: file.type.includes('pdf') ? 'pdf' : 'image',
            url: URL.createObjectURL(file),
            name: file.name,
            tempId: `${tempIdPrefix}_${idx}`,
            isUploading: true
        }));
        setInspectionImages(prev => [...prev, ...localItems]);

        console.log(`[Inspection Upload] Starting compress and upload for ${files.length} files`);
        try {
            await Promise.all(files.map(async (file, idx) => {
                // 2. 이미지 압축
                const compressedFile = await compressImage(file);
                console.log(`[Inspection Resize] ${file.name}: ${file.size} -> ${compressedFile.size} bytes`);

                const ref = storage.ref(`sites/${siteId}/inspections/${tempIdPrefix}_${idx}_${file.name}`);
                await ref.put(compressedFile);
                const url = await ref.getDownloadURL();
                
                // 3. 서버 URL로 교체 (tempId 매칭)
                setInspectionImages(prev => prev.map(item => 
                    item.tempId === `${tempIdPrefix}_${idx}` ? { ...item, url, isUploading: false } : item
                ));
            }));
            console.log(`[Inspection Upload] All files processed successfully`);
        } catch (error) {
            console.error(`[Inspection Upload] Error:`, error);
            alert(`사진 업로드 중 오류가 발생했습니다: ${error.message}`);
        }
    };
    const handleRemoveInspectionImage = (index) => {
        console.log(`[Inspection Remove] Removing image at index: ${index}`);
        setInspectionImages(prev => prev.filter((_, i) => i !== index));
    };
    const handleSaveInspection = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const item = formData.get('item');
        const result = formData.get('result');
        const details = formData.get('details');

        try {
            await db.collection('sites').doc(siteId).collection('inspections').add({
                type: inspectionType,
                item: item,
                details: details || "",
                date: new Date().toISOString().slice(5, 10), // MM-DD
                status: result,
                images: inspectionImages,
                createdAt: Date.now()
            });
            setShowInspectionModal(false);
            setInspectionImages([]);
            console.log(`[Inspection Save] Success: ${item}`);
        } catch (error) {
            console.error("[Inspection Save] Error:", error);
            alert("점검 내용 저장 중 오류가 발생했습니다.");
        }
    };

    // Notice Handlers
    const handleSaveNotice = async (e) => {
        e.preventDefault();
        let attachment = null;
        if (noticeFile) {
            const ref = storage.ref(`sites/${siteId}/notices/${Date.now()}_${noticeFile.name}`);
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
                        <Link to="/" className="flex items-center w-1/4 group cursor-pointer transition-transform hover:scale-105">
                            <NamhwaSymbol className="h-12 w-auto object-contain mr-3 text-red-800" />
                            <div>
                                <h1 className="text-xl font-black text-gray-900 leading-tight group-hover:text-red-700 transition-colors uppercase tracking-tight">Safety ON</h1>
                                <p className="text-[10px] font-bold text-gray-400 -mt-0.5 tracking-widest uppercase">Smart Platform</p>
                            </div>
                        </Link>
                        <div className="flex-1 text-center">
                            <h2 className={`text-2xl font-extrabold tracking-wide drop-shadow-sm ${currentSiteInfo.text}`}>{currentSiteInfo.name}</h2>
                            <p className="text-xs text-gray-400 mt-1">" 남화의 미래를 켜다 "</p>
                        </div>
                        <div className="flex items-center justify-end space-x-6 w-1/4">
                            <span className="text-sm font-medium text-gray-500 flex items-center hidden sm:flex"><CalendarIcon className="mr-2" size={16} /> {currentDate}</span>
                            <div className="relative cursor-pointer z-[105]" onClick={handleToggleNotifications}>
                                <Bell className={`hover:text-gray-600 transition ${showNotifications ? 'text-blue-500' : 'text-gray-400'}`} />
                                {data.notificationCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-bounce">{data.notificationCount}</span>}

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
                        <button onClick={() => setShowSettingsModal(true)} className="absolute top-1/2 -translate-y-1/2 right-6 w-11 h-11 bg-white/15 rounded-full hover:bg-white/25 transition flex items-center justify-center backdrop-blur-md border border-white/10 z-10 shadow-sm">
                            <Settings size={20} className="text-white opacity-90" />
                        </button>

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

                        <div className="flex items-center space-x-6 md:space-x-8 pr-[4.5rem]">
                            <div className="flex flex-col items-end cursor-pointer group" onClick={() => setShowWorkerModal(true)}>
                                <p className="text-[13px] text-white/80 mb-2 flex items-center font-medium tracking-wide">
                                    금일 출력 인원 <MoreHorizontal size={14} className="ml-1 opacity-60" />
                                </p>
                                <p className="text-[26px] font-bold flex items-center tracking-tight">
                                    <Users size={20} className="mr-1.5 opacity-90" strokeWidth={2.5} />
                                    {data.workerList.reduce((acc, cur) => acc + parseInt(cur.count || 0), 0)}명
                                </p>
                            </div>
                            <div className="h-12 w-px bg-white/25 mx-2 rounded-full"></div>
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
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center"><AlertOctagon className="text-red-500 mr-2" size={20} /> 금일 고위험 작업 현황</h3>
                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-bold animate-pulse">● 실시간 동기화 중</span>
                                </div>
                                <div className="overflow-x-auto mb-2">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-3 py-4 rounded-l-lg">작업팀</th>
                                                <th className="px-3 py-4">작업 내용</th>
                                                <th className="px-3 py-4">위험도</th>
                                                <th className="px-3 py-4">인원</th>
                                                <th className="px-3 py-4">감독자</th>
                                                <th className="px-3 py-4">상태</th>
                                                <th className="px-3 py-4 rounded-r-lg w-16 text-center">관리</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {data.riskWorks.length > 0 ? data.riskWorks.map((work) => (
                                                <tr key={work.id} className="hover:bg-gray-50 group transition-colors">
                                                    {editingWorkId === work.id ? (
                                                        <>
                                                            <td className="px-3 py-2"><input className="border rounded px-1.5 py-1 w-full text-xs" value={work.team} onChange={(e) => handleWorkChange(work.id, 'team', e.target.value)} /></td>
                                                            <td className="px-3 py-2"><input className="border rounded px-1.5 py-1 w-full text-xs" value={work.task} onChange={(e) => handleWorkChange(work.id, 'task', e.target.value)} /></td>
                                                            <td className="px-3 py-2"><select className="border rounded px-1.5 py-1 text-xs" value={work.risk} onChange={(e) => handleWorkChange(work.id, 'risk', e.target.value)}><option value="상">상</option><option value="중">중</option><option value="하">하</option></select></td>
                                                            <td className="px-3 py-2"><input type="number" className="border rounded px-1.5 py-1 w-full text-xs" value={work.workerCount} onChange={(e) => handleWorkChange(work.id, 'workerCount', e.target.value)} /></td>
                                                            <td className="px-3 py-2"><input className="border rounded px-1.5 py-1 w-full text-xs" value={work.manager} onChange={(e) => handleWorkChange(work.id, 'manager', e.target.value)} /></td>
                                                            <td className="px-3 py-2"><select className="border rounded px-1.5 py-1 text-xs" value={work.status} onChange={(e) => handleWorkChange(work.id, 'status', e.target.value)}><option value="예정">예정</option><option value="진행">진행</option><option value="완료">완료</option></select></td>
                                                            <td className="px-3 py-2 text-center"><button onClick={() => handleWorkSave(work.id)} className="text-green-600 bg-green-100 p-1.5 rounded-md hover:bg-green-200 transition"><Save size={16} /></button></td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-3 py-4 font-bold text-gray-700">{work.team}</td>
                                                            <td className="px-3 py-4 text-gray-600 font-medium">{work.task}</td>
                                                            <td className="px-3 py-4">
                                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${work.risk === '상' ? 'bg-red-50 text-red-600 border border-red-100' : work.risk === '중' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                                                    {work.risk}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-4 font-black text-gray-800">{work.workerCount || 0}<span className="text-[10px] font-bold text-gray-400 ml-0.5">명</span></td>
                                                            <td className="px-3 py-4 text-gray-600 font-semibold">{work.manager}</td>
                                                            <td className="px-3 py-4">
                                                                <span className="flex items-center text-[11px] font-black text-gray-500 uppercase tracking-widest gap-2">
                                                                    <span className={`w-2 h-2 rounded-full ${work.status === '진행' ? 'bg-green-500 animate-pulse' : work.status === '완료' ? 'bg-gray-300' : 'bg-yellow-400'}`}></span>
                                                                    {work.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-4 text-center">
                                                                <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                                                                    <button onClick={() => setEditingWorkId(work.id)} className="text-blue-500 hover:text-blue-700 p-2 transition rounded-xl hover:bg-blue-50/50"><Edit2 size={14} /></button>
                                                                    <button onClick={() => handleDeleteWork(work.id)} className="text-gray-300 hover:text-red-500 p-2 transition rounded-xl hover:bg-red-50/50"><Trash size={14} /></button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={7} className="px-3 py-16 text-center bg-gray-50/30 rounded-b-xl border-t border-gray-100/50">
                                                        <div className="flex flex-col items-center justify-center space-y-4">
                                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                                                <CheckSquare size={32} className="text-green-500/40" strokeWidth={1.5} />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <p className="text-sm font-black text-gray-600 tracking-tight">현재 등록된 고위험 작업 현황이 없습니다.</p>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none opacity-80">안전 표준 작업 절차</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <button onClick={handleAddWork} className="w-full py-3.5 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 hover:border-red-700/20 hover:text-red-700 hover:bg-red-50/30 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center group mb-2">
                                    <Plus size={14} className="mr-2 group-hover:rotate-90 transition-transform" />
                                    <span>작업 추가하기</span>
                                </button>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                                <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold text-gray-800 flex items-center"><ClipboardCheck className="text-blue-500 mr-2" size={20} /> 고위험 작업 안전 관리 (교육 & 위험성평가)</h3></div>
                                {data.riskWorks.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl italic font-medium opacity-60">
                                        고위험 작업이 등록되면 안전 관리 카드가 생성됩니다.
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {data.riskWorks.map((work) => {
                                            const eduCompleted = parseInt(work.eduCompleted) || 0;
                                            const workerCount = parseInt(work.workerCount) || 0;
                                            const rate = workerCount > 0 ? Math.round((eduCompleted / workerCount) * 100) : 0;
                                            const isOverflow = rate > 100;
                                            const normalWidth = isOverflow ? 100 : rate;

                                            return (
                                                <div key={work.id} className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50 hover:bg-white transition-all hover:shadow-xl border-l-[6px] border-l-gray-200 hover:border-l-blue-500">
                                                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-5 gap-6">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="bg-gray-800 text-white text-[10px] px-2.5 py-1 rounded font-black uppercase tracking-widest leading-none">{work.team}</span>
                                                                <span className={`text-[10px] px-2.5 py-1 rounded font-black uppercase tracking-widest leading-none border ${work.risk === '상' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'}`}>위험도 {work.risk}</span>
                                                            </div>
                                                            <h4 className="font-black text-gray-900 text-xl tracking-tight leading-tight">{work.task}</h4>
                                                        </div>
                                                        <div className="flex-1 max-w-sm bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group/card shadow-blue-500/5">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest italic group-hover/card:text-blue-500 transition-colors">교육 진행 현황</span>
                                                                <span className={`text-sm font-black transition-colors ${rate >= 100 ? 'text-green-600' : rate >= 80 ? 'text-blue-600' : 'text-orange-500'}`}>
                                                                    {rate}% {isOverflow ? '!' : ''}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-100 rounded-full h-3 mb-4 relative overflow-hidden">
                                                                <div className={`h-full rounded-full transition-all duration-1000 ease-out ${rate >= 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${normalWidth}%` }}></div>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[11px] font-bold">
                                                                <span className="text-gray-400 uppercase">대상 인원: <strong className="text-gray-800 ml-1">{work.workerCount}</strong></span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-gray-400 uppercase leading-none">이수 완료:</span>
                                                                    <input type="number" min="0" className="w-12 bg-gray-50 border-0 rounded-lg py-1 px-1.5 text-center font-black text-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all leading-none h-6" value={work.eduCompleted} onChange={(e) => handleWorkChange(work.id, 'eduCompleted', parseInt(e.target.value) || 0)} onBlur={() => handleWorkSave(work.id)} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                                            <AlertTriangle size={12} className="text-red-500/50" />
                                                            <span>위험성 평가 및 안전 대책</span>
                                                        </label>
                                                        <textarea className="w-full p-4 text-sm font-medium border border-gray-100 rounded-xl focus:outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-50 shadow-inner bg-white/80 backdrop-blur-sm" rows="2" placeholder="주요 위험 요인과 안전 대책을 입력하세요." value={work.assessment} onChange={(e) => handleWorkChange(work.id, 'assessment', e.target.value)} onBlur={() => handleWorkSave(work.id)}></textarea>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center"><MessageSquare className="text-purple-500 mr-2" size={20} /> Safety 알림 게시판</h3>
                                    <button onClick={() => setShowNoticeWriteModal(true)} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-all flex items-center border border-purple-100/50 group">
                                        <Plus size={12} className="mr-1.5 group-hover:rotate-90 transition-transform" />
                                        <span>공지 작성</span>
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {data.noticeData.length > 0 ? data.noticeData.map((notice) => (
                                        <div key={notice.id} onClick={() => setSelectedNotice(notice)} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group active:scale-[0.99] border-b border-gray-50 last:border-0">
                                            <div className="flex items-center gap-4">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${notice.type === '공지' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{notice.type}</span>
                                                <span className="text-sm font-bold text-gray-800 group-hover:text-purple-700 transition-colors">{notice.title}</span>
                                            </div>
                                            <div className="flex items-center text-[11px] font-bold text-gray-400 gap-4">
                                                <span className="opacity-60">{notice.author}</span>
                                                <span className="opacity-60">{notice.date}</span>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteNotice(notice.id); }} className="p-2 hover:bg-red-50 rounded-xl text-gray-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash size={14} /></button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-10 text-center text-gray-300 font-bold italic text-sm">등록된 게시물이 없습니다.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in overflow-hidden relative group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                            <Activity className="text-blue-500 mr-2" size={20} /> 실시간 CCTV 모니터링
                                        </h3>
                                        <span className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                    </div>
                                    <div className="bg-slate-900 rounded-xl aspect-video mb-4 flex flex-col items-center justify-center border border-slate-800 shadow-inner relative overflow-hidden group/cctv">
                                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                                        <div className="flex flex-col items-center gap-3 relative z-10 text-center px-4 transform transition-all group-hover/cctv:scale-105">
                                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-1 border border-white/5 backdrop-blur-md">
                                                <Activity size={24} className="text-blue-400" />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase opacity-70">ADT CAPS VIEWGUARD</p>
                                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed px-2">보안 정책으로 인해 외부 창에서<br />실시간 영상을 확인하실 수 있습니다.</p>
                                        </div>
                                    </div>
                                    <a
                                        href={data.cctvUrl || 'https://capslive.co.kr'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-500/20 flex items-center justify-center gap-2 group/btn active:scale-95"
                                    >
                                        <span>실시간 영상 연결</span>
                                        <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </a>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in shadow-xl shadow-gray-200/20">
                                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center uppercase tracking-tight gap-2">
                                    <CheckCircle className="text-green-500" size={20} />
                                    <span>안전부적합 조치</span>
                                </h3>
                                <div className="space-y-4">
                                    <div onClick={() => { setSelectedIssueType('new'); setShowIssueModal(true); }} className="flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100/50 cursor-pointer hover:bg-red-50 transition-all hover:scale-[1.02] shadow-sm shadow-red-500/5 group">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 mr-3 border border-red-200/50 font-black italic">!</div>
                                            <div>
                                                <span className="text-xs font-black text-red-900/40 uppercase tracking-widest block leading-none mb-1">상태: 신규</span>
                                                <span className="text-sm font-black text-gray-700 leading-none block">신규 발견 (접수 대기)</span>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-black text-red-600 tracking-tighter">{data.issueCounts.new}</span>
                                    </div>
                                    <div onClick={() => { setSelectedIssueType('processing'); setShowIssueModal(true); }} className="flex items-center justify-between p-4 bg-yellow-50/50 rounded-2xl border border-yellow-100/50 cursor-pointer hover:bg-yellow-50 transition-all hover:scale-[1.02] shadow-sm shadow-yellow-500/5 group">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600 mr-3 border border-yellow-200/50"><Activity size={18} /></div>
                                            <div>
                                                <span className="text-xs font-black text-yellow-900/40 uppercase tracking-widest block leading-none mb-1">상태: 진행 중</span>
                                                <span className="text-sm font-black text-gray-700 leading-none block">조치 중 (진행 현황)</span>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-black text-yellow-600 tracking-tighter">{data.issueCounts.processing}</span>
                                    </div>
                                    <div onClick={() => { setSelectedIssueType('done'); setShowIssueModal(true); }} className="flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-green-100/50 cursor-pointer hover:bg-green-50 transition-all hover:scale-[1.02] shadow-sm shadow-green-500/5 group">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 mr-3 border border-green-200/50"><CheckCircle size={18} /></div>
                                            <div>
                                                <span className="text-xs font-black text-green-900/40 uppercase tracking-widest block leading-none mb-1">상태: 조치 완료</span>
                                                <span className="text-sm font-black text-gray-700 leading-none block">조치 완료 내역</span>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-black text-green-600 tracking-tighter">{data.issueCounts.done}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-24 h-1 bg-red-800"></div>
                                <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight">반입점검 및 알림</h3>
                                <div className="grid grid-cols-1 gap-3 mb-6">
                                    <button onClick={() => openInspectionModal('건설장비')} className="group/btn py-4 bg-gray-50 text-gray-700 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-700 transition-all border border-gray-100 flex items-center justify-center gap-3 relative overflow-hidden">
                                        <Truck size={18} className="transition-transform group-hover/btn:-translate-x-1" />
                                        <span>건설장비 반입</span>
                                        <ArrowRight size={12} className="opacity-0 group-hover/btn:opacity-100 transition-all" />
                                    </button>
                                    <button onClick={() => openInspectionModal('기계기구')} className="group/btn py-4 bg-gray-50 text-gray-700 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-50 hover:text-orange-700 transition-all border border-gray-100 flex items-center justify-center gap-3">
                                        <Tool size={18} className="transition-transform group-hover/btn:-translate-x-1" />
                                        <span>기계/기구 점검</span>
                                        <ArrowRight size={12} className="opacity-0 group-hover/btn:opacity-100 transition-all" />
                                    </button>
                                    <button onClick={() => openInspectionModal('유해화학물질')} className="group/btn py-4 bg-gray-50 text-gray-700 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-purple-50 hover:text-purple-700 transition-all border border-gray-100 flex items-center justify-center gap-3">
                                        <FlaskConical size={18} className="transition-transform group-hover/btn:-translate-x-1" />
                                        <span>유해화학물질 반입</span>
                                        <ArrowRight size={12} className="opacity-0 group-hover/btn:opacity-100 transition-all" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 italic">최근 점검 이력</p>
                                    {data.inspectionLog.length > 0 ? data.inspectionLog.slice(0, 5).map(log => (
                                        <div key={log.id} className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100 transition-all hover:bg-white group/log active:scale-[0.98]">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-gray-900 tracking-tight group-hover/log:text-blue-600 transition-colors uppercase">{log.item}</span>
                                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-2">
                                                    <span>{log.type}</span>
                                                    <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                                                    <span>{log.date}</span>
                                                </span>
                                            </div>
                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${log.status === '합격' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {log.status === '합격' ? '합격' : '불합격'}
                                            </span>
                                        </div>
                                    )) : (
                                        <div className="py-6 text-center text-gray-300 font-bold italic text-xs">최근 점검 이력이 없습니다.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 통합 네트워크 공정 및 EVM 대시보드 모듈 섹션 */}
                    <div className="mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        <NetworkScheduleDashboard projectId={siteId} />
                    </div>
                </main>

                <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-100 mt-20 relative flex flex-col md:flex-row justify-between items-center opacity-60 hover:opacity-100 transition-all duration-700">
                    <div className="flex items-center mb-8 md:mb-0 transform hover:scale-105 transition-transform duration-500 group">
                        <NamhwaSymbol className="h-10 w-auto object-contain mr-4 text-gray-400 grayscale group-hover:grayscale-0 transition-all duration-500" />
                        <div>
                            <p className="text-gray-800 text-sm font-black tracking-tight uppercase leading-none mb-1">남화토건(주)</p>
                            <p className="text-gray-400 text-[10px] font-bold tracking-[0.3em] uppercase leading-none opacity-80">안전보건팀</p>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <button onClick={handlePrintAndSave} className="flex items-center bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-95 whitespace-nowrap group">
                            <Printer size={16} className="mr-2.5 group-hover:rotate-12 transition-transform" />
                            <span>리포트 인쇄</span>
                        </button>
                        <a href={currentSiteInfo.link} target="_blank" className="flex items-center bg-white text-gray-900 border border-gray-200 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-lg hover:-translate-y-1 active:translate-y-0 active:scale-95 whitespace-nowrap group">
                            <LinkIcon size={16} className="mr-2.5 group-hover:scale-110 transition-transform" />
                            <span>예정공정표</span>
                        </a>
                    </div>
                </footer>

                {/* Modals */}
                <Modals.SettingsModal show={showSettingsModal} onClose={() => setShowSettingsModal(false)} onSave={handleSaveSettings} startDate={data.startDate} targetDays={data.targetDays} cctvUrl={data.cctvUrl} />
                <Modals.WorkerModal show={showWorkerModal} onClose={() => setShowWorkerModal(false)} workerList={data.workerList} onChange={handleWorkerChangeByIndex} onAdd={handleAddWorker} onDelete={handleDeleteWorker} onSave={saveWorkersToDB} />
                <Modals.IssueModal show={showIssueModal} onClose={() => setShowIssueModal(false)} issues={data.issueList} type={selectedIssueType} onAdd={handleAddIssue} onChange={handleIssueChange} onImageUpload={handleIssueImageUpload} onSave={saveIssueChanges} onStatusChange={changeIssueStatus} onArchive={archiveIssue} />
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
