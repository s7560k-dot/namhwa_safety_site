/**
 * @file InspectionModal.jsx
 * @description 반입 점검 등록 모달 컴포넌트
 *
 * 기존 openInspectionModal() / saveInspection() 로직을 React로 변환합니다.
 * - 품목명, 점검 결과(합격/불합격), 세부 내용, 사진 첨부
 * - Firebase Storage 업로드 후 inspectionLogs 컬렉션에 저장
 */

import React, { useState, useCallback, useEffect } from "react";

/**
 * @param {{
 *   type: string | null, // '건설장비' | '기계기구' | '유해화학물질'
 *   onClose: () => void,
 *   onSave: (data: object, file: File | null) => Promise<void>,
 * }} props
 */
const InspectionModal = ({ type, onClose, onSave }) => {
  // ── 폼 상태 ──
  const [item, setItem] = useState("");
  const [result, setResult] = useState("합격");
  const [desc, setDesc] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // type이 바뀔 때 폼 초기화
  useEffect(() => {
    setItem("");
    setResult("합격");
    setDesc("");
    setImageFile(null);
  }, [type]);

  // ── 저장 ──
  const handleSave = useCallback(async () => {
    // 입력값 유효성 검사
    if (!item.trim()) {
      alert("품목명 / 장비명을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(
        { type, item: item.trim(), result, desc: desc.trim() },
        imageFile
      );
      alert("점검 내용이 저장되었습니다.");
      onClose();
    } catch (err) {
      console.error("점검 저장 실패:", err);
      alert("저장 실패: " + err.message);
    } finally {
      setIsSaving(false);
    }
  }, [type, item, result, desc, imageFile, onSave, onClose]);

  if (!type) return null;

  return (
    <div className="modal-overlay is-open">
      <div className="modal-box" style={{ width: "500px" }}>
        {/* 헤더 */}
        <div
          className="modal-header"
          style={{ background: "var(--primary)", color: "white" }}
        >
          <h3 className="modal-title" style={{ color: "white" }}>
            {type} 점검 등록
          </h3>
          <button
            className="btn-close"
            style={{ color: "white", borderColor: "white" }}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* 바디 */}
        <div className="modal-body">
          {/* 품목명 */}
          <div>
            <label className="form-label">📦 품목명 / 장비명</label>
            <input
              type="text"
              className="form-input"
              placeholder="예: 굴삭기, 사다리, 에폭시 등"
              value={item}
              onChange={(e) => setItem(e.target.value)}
            />
          </div>

          {/* 점검 결과 */}
          <div>
            <label className="form-label">✅ 점검 결과</label>
            <div style={{ display: "flex", gap: "20px", padding: "10px 0" }}>
              {["합격", "불합격"].map((option) => (
                <label key={option} style={{ cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="inspectResult"
                    value={option}
                    checked={result === option}
                    onChange={() => setResult(option)}
                  />
                  <span
                    style={{
                      fontWeight: "bold",
                      marginLeft: "4px",
                      color: option === "합격" ? "var(--success)" : "var(--danger)",
                    }}
                  >
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 세부 점검 내용 */}
          <div>
            <label className="form-label">📝 세부 점검 내용</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="특이사항 입력"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          {/* 사진 첨부 */}
          <div>
            <label className="form-label">📸 사진 첨부</label>
            <input
              type="file"
              className="form-input"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            {imageFile && (
              <div style={{ marginTop: "8px", fontSize: "13px", color: "#555" }}>
                선택된 파일: <strong>{imageFile.name}</strong>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="modal-footer">
          <button className="btn btn-gray" onClick={onClose}>취소</button>
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

export default InspectionModal;
