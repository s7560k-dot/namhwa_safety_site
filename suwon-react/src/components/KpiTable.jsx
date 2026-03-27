/**
 * @file KpiTable.jsx
 * @description 월별 안전보건 KPI 테이블 컴포넌트
 *
 * 기존 renderKpiTable() 함수를 React 컴포넌트로 변환합니다.
 * contenteditable → 제어 컴포넌트 패턴으로 전환합니다.
 */

import React, { useState, useCallback } from "react";

// ────────────────────────────────────────────────────
// 편집 가능한 셀 (한글 입력 이슈 방지: 로컬 state 사용)
// ────────────────────────────────────────────────────

/**
 * @param {{
 *   value: string,
 *   className: string,
 *   onBlurSave: (value: string) => void,
 *   style?: React.CSSProperties
 * }} props
 */
const EditableCell = ({ value, className, onBlurSave, style }) => {
  const [localValue, setLocalValue] = useState(value ?? "");

  const handleBlur = useCallback(() => {
    onBlurSave(localValue);
  }, [localValue, onBlurSave]);

  return (
    <td
      className={`kpi-td editable ${className}`}
      contentEditable
      suppressContentEditableWarning
      style={style}
      onInput={(e) => setLocalValue(e.currentTarget.textContent)}
      onBlur={handleBlur}
    >
      {value}
    </td>
  );
};

// ────────────────────────────────────────────────────
// KpiTable 메인 컴포넌트
// ────────────────────────────────────────────────────

/**
 * @param {{
 *   kpiData: Array<{ month, process, risk, activity, kpi, docs }>,
 *   onUpdate: (index: number, key: string, value: string) => Promise<void>,
 * }} props
 */
const KpiTable = ({ kpiData, onUpdate }) => {
  return (
    <div className="kpi-section">
      <div className="kpi-header-title">
        <span>📋 월별 안전보건 중점 활동 및 성과 목표 (KPI)</span>
        <span style={{ fontSize: "12px", fontWeight: "normal", opacity: 0.8 }}>
          ※ 모든 내용은 실시간으로 서버에 저장됩니다.
        </span>
      </div>

      <table className="kpi-table">
        <colgroup>
          <col style={{ width: "50px" }} />
          <col style={{ width: "150px" }} />
          <col style={{ width: "150px" }} />
          <col style={{ width: "auto" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "120px" }} />
        </colgroup>
        <thead>
          <tr>
            <th className="kpi-th">월</th>
            <th className="kpi-th">주요 공정</th>
            <th className="kpi-th">핵심 위험</th>
            <th className="kpi-th">안전보건 활동</th>
            <th className="kpi-th">성과 지표</th>
            <th className="kpi-th">법적 서류</th>
          </tr>
        </thead>
        <tbody>
          {kpiData.map((row, index) => (
            <tr key={index}>
              {/* 월 (읽기 전용) */}
              <td className="kpi-td center">
                <strong>{row.month}월</strong>
              </td>

              {/* 주요 공정 */}
              <EditableCell
                value={row.process ?? ""}
                className="center"
                onBlurSave={(val) => onUpdate(index, "process", val)}
              />

              {/* 핵심 위험 */}
              <EditableCell
                value={row.risk ?? ""}
                className="center text-red"
                onBlurSave={(val) => onUpdate(index, "risk", val)}
              />

              {/* 안전보건 활동 */}
              <EditableCell
                value={row.activity ?? ""}
                className=""
                style={{ whiteSpace: "pre-wrap" }}
                onBlurSave={(val) => onUpdate(index, "activity", val)}
              />

              {/* 성과 지표 */}
              <EditableCell
                value={row.kpi ?? ""}
                className="center text-blue"
                style={{ whiteSpace: "pre-wrap" }}
                onBlurSave={(val) => onUpdate(index, "kpi", val)}
              />

              {/* 법적 서류 */}
              <EditableCell
                value={row.docs ?? ""}
                className="center"
                style={{ whiteSpace: "pre-wrap" }}
                onBlurSave={(val) => onUpdate(index, "docs", val)}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default KpiTable;
