/**
 * @file SafetyTagModal.jsx
 * @description 안전 태그 수정 모달 컴포넌트
 *
 * 기존 openSafetyModal() / addSafetyTag() / saveSafetyChanges() 로직을 React로 변환합니다.
 * - 현재 태그 표시 및 삭제
 * - 새 태그 추가 (색상 선택 + 텍스트 입력)
 * - 적용하기 버튼으로 Firebase 저장
 */

import React, { useState, useCallback, useEffect } from "react";

/** 태그 색상 옵션 */
const TAG_COLOR_OPTIONS = [
  { value: "blue",   label: "평가(파랑)" },
  { value: "green",  label: "교육(초록)" },
  { value: "red",    label: "특별(빨강)" },
  { value: "orange", label: "점검(주황)" },
  { value: "pink",   label: "측정(분홍)" },
  { value: "purple", label: "회의(보라)" },
];

/**
 * @param {{
 *   rowIndex: number | null,
 *   month: number | null,
 *   safetyData: Array<{ title, monthlyTags }>,
 *   onClose: () => void,
 *   onSave: (rowIndex: number, month: number, tags: string[]) => Promise<void>,
 * }} props
 */
const SafetyTagModal = ({ rowIndex, month, safetyData, onClose, onSave }) => {
  // 편집 중인 태그 배열 (저장하기 전 임시 상태)
  const [tempTags, setTempTags] = useState([]);
  const [newTagText, setNewTagText] = useState("");
  const [newTagColor, setNewTagColor] = useState("blue");
  const [isSaving, setIsSaving] = useState(false);

  // rowIndex, month가 바뀌면 태그 초기화
  useEffect(() => {
    if (rowIndex === null || month === null) return;
    const existingTags = safetyData[rowIndex]?.monthlyTags?.[month] ?? [];
    setTempTags([...existingTags]);
    setNewTagText("");
    setNewTagColor("blue");
  }, [rowIndex, month, safetyData]);

  // ── 태그 추가 ──
  const handleAddTag = useCallback(() => {
    const text = newTagText.trim();
    if (!text) return;
    setTempTags((prev) => [...prev, `${text}|${newTagColor}`]);
    setNewTagText("");
  }, [newTagText, newTagColor]);

  // ── 태그 삭제 ──
  const handleRemoveTag = useCallback((idx) => {
    setTempTags((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // ── 적용하기 ──
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(rowIndex, month, tempTags);
      onClose();
    } catch (err) {
      console.error("태그 저장 실패:", err);
      alert("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }, [rowIndex, month, tempTags, onSave, onClose]);

  if (rowIndex === null || month === null) return null;

  return (
    <div className="modal-overlay is-open">
      <div className="modal-box" style={{ width: "450px" }}>
        {/* 헤더 */}
        <div className="modal-header">
          <h3 className="modal-title">{month}월 일정 수정</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {/* 바디 */}
        <div className="modal-body">
          {/* 현재 태그 목록 */}
          <div>
            <label className="form-label">현재 등록된 태그</label>
            <div className="tag-editor-list">
              {tempTags.length === 0 ? (
                <span style={{ color: "#aaa", fontSize: "13px" }}>
                  등록된 태그가 없습니다.
                </span>
              ) : (
                tempTags.map((tagStr, idx) => {
                  const [text, color] = tagStr.split("|");
                  return (
                    <span key={idx} className={`tag-item tag ${color}`}>
                      {text}
                      <span
                        className="del-btn"
                        onClick={() => handleRemoveTag(idx)}
                        title="태그 삭제"
                      >
                        ×
                      </span>
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* 새 태그 추가 */}
          <div>
            <label className="form-label">새 태그 추가</label>
            <div className="tag-input-group">
              <select
                className="color-select"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
              >
                {TAG_COLOR_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <input
                type="text"
                className="form-input"
                placeholder="내용"
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              />
              <button
                className="btn btn-navy"
                style={{ padding: "0 15px" }}
                onClick={handleAddTag}
              >
                추가
              </button>
            </div>
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
            {isSaving ? "저장 중..." : "적용하기"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyTagModal;
