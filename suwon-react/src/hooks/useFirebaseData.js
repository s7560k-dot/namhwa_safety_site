/**
 * @file useFirebaseData.js
 * @description Firebase 데이터 연동 커스텀 훅
 *
 * 역할:
 * - 기존 바닐라 JS의 `globalData` 객체를 React `useState`로 대체합니다.
 * - 4개의 `onSnapshot` 리스너를 `useEffect` 안에서 등록하고,
 *   컴포넌트 언마운트 시 반드시 구독을 해제(unsubscribe)하여 메모리 누수를 방지합니다.
 * - Firebase 쓰기 함수들을 훅에서 함께 반환합니다.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { db, storage } from "../firebase/firebase";
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
  limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ────────────────────────────────────────────────────
// 상수 정의
// ────────────────────────────────────────────────────

/** Firebase 현장 문서 ID */
const SITE_ID = "siteB";

/** 로딩 타임아웃 (ms) */
const LOADING_TIMEOUT_MS = 10_000;

/** activityLogs 최대 조회 건수 */
const ACTIVITY_LOG_LIMIT = 50;

/** inspectionLogs 최대 조회 건수 */
const INSPECTION_LOG_LIMIT = 20;

/**
 * globalData 초기 구조 생성 함수
 * KPI 16개월 데이터를 초기화합니다.
 * @returns {object} 초기 globalData 객체
 */
const createInitialData = () => {
  const kpiData = Array.from({ length: 16 }, (_, i) => ({
    month: i + 1,
    process: "",
    risk: "",
    activity: "",
    kpi: "",
    docs: "",
  }));

  return {
    headerInfo: {
      // 공사 기간은 고정값으로 렌더링하므로 period는 UI에서 직접 표시
      period: "2025.10.16 ~ 2027.02.16",
      scale: "지하1층 ~ 지상4층 (노유자시설)",
      goal: "중대재해 ZERO / 무재해 1000일 달성",
    },
    prepConst: {},
    prepSafety: {},
    comments: {},
    taskDetails: {},
    kpiData,
    safetyData: [
      { title: "위험성평가", monthlyTags: { 1: ["최초평가|blue"] } },
      { title: "안전교육", monthlyTags: { 1: ["채용시|green"] } },
      { title: "협의체/회의", monthlyTags: { 1: ["협의체|purple"] } },
      { title: "법적점검", monthlyTags: { 1: ["합동|orange"] } },
      { title: "성과측정", monthlyTags: { 1: ["이행점검|pink"] } },
    ],
    activityLog: [],
    inspectionLogs: [],
  };
};

// ────────────────────────────────────────────────────
// 커스텀 훅
// ────────────────────────────────────────────────────

/**
 * Firebase 데이터를 구독하고 전역 상태를 관리하는 커스텀 훅
 * @returns {{ data, isLoading, actions }} 상태 및 쓰기 액션 묶음
 */
export const useFirebaseData = () => {
  const [data, setData] = useState(createInitialData);
  const [isLoading, setIsLoading] = useState(true);

  // 무한루프 방지: 문서가 없을 때 최초 1회만 setDoc을 실행
  const isInitializingRef = useRef(false);

  // Firestore 문서 참조 (의존성 배열에 넣지 않도록 ref로 관리)
  const docRef = useRef(doc(db, "sites", SITE_ID));

  useEffect(() => {
    // ── 로딩 타임아웃: 10초 후에도 로딩 중이면 기본 데이터로 렌더 ──
    const timeoutId = setTimeout(() => {
      console.warn(`⚠️ Firebase 로딩 타임아웃: ${LOADING_TIMEOUT_MS / 1000}초 경과`);
      setIsLoading(false);
    }, LOADING_TIMEOUT_MS);

    // ── (1) 메인 문서 리스너 ──
    const unsubMain = onSnapshot(
      docRef.current,
      (docSnap) => {
        clearTimeout(timeoutId);

        if (docSnap.exists()) {
          const remote = docSnap.data();
          // 원격 데이터를 로컬 초기값과 병합 (원격 데이터 우선)
          setData((prev) => {
            const merged = { ...prev, ...remote };

            // KPI 데이터 누락 인덱스 보완
            if (merged.kpiData) {
              merged.kpiData = Array.from({ length: 16 }, (_, i) =>
                merged.kpiData[i] ?? { month: i + 1, process: "", risk: "", activity: "", kpi: "", docs: "" }
              );
            }

            // 필수 필드 안전 처리
            if (!merged.prepConst) merged.prepConst = {};
            if (!merged.prepSafety) merged.prepSafety = {};

            return merged;
          });
        } else {
          // 문서 없음: 초기 데이터로 1회만 생성
          if (!isInitializingRef.current) {
            isInitializingRef.current = true;
            console.warn("⚠️ Firestore 문서 없음 — 기본 데이터로 초기화합니다.");
            setDoc(docRef.current, createInitialData())
              .catch((err) => console.error("초기화 실패:", err));
          }
        }

        setIsLoading(false);
      },
      (error) => {
        console.error("❌ Firestore 메인 문서 오류:", error);
        setIsLoading(false);
      }
    );

    // ── (2) taskDetails 서브컬렉션 리스너 ──
    const detailsRef = collection(db, "sites", SITE_ID, "taskDetails");
    const unsubDetails = onSnapshot(detailsRef, (snapshot) => {
      const taskDetails = {};
      snapshot.forEach((docItem) => {
        taskDetails[docItem.id] = docItem.data();
      });
      setData((prev) => ({ ...prev, taskDetails }));
    });

    // ── (3) activityLogs 서브컬렉션 리스너 ──
    const logsRef = collection(db, "sites", SITE_ID, "activityLogs");
    const logsQuery = query(
      logsRef,
      orderBy("lastUpdated", "desc"),
      limit(ACTIVITY_LOG_LIMIT)
    );
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const activityLog = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setData((prev) => ({ ...prev, activityLog }));
    });

    // ── (4) inspectionLogs 서브컬렉션 리스너 ──
    const inspectRef = collection(db, "sites", SITE_ID, "inspectionLogs");
    const inspectQuery = query(
      inspectRef,
      orderBy("date", "desc"),
      limit(INSPECTION_LOG_LIMIT)
    );
    const unsubInspect = onSnapshot(inspectQuery, (snapshot) => {
      const inspectionLogs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setData((prev) => ({ ...prev, inspectionLogs }));
    });

    // ── 언마운트 시 모든 구독 해제 (메모리 누수 방지) ──
    return () => {
      clearTimeout(timeoutId);
      unsubMain();
      unsubDetails();
      unsubLogs();
      unsubInspect();
    };
  }, []); // 의존성 없음: 마운트 1회만 실행

  // ────────────────────────────────────────────────────
  // 쓰기 액션 (useCallback으로 참조 안정화)
  // ────────────────────────────────────────────────────

  /**
   * 헤더 정보(공사 규모, 안전 목표)를 Firebase에 저장합니다.
   * @param {{ scale: string, goal: string }} headerInfo
   */
  const updateHeaderInfo = useCallback(async (headerInfo) => {
    setData((prev) => ({ ...prev, headerInfo: { ...prev.headerInfo, ...headerInfo } }));
    await updateDoc(docRef.current, { headerInfo });
  }, []);

  /**
   * 착공준비 셀 값을 Firebase에 저장합니다.
   * @param {'const' | 'safety'} type
   * @param {number} index
   * @param {string} value
   */
  const updatePrep = useCallback(async (type, index, value) => {
    setData((prev) => {
      const key = type === "const" ? "prepConst" : "prepSafety";
      return { ...prev, [key]: { ...prev[key], [index]: value } };
    });
    const update =
      type === "const"
        ? { [`prepConst.${index}`]: value }
        : { [`prepSafety.${index}`]: value };
    await updateDoc(docRef.current, update);
  }, []);

  /**
   * KPI 테이블 셀 값을 Firebase에 저장합니다.
   * @param {number} index - 0-based 월 인덱스
   * @param {string} key   - 'process' | 'risk' | 'activity' | 'kpi' | 'docs'
   * @param {string} value
   */
  const updateKpi = useCallback(async (index, key, value) => {
    setData((prev) => {
      const kpiData = prev.kpiData.map((row, i) =>
        i === index ? { ...row, [key]: value } : row
      );
      return { ...prev, kpiData };
    });
    await updateDoc(docRef.current, { [`kpiData.${index}.${key}`]: value });
  }, []);

  /**
   * 공정별 상세 활동을 Firestore taskDetails 서브컬렉션에 저장합니다.
   * 파일이 있으면 Firebase Storage 업로드 후 URL을 저장합니다.
   *
   * @param {number} taskIndex - constructionData 배열 인덱스
   * @param {{ workDate, risk, kpi, activity, imageData }} taskData
   * @param {File|null} selectedFile - 첨부 파일 (없으면 null)
   * @returns {Promise<void>}
   */
  const saveTaskDetails = useCallback(async (taskIndex, taskData, selectedFile) => {
    let finalImageUrl = taskData.imageData;

    // 새 파일이 선택된 경우 Storage에 업로드
    if (selectedFile) {
      const storageRef = ref(
        storage,
        `site_attachments/${SITE_ID}/${Date.now()}_${selectedFile.name}`
      );
      await uploadBytes(storageRef, selectedFile);
      finalImageUrl = await getDownloadURL(storageRef);
    }

    const finalData = {
      ...taskData,
      imageData: finalImageUrl,
      lastUpdated: new Date().toISOString(),
    };

    const taskDocRef = doc(db, "sites", SITE_ID, "taskDetails", String(taskIndex));
    await setDoc(taskDocRef, finalData, { merge: true });
  }, []);

  /**
   * taskDetails 서브컬렉션에서 특정 공정 활동을 삭제합니다.
   * @param {string|number} taskIndex
   */
  const deleteTaskDetail = useCallback(async (taskIndex) => {
    const taskDocRef = doc(db, "sites", SITE_ID, "taskDetails", String(taskIndex));
    await deleteDoc(taskDocRef);
  }, []);

  /**
   * 댓글(comment)을 taskDetails 문서의 comments 배열에 추가합니다.
   * @param {string|number} taskIndex
   * @param {{ name: string, content: string }} comment
   */
  const addComment = useCallback(async (taskIndex, comment) => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const newComment = { ...comment, date: dateStr };

    setData((prev) => {
      const existing = prev.comments?.[taskIndex] ?? [];
      return {
        ...prev,
        comments: { ...prev.comments, [taskIndex]: [...existing, newComment] },
      };
    });

    const taskDocRef = doc(db, "sites", SITE_ID, "taskDetails", String(taskIndex));
    // 최신 localData에서 comments 가져오기 위해 setDoc merge 사용
    // addComment 후 data state에 반영된 값은 다음 렌더에서 확인 가능
    // 방어적으로 setDoc(merge) 사용
    setData((prev) => {
      const updatedComments = prev.comments?.[taskIndex] ?? [];
      setDoc(taskDocRef, { comments: updatedComments }, { merge: true })
        .catch((err) => console.error("댓글 저장 실패:", err));
      return prev;
    });
  }, []);

  /**
   * 댓글을 삭제합니다.
   * @param {string|number} taskIndex
   * @param {number} commentIdx - 댓글 배열 인덱스
   * @param {string[]} updatedComments - 삭제 후 최신 comments 배열
   */
  const deleteComment = useCallback(async (taskIndex, commentIdx, updatedComments) => {
    setData((prev) => ({
      ...prev,
      comments: { ...prev.comments, [taskIndex]: updatedComments },
    }));
    const taskDocRef = doc(db, "sites", SITE_ID, "taskDetails", String(taskIndex));
    await setDoc(taskDocRef, { comments: updatedComments }, { merge: true });
  }, []);

  /**
   * 안전 태그를 수정하여 Firebase에 저장합니다.
   * @param {number} rowIndex - safetyData 배열 인덱스
   * @param {number} month    - 1-based 월
   * @param {string[]} tags   - 새로운 태그 배열 (예: ["최초평가|blue"])
   */
  const saveSafetyTags = useCallback(async (rowIndex, month, tags) => {
    setData((prev) => {
      const safetyData = prev.safetyData.map((row, i) => {
        if (i !== rowIndex) return row;
        return {
          ...row,
          monthlyTags: { ...row.monthlyTags, [month]: tags },
        };
      });
      return { ...prev, safetyData };
    });

    // safetyData 전체를 업데이트 (Firestore 배열 내부 중첩 업데이트는 전체 덮어쓰기가 안전)
    setData((prev) => {
      updateDoc(docRef.current, { safetyData: prev.safetyData })
        .catch((err) => console.error("태그 저장 실패:", err));
      return prev;
    });
  }, []);

  /**
   * 반입 점검 항목을 inspectionLogs 컬렉션에 저장합니다.
   * @param {{ type, item, result, desc }} inspectionData
   * @param {File|null} file - 첨부 이미지
   */
  const saveInspection = useCallback(async (inspectionData, file) => {
    let imageUrl = null;
    if (file) {
      const storageRef = ref(storage, `site_inspections/${SITE_ID}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
    }

    const logData = {
      ...inspectionData,
      imageUrl,
      date: new Date().toLocaleString("ko-KR"),
      timestamp: Date.now(),
    };

    const inspectRef = collection(db, "sites", SITE_ID, "inspectionLogs");
    await addDoc(inspectRef, logData);
  }, []);

  /**
   * 반입 점검 로그 항목을 삭제합니다.
   * @param {string} logId - Firestore 문서 ID
   */
  const deleteInspectionLog = useCallback(async (logId) => {
    const logDocRef = doc(db, "sites", SITE_ID, "inspectionLogs", logId);
    await deleteDoc(logDocRef);
  }, []);

  return {
    data,
    isLoading,
    actions: {
      updateHeaderInfo,
      updatePrep,
      updateKpi,
      saveTaskDetails,
      deleteTaskDetail,
      addComment,
      deleteComment,
      saveSafetyTags,
      saveInspection,
      deleteInspectionLog,
    },
  };
};
