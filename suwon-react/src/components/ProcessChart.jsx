/**
 * @file ProcessChart.jsx
 * @description Dynamic months construction grid with loop safety
 */

import React, { useState, useCallback } from "react";

/**
 * @param {{ value: string, onBlurSave: (value: string) => void }} props
 */
const PrepCell = ({ value, onBlurSave }) => {
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

/**
 * @param {{
 *   months: number,
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
  months = 12,
  constructionData = [],
  prepConst = {},
  prepSafety = {},
  safetyData = [],
  onBarClick,
  onTagCellClick,
  onPrepUpdate,
}) => {
  return (
    <div className="chart-wrapper">
      <div
        className="grid-container"
        style={{
          display: "grid",
          gridTemplateColumns: `180px 80px repeat(${months}, 1fr)`,
        }}
      >
        {/* ── 헤더 행 ── */}
        <div className="cell cell-header">구분</div>
        <div className="cell cell-header prep-header">착공준비</div>
        {Array.from({ length: months }, (_, i) => (
          <div key={i} className="cell cell-header">
            {i + 1}월
          </div>
        ))}

        {/* ── 공정 행 ── */}
        {constructionData.map((task, taskIndex) => {
          const monthCells = [];
          let m = 0; // 0-based index for logic
          const MAX_ITERATIONS = 1000;
          let iterations = 0;

          while (m < months && iterations < MAX_ITERATIONS) {
            iterations++;
            if (m === task.start) {
              const span = Math.max(
                1,
                Math.min(task.duration || 1, months - m)
              );
              monthCells.push(
                <div
                  key={m}
                  className="cell"
                  style={{
                    gridColumn: `span ${span}`,
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
              m += span;
            } else {
              monthCells.push(<div key={m} className="cell" />);
              m++;
            }
          }

          return (
            <React.Fragment key={taskIndex}>
              <div className="cell cell-sidebar" title={task.name}>
                {task.name}
              </div>
              <PrepCell
                value={prepConst[taskIndex] ?? ""}
                onBlurSave={(val) => onPrepUpdate("const", taskIndex, val)}
              />
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
            <div className="cell cell-sidebar safety-row">{row.title}</div>
            <PrepCell
              value={prepSafety[rowIndex] ?? ""}
              onBlurSave={(val) => onPrepUpdate("safety", rowIndex, val)}
            />
            {Array.from({ length: months }, (_, i) => {
              const m = i + 1;
              const tags = row.monthlyTags?.[m] ?? [];
              return (
                <TagCell
                  key={m}
                  tags={tags}
                  rowIndex={rowIndex}
                  month={m}
                  onClick={() => onTagCellClick(rowIndex, m)}
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
