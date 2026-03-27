/**
 * @file App.jsx
 * @description Multi-site aware App component with hostname detection
 */

import React, { useState, useCallback, useEffect } from "react";
import { useFirebaseData } from "./hooks/useFirebaseData";
import { SITES } from "./constants";

import ProcessChart from "./components/ProcessChart";
import KpiTable from "./components/KpiTable";
import ActivityLog from "./components/ActivityLog";
import InspectionLog from "./components/InspectionLog";
import TaskDetailModal from "./components/modals/TaskDetailModal";
import SafetyTagModal from "./components/modals/SafetyTagModal";
import InspectionModal from "./components/modals/InspectionModal";

// ────────────────────────────────────────────────────
// 모달 초기 상태
// ────────────────────────────────────────────────────

const INITIAL_MODAL_STATE = {
  taskDetail:  { isOpen: false, taskIndex: null },
  safetyTag:   { isOpen: false, rowIndex: null, month: null },
  inspection:  { isOpen: false, type: null },
};

// ────────────────────────────────────────────────────
// App 컴포넌트
// ────────────────────────────────────────────────────

const App = () => {
  // ── 현장 ID 인식 ──
  const getSiteId = () => {
    // 1. URL 쿼리 파라미터 우선 (디버깅/강제 전환용)
    const queryParams = new URLSearchParams(window.location.search);
    const queryId = queryParams.get("siteId");
    if (queryId && SITES[queryId]) return queryId;

    // 2. URL 경로 기반 감지 (e.g. /dashboard/siteC)
    const path = window.location.pathname;
    const pathSegments = path.split('/').filter(Boolean);
    // 경로의 마지막 세그먼트가 siteA, siteB, siteC 중 하나인지 확인
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment && SITES[lastSegment]) return lastSegment;

    // 3. 호스트네임 기반 감지 (배포 환경용)
    const host = window.location.hostname;
    if (host.includes("daegwang")) return "siteA";
    if (host.includes("pyeongtaek")) return "siteC";
    if (host.includes("suwon")) return "siteB";

    return "siteB"; // 기본값 (수원)
  };

  const siteId = getSiteId();
  const siteConfig = SITES[siteId] || SITES.siteB;

  // ── Firebase 전역 상태 및 액션 ──
  const { data, loading, actions } = useFirebaseData(siteId);

  // ── 모달 상태 ──
  const [modals, setModals] = useState(INITIAL_MODAL_STATE);

  // ── 활동 로그 검색어 ──
  const [logSearchText, setLogSearchText] = useState("");

  // ── CSS 변수 설정 (그리드 월 수 대응) ──
  useEffect(() => {
    document.documentElement.style.setProperty('--grid-months', siteConfig.months);
  }, [siteConfig.months]);

  // ────────────────────────────────────────────────────
  // 모달 핸들러
  // ────────────────────────────────────────────────────

  const openTaskDetailModal  = useCallback((taskIndex) =>
    setModals((p) => ({ ...p, taskDetail: { isOpen: true, taskIndex } })), []);

  const closeTaskDetailModal = useCallback(() =>
    setModals((p) => ({ ...p, taskDetail: INITIAL_MODAL_STATE.taskDetail })), []);

  const openSafetyTagModal   = useCallback((rowIndex, month) =>
    setModals((p) => ({ ...p, safetyTag: { isOpen: true, rowIndex, month } })), []);

  const closeSafetyTagModal  = useCallback(() =>
    setModals((p) => ({ ...p, safetyTag: INITIAL_MODAL_STATE.safetyTag })), []);

  const openInspectionModal  = useCallback((type) =>
    setModals((p) => ({ ...p, inspection: { isOpen: true, type } })), []);

  const closeInspectionModal = useCallback(() =>
    setModals((p) => ({ ...p, inspection: INITIAL_MODAL_STATE.inspection })), []);

  // ────────────────────────────────────────────────────
  // 렌더
  // ────────────────────────────────────────────────────

  if (!data && !loading) return <div>현장 데이터를 불러올 수 없습니다. 설정을 확인해 주세요.</div>;

  return (
    <>
      {/* ── 로딩 스피너 ── */}
      {loading && (
        <div id="loading">
          <div className="spinner" />
          <div>현장 데이터 동기화 중...</div>
        </div>
      )}

      {data && (
        <>
          {/* ── 헤더 (현장 정보) ── */}
          <div className="header-panel">
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
              {siteConfig.name} 안전보건 현황표{" "}
              <span style={{ fontSize: "12px", color: "#ccc", fontWeight: "normal" }}>
                (v2026.03.27)
              </span>
            </h2>
            <div className="info-container">
              {/* 공사 기간 */}
              <div className="info-box">
                <div className="info-title">📅 공사 기간</div>
                <div className="info-content" 
                  dangerouslySetInnerHTML={{ __html: siteConfig.header.period }}
                />
              </div>
              {/* 공사 규모 */}
              <div className="info-box">
                <div className="info-title">🏢 공사 규모</div>
                <div
                  className="info-content"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    actions.updateHeader({ ...data.headerInfo, scale: e.currentTarget.textContent.trim() })
                  }
                >
                  {data.headerInfo?.scale || siteConfig.header.scale}
                </div>
              </div>
              {/* 안전 목표 */}
              <div className="info-box pink">
                <div className="info-title">🏆 안전 목표</div>
                <div
                  className="info-content"
                  style={{ color: "#d9534f", fontWeight: "bold" }}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    actions.updateHeader({ ...data.headerInfo, goal: e.currentTarget.textContent.trim() })
                  }
                >
                  {data.headerInfo?.goal || siteConfig.header.goal}
                </div>
              </div>
            </div>
          </div>

          {/* ── 공정 차트 ── */}
          <ProcessChart
            months={siteConfig.months}
            constructionData={siteConfig.constructionData}
            prepConst={data.prepConst}
            prepSafety={data.prepSafety}
            safetyData={data.safetyData}
            onBarClick={openTaskDetailModal}
            onTagCellClick={openSafetyTagModal}
            onPrepUpdate={actions.updatePrep}
          />

          {/* ── KPI 테이블 ── */}
          <KpiTable
            kpiData={data.kpiData}
            onUpdate={actions.updateKpi}
          />

          {/* ── 반입 점검 섹션 ── */}
          <InspectionLog
            inspectionLogs={data.inspectionLogs}
            onOpenModal={openInspectionModal}
            onDelete={actions.deleteInspection}
          />

          {/* ── 실시간 안전활동 현황 ── */}
          <ActivityLog
            taskDetails={data.taskDetails}
            constructionData={siteConfig.constructionData}
            searchText={logSearchText}
            onSearchChange={setLogSearchText}
            onItemClick={openTaskDetailModal}
            onDelete={actions.deleteLogItem}
          />

          {/* ────── 모달들 (조건부 렌더) ────── */}

          {modals.taskDetail.isOpen && (
            <TaskDetailModal
              taskIndex={modals.taskDetail.taskIndex}
              constructionData={siteConfig.constructionData}
              taskDetails={data.taskDetails}
              onClose={closeTaskDetailModal}
              onSave={actions.saveTaskDetails}
              onAddComment={actions.addComment}
            />
          )}

          {modals.safetyTag.isOpen && (
            <SafetyTagModal
              rowIndex={modals.safetyTag.rowIndex}
              month={modals.safetyTag.month}
              safetyData={data.safetyData}
              onClose={closeSafetyTagModal}
              onSave={actions.saveSafetyChanges}
            />
          )}

          {modals.inspection.isOpen && (
            <InspectionModal
              type={modals.inspection.type}
              onClose={closeInspectionModal}
              onSave={actions.saveInspection}
            />
          )}
        </>
      )}
    </>
  );
};

export default App;
