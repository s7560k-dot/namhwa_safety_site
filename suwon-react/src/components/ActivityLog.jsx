/**
 * @file ActivityLog.jsx
 * @description 실시간 안전활동 등록 현황 컴포넌트
 *
 * 기존 renderActivityLog() 함수를 React 컴포넌트로 변환합니다.
 * - taskDetails 서브컬렉션 데이터를 최신순으로 정렬하여 표시
 * - 검색 필터링 (공종명, 위험, 활동 내용)
 * - 항목 클릭 시 TaskDetailModal 열기
 */

import React, { useMemo } from "react";

// ────────────────────────────────────────────────────
// 상수
// ────────────────────────────────────────────────────

/** 비밀번호 (실제 운영에서는 Firebase Auth로 대체 권장) */
const ADMIN_PASSWORD = "1234";

// ────────────────────────────────────────────────────
// ActivityLog 컴포넌트
// ────────────────────────────────────────────────────

/**
 * @param {{
 *   taskDetails: Record<string, { risk, kpi, activity, lastUpdated }>,
 *   constructionData: Array<{ label: string }>,
 *   searchText: string,
 *   onSearchChange: (text: string) => void,
 *   onItemClick: (index: number) => void,
 *   onDelete: (index: string) => Promise<void>,
 * }} props
 */
const ActivityLog = ({
  taskDetails,
  constructionData,
  searchText,
  onSearchChange,
  onItemClick,
  onDelete,
}) => {

  /**
   * taskDetails 객체를 배열로 변환, 필터링, 최신순 정렬
   * useMemo로 searchText나 taskDetails가 바뀔 때만 재계산
   */
  const filteredLog = useMemo(() => {
    const query = searchText.toLowerCase();

    const logArray = Object.keys(taskDetails)
      .map((index) => ({
        index,
        taskName: constructionData[index]?.label ?? `공정 ${index}`,
        data: taskDetails[index],
      }))
      // 데이터가 있는 항목만 표시
      .filter(({ data }) => data.risk || data.kpi || data.activity);

    // 검색 필터
    const searched = query
      ? logArray.filter(
          ({ taskName, data }) =>
            taskName.toLowerCase().includes(query) ||
            data.risk?.toLowerCase().includes(query) ||
            data.activity?.toLowerCase().includes(query)
        )
      : logArray;

    // 최신순 정렬
    return searched.sort((a, b) => {
      const dateA = a.data.lastUpdated ? new Date(a.data.lastUpdated) : new Date(0);
      const dateB = b.data.lastUpdated ? new Date(b.data.lastUpdated) : new Date(0);
      return dateB - dateA;
    });
  }, [taskDetails, constructionData, searchText]);

  /**
   * 활동 삭제 핸들러 (관리자 비밀번호 확인)
   * @param {React.MouseEvent} e
   * @param {string} index
   */
  const handleDelete = async (e, index) => {
    // 클릭 이벤트가 부모(li)의 onClick까지 전파되지 않도록 차단
    e.stopPropagation();

    if (!confirm("정말로 이 활동 내역을 삭제하시겠습니까?")) return;

    const pwd = prompt("관리자 비밀번호를 입력하세요:");
    if (pwd === null) return; // 취소

    if (pwd !== ADMIN_PASSWORD) {
      alert("비밀번호가 틀렸습니다.");
      return;
    }

    try {
      await onDelete(index);
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="log-section">
      <div className="log-header">
        <h3 style={{ margin: 0 }}>📊 실시간 안전활동 등록 현황 (최신순)</h3>
        <input
          type="text"
          className="log-search"
          placeholder="공종명, 내용 검색..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <ul className="log-list">
        {filteredLog.length === 0 ? (
          <li style={{ textAlign: "center", padding: "20px", color: "#999" }}>
            {searchText
              ? "검색 결과가 없습니다."
              : "등록된 활동 내역이 없습니다."}
          </li>
        ) : (
          filteredLog.map(({ index, taskName, data }) => {
            // 날짜 포맷
            const dateStr = data.lastUpdated
              ? new Date(data.lastUpdated).toLocaleString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "날짜 정보 없음";

            return (
              <li
                key={index}
                className="log-item"
                onClick={() => onItemClick(Number(index))}
              >
                <div className="log-top">
                  <span>
                    No. {Number(index) + 1}&nbsp;&nbsp; 🕒 {dateStr}
                  </span>
                  <button
                    className="btn-log-delete"
                    onClick={(e) => handleDelete(e, index)}
                  >
                    삭제
                  </button>
                </div>

                <div className="log-task">
                  {taskName}
                  {data.risk && (
                    <span className="log-badge badge-risk">핵심위험</span>
                  )}
                  {data.kpi && (
                    <span className="log-badge badge-kpi">KPI</span>
                  )}
                </div>

                <div className="log-content">
                  {data.activity || (
                    <span style={{ color: "#ccc" }}>(활동 내용 없음)</span>
                  )}
                </div>

                {data.risk && (
                  <div style={{ fontSize: "12px", color: "#d9534f", marginTop: "5px" }}>
                    ⚠️ 위험: {data.risk}
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};

export default ActivityLog;
