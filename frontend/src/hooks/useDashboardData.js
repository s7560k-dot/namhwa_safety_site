import { useState, useEffect } from 'react';
import { db, storage } from '../firebase';

export const useDashboardData = (siteId) => {
    // [FIX] 강제로 siteB 데이터 로드 (사용자 요청)
    siteId = 'siteB';
    const [workerList, setWorkerList] = useState([]);
    const [riskWorks, setRiskWorks] = useState([]);
    const [noticeData, setNoticeData] = useState([]);
    const [issueList, setIssueList] = useState([]);
    const [inspectionLog, setInspectionLog] = useState([]);

    const [startDate, setStartDate] = useState("");
    const [targetDays, setTargetDays] = useState(500);
    const [headerInfo, setHeaderInfo] = useState(null);
    const [kpiData, setKpiData] = useState([]);

    // [New Collections]
    const [approvals, setApprovals] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [taskDetails, setTaskDetails] = useState([]);

    const [notificationCount, setNotificationCount] = useState(0);
    const [notifications, setNotifications] = useState([]);

    // Keep track of counts for summary
    const [issueCounts, setIssueCounts] = useState({ new: 0, processing: 0, done: 0 });

    useEffect(() => {
        if (!siteId) return;

        const siteRef = db.collection('sites').doc(siteId);

        // 1. Site Info & KPI Data (Document Field)
        const unsubSite = siteRef.onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                setStartDate(data.startDate || "2024-01-01");
                setTargetDays(data.targetDays || 500);
                setHeaderInfo(data.headerInfo || null);
                setKpiData(data.kpiData || []);
            }
        }, error => {
            // console.error("Error fetching site doc:", error); // Suppressed for dev
        });

        // 2. Risk Works
        const unsubRisk = siteRef.collection('riskWorks')
            .onSnapshot(snapshot => {
                setRiskWorks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, error => {
                console.warn("Error fetching riskWorks (likely permission issue, ignoring for dev bypass):", error);
            });

        // 3. Workers
        const unsubWorker = siteRef.collection('workers')
            .onSnapshot(snapshot => {
                setWorkerList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, error => console.warn("Error fetching workers:", error));

        // 4. Notices
        const unsubNotice = siteRef.collection('notices').orderBy('date', 'desc')
            .onSnapshot(snapshot => {
                setNoticeData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, error => console.warn("Error fetching notices:", error));

        // 5. Issues
        const unsubIssue = siteRef.collection('issues')
            .onSnapshot(snapshot => {
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setIssueList(list);
                // Derived counts would be calculated here or in render
            }, error => console.warn("Error fetching issues:", error));

        // 6. Inspections [FIXED: inspectionLogs -> inspections]
        const unsubInsp = siteRef.collection('inspections').orderBy('date', 'desc')
            .onSnapshot(snapshot => {
                setInspectionLog(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, error => console.warn("Error fetching inspections:", error));

        // 7. Approvals [New]
        const unsubAppr = siteRef.collection('approvals')
            .onSnapshot(snapshot => {
                setApprovals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, error => console.warn("Error fetching approvals:", error));

        // 8. Activity Logs [New]
        const unsubActivity = siteRef.collection('activityLogs')
            .onSnapshot(snapshot => {
                setActivityLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, error => console.warn("Error fetching activityLogs:", error));

        // 9. Task Details [New]
        const unsubTask = siteRef.collection('taskDetails')
            .onSnapshot(snapshot => {
                setTaskDetails(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, error => console.warn("Error fetching taskDetails:", error));


        return () => {
            unsubSite();
            unsubRisk();
            unsubWorker();
            unsubNotice();
            unsubIssue();
            unsubInsp();
            unsubAppr();
            unsubActivity();
            unsubTask();
        };
    }, [siteId]);

    // [New] Notification Logic
    useEffect(() => {
        const newNotifications = [];

        // 1. New Notices (within 7 days)
        const now = new Date();
        noticeData.forEach(notice => {
            const noticeDate = new Date(notice.date);
            const diffTime = Math.abs(now - noticeDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) {
                newNotifications.push({
                    id: `notice_${notice.id}`,
                    type: '공지',
                    message: notice.title,
                    date: notice.date,
                    link: '#'
                });
            }
        });

        // 2. New Issues (Status: new)
        issueList.forEach(issue => {
            if (issue.status === 'new') {
                newNotifications.push({
                    id: `issue_${issue.id}`,
                    type: '부적합',
                    message: `신규 부적합 조치 요청 (${issue.loc || '위치 미지정'})`,
                    date: new Date(issue.createdAt).toISOString().slice(0, 10),
                    link: '#'
                });
            }
        });

        // 3. Pending Approvals
        approvals.forEach(appr => {
            if (appr.status === 'pending' || appr.status === '대기') {
                newNotifications.push({
                    id: `appr_${appr.id}`,
                    type: '결재',
                    message: `결재 대기: ${appr.title}`,
                    date: appr.date || new Date().toISOString().slice(0, 10),
                    link: '#'
                });
            }
        });

        // Sort by date desc
        newNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));

        setNotifications(newNotifications);
        setNotificationCount(newNotifications.length);

    }, [noticeData, issueList, approvals]);

    // Derived state: Accident Free Days
    const calculateAccidentFreeDays = () => {
        if (!startDate) return 0;
        const start = new Date(startDate);
        const today = new Date();
        const diffTime = Math.abs(today - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return {
        siteId,
        startDate, setStartDate,
        targetDays, setTargetDays,
        headerInfo, setHeaderInfo,
        kpiData, setKpiData,
        workerList, setWorkerList,
        riskWorks, setRiskWorks,
        noticeData, setNoticeData,
        issueList, setIssueList,
        inspectionLog, setInspectionLog,
        approvals,      // [New]
        activityLogs,   // [New]
        taskDetails,     // [New]
        notificationCount, setNotificationCount,
        notifications, setNotifications,
        issueCounts,
        accidentFreeDays: calculateAccidentFreeDays()
    };
};
