import { useState, useEffect, useRef } from "react";
import styles from "./index.module.scss";
import { useTags } from "../../hooks/useTags";
import { useRelaxValue, recordsState } from "../../store/recordStore";
import { TimeRangePicker } from "../time-range-picker";
import type { Record, RecordStatus } from "../../types";

export type TaskFormMode = "quick-add" | "detail";

export interface TaskFormProps {
  mode: TaskFormMode;
  visible: boolean;
  record?: Record | null;
  existingTags?: string[];
  onClose: () => void;
  onSave: (data: {
    content: string;
    tags: string[];
    status: "pending" | "in_progress" | "completed";
    plannedStartTime?: Date;
    plannedEndTime?: Date;
    actualStartTime?: Date;
    actualEndTime?: Date;
  }) => void;
  onDelete?: () => void;
  onStatusChange?: (newStatus: RecordStatus) => void;
}

export function TaskForm({
  mode,
  visible,
  record,
  existingTags: _existingTags,
  onClose,
  onSave,
  onDelete,
  onStatusChange,
}: TaskFormProps) {
  const isQuickAdd = mode === "quick-add";

  // Form state
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<RecordStatus>("pending");
  const [tags, setTags] = useState<string[]>([]);
  const [plannedStartTime, setPlannedStartTime] = useState<Date | null>(null);
  const [plannedEndTime, setPlannedEndTime] = useState<Date | null>(null);

  // Quick-add specific state
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const records = useRelaxValue(recordsState);
  const { allTags, getFrequentTags } = useTags();
  const frequentTags = getFrequentTags(records as { tags: string[] }[], 5);

  const filteredTags = searchQuery.trim()
    ? allTags.filter((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  // Initialize form when record changes (detail mode) or when visible (quick-add mode)
  useEffect(() => {
    if (visible) {
      if (isQuickAdd) {
        // Quick-add mode: reset to defaults
        setContent("");
        setStatus("pending");
        setTags([]);
        setPlannedStartTime(null);
        setPlannedEndTime(null);
        setSearchQuery("");
        setShowDropdown(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      } else if (record) {
        // Detail mode: populate from record
        setContent(record.content);
        setTags(record.tags);
        setStatus(record.status);
        setPlannedStartTime(record.plannedStartTime || null);
        setPlannedEndTime(record.plannedEndTime || null);
      }
    }
  }, [visible, isQuickAdd, record]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Tag operations
  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const insertTag = (tag: string) => {
    if (isQuickAdd) {
      insertText(`#${tag} `);
    } else {
      addTag(tag);
    }
    setSearchQuery("");
    setShowDropdown(false);
  };

  // Parse tags from content (quick-add mode)
  const parseTagsFromContent = (content: string): string[] => {
    const tagMatches = content.match(/#(\S+)/g);
    return tagMatches ? tagMatches.map((tag) => tag.slice(1)) : [];
  };

  const handleSave = () => {
    if (!content.trim()) return;

    let finalTags = tags;
    if (isQuickAdd) {
      finalTags = parseTagsFromContent(content);
    }

    onSave({
      content: content.trim(),
      tags: finalTags,
      status,
      plannedStartTime: plannedStartTime || undefined,
      plannedEndTime: plannedEndTime || undefined,
    });

    // Reset form
    setContent("");
    setStatus("pending");
    setTags([]);
    setPlannedStartTime(null);
    setPlannedEndTime(null);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && isQuickAdd) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleStatusChange = (newStatus: RecordStatus) => {
    setStatus(newStatus);
    // Call the onStatusChange callback if provided (for actualStartTime/actualEndTime handling)
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  const insertText = (text: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue =
        content.substring(0, start) + text + content.substring(end);
      setContent(newValue);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + text.length, start + text.length);
      }, 0);
    } else {
      setContent(content + text);
    }
  };

  if (!visible) return null;

  const isEditMode = !isQuickAdd && record;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
        {/* Top handle */}
        <div className={styles.sheetHandle} />

        {/* Header */}
        <div className={styles.sheetHeader}>
          <h2 className={styles.sheetTitle}>
            {isQuickAdd ? "添加任务" : "任务详情"}
          </h2>
          {isEditMode && onDelete && (
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={onDelete}
              aria-label="删除任务"
            >
              删除
            </button>
          )}
        </div>

        {/* Status section - only in detail mode */}
        {!isQuickAdd && (
          <div className={styles.statusSection}>
            <button
              type="button"
              className={`${styles.statusBtn} ${status === "pending" ? styles.statusBtnActive : ""}`}
              onClick={() => handleStatusChange("pending")}
            >
              待处理
            </button>
            <button
              type="button"
              className={`${styles.statusBtn} ${status === "in_progress" ? styles.statusBtnActive : ""}`}
              onClick={() => handleStatusChange("in_progress")}
            >
              进行中
            </button>
            <button
              type="button"
              className={`${styles.statusBtn} ${status === "completed" ? styles.statusBtnActive : ""}`}
              onClick={() => handleStatusChange("completed")}
            >
              已完成
            </button>
          </div>
        )}

        {/* Content input */}
        <div className={styles.inputSection}>
          <label htmlFor="task-content" className={styles.inputLabel}>
            任务内容
          </label>
          {isQuickAdd ? (
            <div className={styles.sheetInputWrapper} ref={dropdownRef}>
              <input
                ref={inputRef}
                type="text"
                className={styles.sheetInput}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  const value = e.target.value;
                  const lastHashIndex = value.lastIndexOf("#");
                  if (
                    lastHashIndex !== -1 &&
                    !value.slice(lastHashIndex).includes(" ")
                  ) {
                    const query = value.slice(lastHashIndex + 1).trim();
                    if (query.length > 0) {
                      setSearchQuery(query);
                      setShowDropdown(true);
                    }
                  } else {
                    setShowDropdown(false);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="添加任务... (支持: #标签)"
              />
              {/* Fuzzy search dropdown */}
              {showDropdown && searchQuery.trim() && (
                <div className={styles.dropdown} role="listbox">
                  {filteredTags.length > 0 ? (
                    filteredTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        role="option"
                        className={styles.dropdownItem}
                        onClick={() => insertTag(tag)}
                      >
                        {tag}
                      </button>
                    ))
                  ) : (
                    <div className={styles.dropdownEmpty}>没有匹配的分类</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <textarea
              id="task-content"
              className={styles.textarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入任务内容..."
              rows={3}
            />
          )}
        </div>

        {/* Tags section */}
        <div className={styles.inputSection}>
          <span className={styles.inputLabel}>标签</span>
          <div className={styles.tagsWrapper}>
            {tags.length > 0 ? (
              <div className={styles.selectedTags}>
                {tags.map((tag) => (
                  <span key={tag} className={styles.tagChip}>
                    {tag}
                    <button
                      type="button"
                      className={styles.tagRemove}
                      onClick={() => removeTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <span className={styles.noTags}>暂无标签</span>
            )}
          </div>

          {/* Frequent tags */}
          {frequentTags.length > 0 && (
            <div className={styles.categorySection}>
              <div className={styles.categoryLabel}>常用标签</div>
              <div className={styles.categoryList}>
                {frequentTags
                  .filter((tag) => !tags.includes(tag))
                  .map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={styles.categoryChip}
                      onClick={() => insertTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Time picker */}
        <div className={styles.timeSection}>
          <TimeRangePicker
            startTime={plannedStartTime}
            endTime={plannedEndTime}
            onStartTimeChange={setPlannedStartTime}
            onEndTimeChange={setPlannedEndTime}
          />
        </div>

        {/* Action buttons */}
        <div className={styles.sheetActions}>
          <button
            type="button"
            className={styles.sheetBtnSecondary}
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className={styles.sheetBtnPrimary}
            onClick={handleSave}
            disabled={!content.trim()}
          >
            {isQuickAdd ? "保存" : "更新"}
          </button>
        </div>
      </div>
    </div>
  );
}
