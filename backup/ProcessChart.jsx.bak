/**
 * @file ProcessChart.jsx
 * @description 16개월 공정 그리드 및 안전 태그 그리드 컴포넌트
 *
 * 기존 renderGrid() 함수를 React 컴포넌트로 변환합니다.
 * - contenteditable 착공준비 셀 → 제어 컴포넌트 (onBlur 저장)
 * - 공정 막대 클릭 → onBarClick 콜백
 * - 안전 태그 셀 클릭 → onTagCellClick 콜백
 */

import React, { useState, useCallback } from "react";

// ────────────────────────────────────────────────────
// 착공준비 입력 셀 (개별 상태 관리로 한글 입력 이슈 방지)
// ────────────────────────────────────────────────────

/**
 * @param {{ value: string, onBlurSave: (value: string) => void }} props
 */
const PrepCell = ({ value, onBlurSave }) => {
  // 로컬 상태로 관리하여 Firebase와 입력 타이밍 분리
  const [localValue, setLocalValue] = useState(value ?? "");

  const handleBlur = useCallback(() => {
    onBlurSave(localValue);
  }, [localValue, onBlurSave]);

  return (
    <div
      className="cell prep-cell"
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => setLocalValue(e.currentTarget.textContent)}
      onBlur={handleBlur}
    >
      {value}
    </div>
  );
};

// ────────────────────────────────────────────────────
// 안전 태그 셀
// ────────────────────────────────────────────────────

/**
 * @param {{ tags: string[], rowIndex: number, month: number, onClick: () => void }} props
 */
const TagCell = ({ tags, rowIndex, month, onClick }) => (
  <div
    className="cell tag-container clickable-cell"
    onClick={onClick}
    title={`${month}월 일정 수정`}
  >
    {(tags ?? []).map((tagStr, i) => {
      const [text, color] = tagStr.split("|");
      return (
        <div key={i} className={`tag ${color}`}>
          {text}
        </div>
      );
    })}
  </div>
);

// ────────────────────────────────────────────────────
// ProcessChart 메인 컴포넌트
// ────────────────────────────────────────────────────

/** 헤더 행의 총 열 수 (구분 + 착공준비 + 16개월) */
const TOTAL_MONTHS = 16;

/**
 * @param {{
 *   constructionData: Array<{ name, start, duration, color, label }>,
 *   prepConst: Record<number, string>,
 *   prepSafety: Record<number, string>,
 *   safetyData: Array<{ title, monthlyTags }>,
 *   onBarClick: (index: number) => void,
 *   onTagCellClick: (rowIndex: number, month: number) => void,
 *   onPrepUpdate: (type: 'const' | 'safety', index: number, value: string) => void,
 * }} props
 */
const ProcessChart = ({
  constructionData,
  prepConst,
  prepSafety,
  safetyData,
  onBarClick,
  onTagCellClick,
  onPrepUpdate,
}) => {
  return (
    <div className="chart-wrapper">
      <div className="grid-container">

        {/* ── 헤더 행 ── */}
        <div className="cell cell-header">구분</div>
        <div className="cell cell-header prep-header">착공준비</div>
        {Array.from({ length: TOTAL_MONTHS }, (_, i) => (
          <div key={i} className="cell cell-header">{i + 1}월</div>
        ))}

        {/* ── 공정 행 ── */}
        {constructionData.map((task, taskIndex) => {
          // 각 월을 순서대로 렌더링
          const monthCells = [];
          let month = 1;
          while (month <= TOTAL_MONTHS) {
            if (month === task.start) {
              // 공정 막대: span으로 duration 열을 점유
              monthCells.push(
                <div
                  key={month}
                  className="cell"
                  style={{
                    gridColumn: `span ${task.duration}`,
                    background: "#fff",
                    padding: "5px",
                  }}
                >
                  <div
                    className={`task-bar ${task.color}`}
                    onClick={() => onBarClick(taskIndex)}
                    title={`${task.name} 상세 활동 등록`}
                  >
                    {task.label}
                  </div>
                </div>
              );
              month += task.duration;
            } else {
              monthCells.push(<div key={month} className="cell" />);
              month++;
            }
          }

          return (
            <React.Fragment key={taskIndex}>
              {/* 공종명 */}
              <div className="cell cell-sidebar" title={task.name}>
                {task.name}
              </div>

              {/* 착공준비 셀 */}
              <PrepCell
                value={prepConst[taskIndex] ?? ""}
                onBlurSave={(val) => onPrepUpdate("const", taskIndex, val)}
              />

              {/* 월별 셀 */}
              {monthCells}
            </React.Fragment>
          );
        })}

        {/* ── 구분선 ── */}
        <div className="divider-row">
          ▼ 법적 안전관리 및 성과 측정 일정 (클릭하여 수정)
        </div>

        {/* ── 안전 행 ── */}
        {safetyData.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {/* 안전 항목명 */}
            <div className="cell cell-sidebar safety-row">{row.title}</div>

            {/* 착공준비 셀 */}
            <PrepCell
              value={prepSafety[rowIndex] ?? ""}
              onBlurSave={(val) => onPrepUpdate("safety", rowIndex, val)}
            />

            {/* 월별 태그 셀 */}
            {Array.from({ length: TOTAL_MONTHS }, (_, i) => {
              const month = i + 1;
              const tags = row.monthlyTags?.[month] ?? [];
              return (
                <TagCell
                  key={month}
                  tags={tags}
                  rowIndex={rowIndex}
                  month={month}
                  onClick={() => onTagCellClick(rowIndex, month)}
                />
              );
            })}
          </React.Fragment>
        ))}

      </div>
    </div>
  );
};

export default ProcessChart;
