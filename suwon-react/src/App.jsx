/**
 * @file App.jsx
 * @description 최상위 컴포넌트 (완성본)
 *
 * 역할:
 * 1. useFirebaseData 훅에서 전역 상태(data)와 액션(actions)을 받습니다.
 * 2. 모달 open/close 상태를 useState로 관리합니다.
 * 3. isLoading 상태에 따라 로딩 스피너를 렌더합니다.
 * 4. 모든 컴포넌트를 props로 연결하여 조립합니다.
 */

import React, { useState, useCallback } from "react";
import { useFirebaseData } from "./hooks/useFirebaseData";
import { CONSTRUCTION_DATA } from "./constants";

import ProcessChart from "./components/ProcessChart";
import KpiTable from "./components/KpiTable";
import ActivityLog from "./components/ActivityLog";
import InspectionLog from "./components/InspectionLog";
import TaskDetailModal from "./components/modals/TaskDetailModal";
import SafetyTagModal from "./components/modals/SafetyTagModal";
import InspectionModal from "./components/modals/InspectionModal";

// CONSTRUCTION_DATA는 src/constants.js에서 import됩니다.

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
  // ── Firebase 전역 상태 및 액션 ──
  const { data, isLoading, actions } = useFirebaseData();

  // ── 모달 상태 ──
  const [modals, setModals] = useState(INITIAL_MODAL_STATE);

  // ── 활동 로그 검색어 ──
  const [logSearchText, setLogSearchText] = useState("");

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

  return (
    <>
      {/* ── 로딩 스피너 ── */}
      {isLoading && (
        <div id="loading">
          <div className="spinner" />
          <div>데이터 동기화 중...</div>
        </div>
      )}

      {/* ── 헤더 (프로젝트 정보) ── */}
      <div className="header-panel">
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          수원 노유자시설 신축공사{" "}
          <span style={{ fontSize: "12px", color: "#ccc", fontWeight: "normal" }}>
            (v2025.10.16)
          </span>
        </h2>
        <div className="info-container">
          {/* 공사 기간: 고정값 (편집 불가) */}
          <div className="info-box">
            <div className="info-title">📅 공사 기간</div>
            <div className="info-content">
              2025.10.16 ~ 2027.02.16
              <br />
              <span style={{ fontSize: "11px", color: "#888" }}>
                (실착공일로부터 16개월)
              </span>
            </div>
          </div>
          {/* 공사 규모: 편집 가능 */}
          <div className="info-box">
            <div className="info-title">🏢 공사 규모</div>
            <div
              className="info-content"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) =>
                actions.updateHeaderInfo({ scale: e.currentTarget.textContent.trim() })
              }
            >
              {data.headerInfo.scale}
            </div>
          </div>
          {/* 안전 목표: 편집 가능 */}
          <div className="info-box pink">
            <div className="info-title">🏆 안전 목표</div>
            <div
              className="info-content"
              style={{ color: "#d9534f", fontWeight: "bold" }}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) =>
                actions.updateHeaderInfo({ goal: e.currentTarget.textContent.trim() })
              }
            >
              {data.headerInfo.goal}
            </div>
          </div>
        </div>
      </div>

      {/* ── 공정 차트 ── */}
      <ProcessChart
        constructionData={CONSTRUCTION_DATA}
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
        onDelete={actions.deleteInspectionLog}
      />

      {/* ── 실시간 안전활동 현황 ── */}
      <ActivityLog
        taskDetails={data.taskDetails}
        constructionData={CONSTRUCTION_DATA}
        searchText={logSearchText}
        onSearchChange={setLogSearchText}
        onItemClick={openTaskDetailModal}
        onDelete={actions.deleteTaskDetail}
      />

      {/* ────── 모달들 (조건부 렌더) ────── */}

      {modals.taskDetail.isOpen && (
        <TaskDetailModal
          taskIndex={modals.taskDetail.taskIndex}
          constructionData={CONSTRUCTION_DATA}
          taskDetails={data.taskDetails}
          comments={data.comments}
          onClose={closeTaskDetailModal}
          onSave={actions.saveTaskDetails}
          onAddComment={actions.addComment}
          onDeleteComment={actions.deleteComment}
        />
      )}

      {modals.safetyTag.isOpen && (
        <SafetyTagModal
          rowIndex={modals.safetyTag.rowIndex}
          month={modals.safetyTag.month}
          safetyData={data.safetyData}
          onClose={closeSafetyTagModal}
          onSave={actions.saveSafetyTags}
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
  );
};

export default App;
