/**
 * @file TaskDetailModal.jsx
 * @description 공정별 상세 활동 등록 모달 컴포넌트
 *
 * 기존 openModal() / saveTaskDetails() / addComment() 로직을 React 제어 컴포넌트로 변환합니다.
 * - 파일 첨부 (이미지/PDF 미리보기)
 * - 댓글 등록/삭제
 * - Firebase Storage 업로드 후 Firestore 저장
 */

import React, { useState, useCallback, useEffect } from "react";

/** 관리자 비밀번호 */
const ADMIN_PASSWORD = "1234";

/** 첨부 가능한 최대 파일 크기 (10MB) */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// ────────────────────────────────────────────────────
// 오늘 날짜 (YYYY-MM-DD)
// ────────────────────────────────────────────────────
const getTodayString = () => new Date().toISOString().split("T")[0];

// ────────────────────────────────────────────────────
// TaskDetailModal 컴포넌트
// ────────────────────────────────────────────────────

/**
 * @param {{
 *   taskIndex: number | null,
 *   constructionData: Array<{ label: string }>,
 *   taskDetails: Record<string, object>,
 *   comments: Record<string, Array<{ name, content, date }>>,
 *   onClose: () => void,
 *   onSave: (index: number, data: object, file: File | null) => Promise<void>,
 *   onAddComment: (index: number, comment: { name, content }) => Promise<void>,
 *   onDeleteComment: (index: number, commentIdx: number, updatedComments: Array) => Promise<void>,
 * }} props
 */
const TaskDetailModal = ({
  taskIndex,
  constructionData,
  taskDetails,
  comments,
  onClose,
  onSave,
  onAddComment,
  onDeleteComment,
}) => {
  // ── 폼 상태 ──
  const [workDate, setWorkDate] = useState(getTodayString());
  const [risk, setRisk] = useState("");
  const [kpi, setKpi] = useState("");
  const [activity, setActivity] = useState("");

  // ── 파일 상태 ──
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPdf, setIsPdf] = useState(false);

  // ── 댓글 입력 상태 ──
  const [writerName, setWriterName] = useState("");
  const [commentContent, setCommentContent] = useState("");

  // ── 저장 중 상태 ──
  const [isSaving, setIsSaving] = useState(false);

  // taskIndex가 바뀔 때마다 폼 초기화 (저장된 데이터 로드)
  useEffect(() => {
    if (taskIndex === null) return;

    const saved = taskDetails?.[taskIndex] ?? {};
    setWorkDate(saved.workDate || getTodayString());
    setRisk(saved.risk || "");
    setKpi(saved.kpi || "");
    setActivity(saved.activity || "");
    setSelectedFile(null);

    // 기존 저장된 파일 URL 미리보기
    if (saved.imageData) {
      setPreviewUrl(saved.imageData);
      const isPdfFile =
        saved.imageData.toLowerCase().includes(".pdf") ||
        saved.imageData.startsWith("data:application/pdf");
      setIsPdf(isPdfFile);
    } else {
      setPreviewUrl(null);
      setIsPdf(false);
    }
  }, [taskIndex, taskDetails]);

  // ── 파일 선택 핸들러 ──
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert("파일 크기가 너무 큽니다. (10MB 이하만 가능)");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setIsPdf(file.type.includes("pdf"));

    // 로컬 미리보기 (FileReader)
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target.result);
    reader.readAsDataURL(file);
  }, []);

  // ── 첨부 파일 삭제 ──
  const handleDeleteFile = useCallback(() => {
    if (!confirm("첨부파일을 삭제하시겠습니까?")) return;
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsPdf(false);
  }, []);

  // ── 저장 ──
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(
        taskIndex,
        { workDate, risk, kpi, activity, imageData: previewUrl },
        selectedFile
      );
      alert("✅ [저장 완료]\n\n안전보건 활동 내역이 서버에 안전하게 저장되었습니다.");
      onClose();
    } catch (err) {
      console.error("저장 실패:", err);
      alert("❌ 저장 실패: 인터넷 연결을 확인하거나 파일 용량을 줄여주세요.");
    } finally {
      setIsSaving(false);
    }
  }, [taskIndex, workDate, risk, kpi, activity, previewUrl, selectedFile, onSave, onClose]);

  // ── 댓글 추가 ──
  const handleAddComment = useCallback(async () => {
    if (!writerName.trim() || !commentContent.trim()) {
      alert("이름과 내용을 입력하세요.");
      return;
    }
    await onAddComment(taskIndex, { name: writerName.trim(), content: commentContent.trim() });
    setCommentContent("");
  }, [taskIndex, writerName, commentContent, onAddComment]);

  // ── 댓글 삭제 ──
  const handleDeleteComment = useCallback(async (commentIdx) => {
    const pwd = prompt("관리자 비밀번호:");
    if (pwd === null) return;
    if (pwd !== ADMIN_PASSWORD) {
      alert("비밀번호 오류");
      return;
    }
    const currentComments = comments?.[taskIndex] ?? [];
    const updated = currentComments.filter((_, i) => i !== commentIdx);
    await onDeleteComment(taskIndex, commentIdx, updated);
  }, [taskIndex, comments, onDeleteComment]);

  // taskIndex가 null이면 렌더하지 않음 (조건부 렌더는 App.jsx에서 담당)
  if (taskIndex === null) return null;

  const taskLabel = constructionData[taskIndex]?.label ?? "공정";
  const currentComments = comments?.[taskIndex] ?? [];

  return (
    <div className="modal-overlay is-open">
      <div className="modal-box">
        {/* 헤더 */}
        <div className="modal-header">
          <h3 className="modal-title">{taskLabel} 상세 활동</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {/* 바디 */}
        <div className="modal-body">
          {/* 작업 일자 */}
          <div>
            <label className="form-label">📅 작업 일자 (자동 입력)</label>
            <input
              type="date"
              className="form-input"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              style={{ fontWeight: "bold", fontSize: "16px", color: "#333", background: "#f9f9f9" }}
            />
          </div>

          {/* 핵심 위험 + 성과 지표 */}
          <div className="row-2-col">
            <div className="col">
              <label className="form-label">⚠️ 핵심 위험</label>
              <input
                type="text"
                className="form-input risk-text"
                value={risk}
                onChange={(e) => setRisk(e.target.value)}
              />
            </div>
            <div className="col">
              <label className="form-label">📈 성과 지표</label>
              <input
                type="text"
                className="form-input"
                value={kpi}
                onChange={(e) => setKpi(e.target.value)}
              />
            </div>
          </div>

          {/* 안전보건 활동 일지 */}
          <div>
            <label className="form-label">📝 안전보건 활동 일지</label>
            <textarea
              className="form-input"
              rows={4}
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
            />
          </div>

          {/* 파일 첨부 */}
          <div>
            <label className="form-label">📸 사진/문서 첨부 (이미지 or PDF)</label>
            <input
              type="file"
              className="form-input"
              style={{ padding: "6px" }}
              accept="image/*, .pdf"
              onChange={handleFileChange}
            />

            {/* 미리보기 */}
            {previewUrl && (
              <div className="preview-box" style={{ display: "block" }}>
                <button className="btn-delete-img" onClick={handleDeleteFile}>×</button>
                {isPdf ? (
                  <iframe
                    src={previewUrl}
                    className="preview-pdf"
                    style={{ display: "block" }}
                    title="PDF 미리보기"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    className="preview-img"
                    style={{ display: "block" }}
                    alt="첨부 이미지 미리보기"
                  />
                )}
              </div>
            )}
          </div>

          {/* 댓글 섹션 */}
          <div className="comment-section">
            <label className="form-label">💬 현장 소통 (댓글)</label>
            <ul className="comment-list">
              {currentComments.length === 0 ? (
                <li style={{ color: "#aaa", padding: "8px 0", fontSize: "13px" }}>
                  등록된 댓글이 없습니다.
                </li>
              ) : (
                currentComments.map((c, i) => (
                  <li key={i} className="comment-item">
                    <div>
                      <strong>{c.name}:</strong> {c.content}
                      <span className="comment-date">({c.date})</span>
                    </div>
                    <button
                      className="btn-del-comment"
                      onClick={() => handleDeleteComment(i)}
                    >
                      삭제
                    </button>
                  </li>
                ))
              )}
            </ul>
            <div className="comment-input-group">
              <input
                type="text"
                className="input-name"
                placeholder="이름"
                value={writerName}
                onChange={(e) => setWriterName(e.target.value)}
              />
              <input
                type="text"
                className="input-content"
                placeholder="내용..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              />
              <button className="btn btn-navy" onClick={handleAddComment}>
                등 록
              </button>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="modal-footer">
          <button className="btn btn-gray" onClick={onClose}>닫기</button>
          <button
            className="btn btn-navy"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
