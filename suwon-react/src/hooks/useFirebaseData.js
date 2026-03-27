import { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { SITES } from '../constants';

/**
 * useFirebaseData hook
 * @param {string} siteId - 'siteA', 'siteB', or 'siteC'
 */
export function useFirebaseData(siteId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const siteConfig = SITES[siteId];
  if (!siteConfig) {
    throw new Error(`Invalid siteId: ${siteId}`);
  }

  useEffect(() => {
    if (!siteId) return;

    setLoading(true);
    const docRef = doc(db, "sites", siteId);

    // 1. Subscribe to main document
    const unsubMain = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const remoteData = docSnap.data();
        setData(prev => ({
          ...prev,
          ...remoteData,
          headerInfo: remoteData.headerInfo || siteConfig.header,
          kpiData: remoteData.kpiData || siteConfig.kpiData,
          safetyData: remoteData.safetyData || siteConfig.safetyRows.map(title => ({ title, monthlyTags: {} })),
          prepConst: remoteData.prepConst || {},
          prepSafety: remoteData.prepSafety || {},
          comments: remoteData.comments || {},
        }));
      } else {
        // Initialize with default values if document doesn't exist
        const initialData = {
          headerInfo: siteConfig.header,
          kpiData: siteConfig.kpiData,
          safetyData: siteConfig.safetyRows.map(title => ({ title, monthlyTags: {} })),
          prepConst: {},
          prepSafety: {},
          comments: {},
        };
        setDoc(docRef, initialData, { merge: true });
        setData(initialData);
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setError(err);
      setLoading(false);
    });

    // 2. Activity Logs
    const logsRef = collection(db, "sites", siteId, "activityLogs");
    const qLogs = query(logsRef, orderBy("lastUpdated", "desc"), limit(50));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(prev => ({ ...prev, activityLog: logs }));
    });

    // 3. Task Details (Subcollection)
    const detailsRef = collection(db, "sites", siteId, "taskDetails");
    const unsubDetails = onSnapshot(detailsRef, (snapshot) => {
      const details = {};
      snapshot.forEach(doc => {
        details[doc.id] = doc.data();
      });
      setData(prev => ({ ...prev, taskDetails: details }));
    });

    // 4. Inspection Logs (New Feature for all sites)
    const inspectionRef = collection(db, "sites", siteId, "inspectionLogs");
    const qInspect = query(inspectionRef, orderBy("timestamp", "desc"), limit(20));
    const unsubInspect = onSnapshot(qInspect, (snapshot) => {
      const inspections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(prev => ({ ...prev, inspectionLogs: inspections }));
    });

    return () => {
      unsubMain();
      unsubLogs();
      unsubDetails();
      unsubInspect();
    };
  }, [siteId]);

  // --- Update Actions ---

  const updateHeader = async (headerInfo) => {
    const docRef = doc(db, "sites", siteId);
    await updateDoc(docRef, { headerInfo });
  };

  const updatePrep = async (type, index, value) => {
    const docRef = doc(db, "sites", siteId);
    const key = type === 'const' ? 'prepConst' : 'prepSafety';
    const currentPrep = data[key] || {};
    await updateDoc(docRef, { [key]: { ...currentPrep, [index]: value } });
  };

  const updateKpi = async (index, key, value) => {
    const docRef = doc(db, "sites", siteId);
    const newKpiData = [...data.kpiData];
    newKpiData[index] = { ...newKpiData[index], [key]: value };
    await updateDoc(docRef, { kpiData: newKpiData });
  };

  const saveTaskDetails = async (index, taskData, isNewLog = true) => {
    // 1. Update taskDetails (latest state for that task)
    const taskDocRef = doc(db, "sites", siteId, "taskDetails", String(index));
    await setDoc(taskDocRef, taskData, { merge: true });

    // 2. Add to activityLogs (history)
    if (isNewLog) {
      const logsCollectionRef = collection(db, "sites", siteId, "activityLogs");
      await addDoc(logsCollectionRef, { ...taskData, taskIndex: index });
    }
  };

  const saveSafetyChanges = async (rowIdx, month, tags) => {
    const docRef = doc(db, "sites", siteId);
    const newSafetyData = [...data.safetyData];
    if (!newSafetyData[rowIdx].monthlyTags) newSafetyData[rowIdx].monthlyTags = {};
    newSafetyData[rowIdx].monthlyTags[month] = tags;
    await updateDoc(docRef, { safetyData: newSafetyData });
  };

  const addComment = async (taskIndex, comment) => {
    const taskDocRef = doc(db, "sites", siteId, "taskDetails", String(taskIndex));
    // We update the comments field in the specific taskDetail document
    const currentComments = (data.taskDetails[taskIndex]?.comments) || [];
    await setDoc(taskDocRef, { comments: [...currentComments, comment] }, { merge: true });
  };

  const deleteLogItem = async (logId) => {
     const logDocRef = doc(db, "sites", siteId, "activityLogs", logId);
     await deleteDoc(logDocRef);
  };

  // --- Inspection Log Actions ---
  const saveInspection = async (logData) => {
    const inspectRef = collection(db, "sites", siteId, "inspectionLogs");
    await addDoc(inspectRef, logData);
  };

  const deleteInspection = async (logId) => {
    const logDocRef = doc(db, "sites", siteId, "inspectionLogs", logId);
    await deleteDoc(logDocRef);
  };

  return {
    data,
    loading,
    error,
    actions: {
      updateHeader,
      updatePrep,
      updateKpi,
      saveTaskDetails,
      saveSafetyChanges,
      addComment,
      deleteLogItem,
      saveInspection,
      deleteInspection
    }
  };
}
