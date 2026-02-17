import { useState, useEffect } from 'react';
import { db, storage } from '../firebase';

export const useDashboardData = (siteId) => {
    const [workerList, setWorkerList] = useState([]);
    const [riskWorks, setRiskWorks] = useState([]);
    const [noticeData, setNoticeData] = useState([]);
    const [issueList, setIssueList] = useState([]);
    const [inspectionLog, setInspectionLog] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [targetDays, setTargetDays] = useState(365);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notifications, setNotifications] = useState([]);

    // Keep track of counts for summary
    const [issueCounts, setIssueCounts] = useState({ new: 0, processing: 0, done: 0 });

    useEffect(() => {
        if (!siteId) return;

        // 1. Load Settings
        const settingsUnsub = db.collection('sites').doc(siteId).onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                setStartDate(data.startDate || new Date().toISOString().slice(0, 10));
                setTargetDays(data.targetDays || 365);
            }
        });

        // 2. Load Worker List
        const workerUnsub = db.collection('sites').doc(siteId).collection('workers').onSnapshot(snapshot => {
            setWorkerList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // 3. Load Risk Works (Today's only would be ideal, but for now load all and filter in UI or query)
        // Simplified for migration: Load all sorted by createdAt desc
        const riskUnsub = db.collection('sites').doc(siteId).collection('risk_works')
            .orderBy('createdAt', 'desc').limit(20) // Limit for performance
            .onSnapshot(snapshot => {
                setRiskWorks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });

        // 4. Load Notices
        const noticeUnsub = db.collection('sites').doc(siteId).collection('notices')
            .orderBy('createdAt', 'desc').limit(10)
            .onSnapshot(snapshot => {
                setNoticeData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });

        // 5. Load Issues
        const issueUnsub = db.collection('sites').doc(siteId).collection('issues')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const issues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setIssueList(issues);

                // Calculate counts
                const counts = { new: 0, processing: 0, done: 0 };
                issues.forEach(issue => {
                    if (issue.status === 'new') counts.new++;
                    else if (issue.status === 'processing') counts.processing++;
                    else if (issue.status === 'done') counts.done++;
                });
                setIssueCounts(counts);
            });

        // 6. Load Inspections
        const inspectionUnsub = db.collection('sites').doc(siteId).collection('inspections')
            .orderBy('createdAt', 'desc').limit(20)
            .onSnapshot(snapshot => {
                setInspectionLog(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });

        return () => {
            settingsUnsub();
            workerUnsub();
            riskUnsub();
            noticeUnsub();
            issueUnsub();
            inspectionUnsub();
        };
    }, [siteId]);

    // Derived state: Accident Free Days
    const calculateAccidentFreeDays = () => {
        if (!startDate) return 0;
        const start = new Date(startDate);
        const today = new Date();
        const diffTime = Math.abs(today - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return {
        workerList, setWorkerList,
        riskWorks, setRiskWorks,
        noticeData, setNoticeData,
        issueList, setIssueList,
        inspectionLog, setInspectionLog,
        startDate, setStartDate,
        targetDays, setTargetDays,
        notificationCount, setNotificationCount,
        notifications, setNotifications,
        issueCounts,
        accidentFreeDays: calculateAccidentFreeDays()
    };
};
