/**
 * @file InspectionLog.jsx
 * @description 반입 장비/자재 점검 및 알림 컴포넌트
 *
 * 기존 renderInspectionLog() 함수를 React 컴포넌트로 변환합니다.
 * - 건설장비 / 기계기구 / 유해화학물질 점검 버튼
 * - 점검 내역 리스트 표시
 * - 항목 삭제 (관리자 비밀번호)
 */

import React from "react";

/** 관리자 비밀번호 (실제 운영에서는 Firebase Auth로 대체 권장) */
const ADMIN_PASSWORD = "1234";

/**
 * @param {{
 *   inspectionLogs: Array<{ id, type, item, result, desc, date, imageUrl }>,
 *   onOpenModal: (type: string) => void,
 *   onDelete: (logId: string) => Promise<void>,
 * }} props
 */
const InspectionLog = ({ inspectionLogs, onOpenModal, onDelete }) => {

  /**
   * 점검 항목 삭제 핸들러
   * @param {string} logId
   */
  const handleDelete = async (logId) => {
    if (!confirm("이 점검 내역을 삭제하시겠습니까? (복구 불가)")) return;

    const pwd = prompt("관리자 비밀번호를 입력하세요:");
    if (pwd === null) return;

    if (pwd !== ADMIN_PASSWORD) {
      alert("비밀번호가 틀렸습니다.");
      return;
    }

    try {
      await onDelete(logId);
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제에 실패했습니다: " + err.message);
    }
  };

  return (
    <div className="inspection-section">
      <div className="inspection-header">
        <h3 style={{ margin: 0 }}>🏗️ 반입 장비/자재 점검 및 알림</h3>
      </div>

      {/* 점검 등록 버튼 3종 */}
      <div className="inspection-buttons">
        {[
          { type: "건설장비", emoji: "🚜", colorClass: "blue" },
          { type: "기계기구", emoji: "🛠️", colorClass: "orange" },
          { type: "유해화학물질", emoji: "🧪", colorClass: "purple" },
        ].map(({ type, emoji, colorClass }) => (
          <button
            key={type}
            className={`btn-inspect ${colorClass}`}
            onClick={() => onOpenModal(type)}
          >
            {emoji} {type} 점검
          </button>
        ))}
      </div>

      {/* 점검 내역 리스트 */}
      <ul className="inspection-list">
        {inspectionLogs.length === 0 ? (
          <li style={{ textAlign: "center", color: "#999", padding: "10px" }}>
            등록된 점검 내역이 없습니다.
          </li>
        ) : (
          inspectionLogs.map((log) => (
            <li key={log.id} className="inspection-item">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  flex: 1,
                }}
              >
                {/* 상단: 유형 + 품목명 */}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <span
                      style={{
                        background: "#eee",
                        color: "#666",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        marginRight: "5px",
                      }}
                    >
                      {log.type}
                    </span>
                    <span style={{ fontWeight: "bold", color: "#333" }}>
                      {log.item}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#ccc",
                      cursor: "pointer",
                      fontSize: "16px",
                    }}
                    title="삭제"
                  >
                    ×
                  </button>
                </div>

                {/* 날짜 + 내용 */}
                <div style={{ fontSize: "12px", color: "#888" }}>
                  {log.date}
                  {log.desc ? ` — ${log.desc}` : ""}
                </div>

                {/* 사진 링크 */}
                {log.imageUrl && (
                  <a
                    href={log.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "12px", color: "var(--primary)" }}
                  >
                    📸 사진 보기
                  </a>
                )}

                {/* 합격/불합격 */}
                <div>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: log.result === "합격" ? "var(--success)" : "var(--danger)",
                    }}
                  >
                    {log.result}
                  </span>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default InspectionLog;
