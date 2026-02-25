import { useState, useEffect } from "react";
import styles from "./index.module.scss";
import {
  recordActions,
  useRelaxValue,
  recordsState,
} from "../../store/recordStore";
import { useTags } from "../../hooks/useTags";
import type { Record, RecordStatus } from "../../types";

interface TaskDetailProps {
  recordId: string | null;
  visible: boolean;
  onClose: () => void;
}

export function TaskDetail({ recordId, visible, onClose }: TaskDetailProps) {
  const records = useRelaxValue(recordsState) as Record[];
  const record = records.find((r) => r.id === recordId);

  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<RecordStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { allTags, getFrequentTags } = useTags();
  const frequentTags = getFrequentTags(records, 5);

  const filteredTags = searchQuery.trim()
    ? allTags.filter((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  // 当 record 变化时初始化表单
  useEffect(() => {
    if (record) {
      setContent(record.content);
      setTags(record.tags);
      setStatus(record.status);
    }
  }, [record]);

  // 弹窗显示时重置搜索状态
  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      setShowDropdown(false);
    }
  }, [visible]);

  const insertTag = (tag: string) => {
    const newTags = tags.includes(tag) ? tags : [...tags, tag];
    setTags(newTags);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = () => {
    if (!content.trim() || !recordId) return;
    recordActions.updateRecord(recordId, {
      content: content.trim(),
      tags,
      status,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!recordId) return;
    if (confirm("确定要删除这个任务吗？")) {
      recordActions.deleteRecord(recordId);
      onClose();
    }
  };

  const handleStatusChange = (newStatus: RecordStatus) => {
    if (!recordId) return;
    setStatus(newStatus);
    // 如果开始进行中，设置实际开始时间
    if (newStatus === "in_progress" && record?.status === "pending") {
      recordActions.updateRecord(recordId, {
        status: newStatus,
        actualStartTime: new Date(),
      });
    }
    // 如果完成，设置实际结束时间
    else if (newStatus === "completed" && record?.status !== "completed") {
      recordActions.updateRecord(recordId, {
        status: newStatus,
        actualEndTime: new Date(),
      });
    }
  };

  if (!visible || !record) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
        {/* 顶部把手 */}
        <div className={styles.sheetHandle} />

        {/* 标题 */}
        <div className={styles.sheetHeader}>
          <h2 className={styles.sheetTitle}>任务详情</h2>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleDelete}
            aria-label="删除任务"
          >
            删除
          </button>
        </div>

        {/* 状态选择 */}
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

        {/* 内容输入 */}
        <div className={styles.inputSection}>
          <label htmlFor="task-content" className={styles.inputLabel}>
            任务内容
          </label>
          <textarea
            id="task-content"
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="输入任务内容..."
            rows={3}
          />
        </div>

        {/* 标签选择 */}
        <div className={styles.inputSection}>
          <label htmlFor="task-tags" className={styles.inputLabel}>
            标签
          </label>
          <div className={styles.tagsWrapper}>
            {/* 已选标签 */}
            {tags.length > 0 && (
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
            )}
            {/* 搜索输入 */}
            <input
              id="task-tags"
              type="text"
              className={styles.tagInput}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim()) {
                  setShowDropdown(true);
                }
              }}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setShowDropdown(true);
                }
              }}
              placeholder="添加标签..."
            />
            {/* 标签下拉框 */}
            {showDropdown && searchQuery.trim() && (
              <div className={styles.dropdown}>
                {filteredTags.length > 0 ? (
                  filteredTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
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

          {/* 常用分类 */}
          {frequentTags.length > 0 && (
            <div className={styles.categorySection}>
              <div className={styles.categoryLabel}>常用分类</div>
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

        {/* 时间信息 */}
        <div className={styles.timeInfo}>
          {record.plannedStartTime && (
            <div className={styles.timeItem}>
              <span className={styles.timeLabel}>计划开始：</span>
              <span className={styles.timeValue}>
                {new Date(record.plannedStartTime).toLocaleString("zh-CN")}
              </span>
            </div>
          )}
          {record.plannedEndTime && (
            <div className={styles.timeItem}>
              <span className={styles.timeLabel}>计划结束：</span>
              <span className={styles.timeValue}>
                {new Date(record.plannedEndTime).toLocaleString("zh-CN")}
              </span>
            </div>
          )}
          {record.actualStartTime && (
            <div className={styles.timeItem}>
              <span className={styles.timeLabel}>实际开始：</span>
              <span className={styles.timeValue}>
                {new Date(record.actualStartTime).toLocaleString("zh-CN")}
              </span>
            </div>
          )}
          {record.actualEndTime && (
            <div className={styles.timeItem}>
              <span className={styles.timeLabel}>实际结束：</span>
              <span className={styles.timeValue}>
                {new Date(record.actualEndTime).toLocaleString("zh-CN")}
              </span>
            </div>
          )}
          <div className={styles.timeItem}>
            <span className={styles.timeLabel}>创建时间：</span>
            <span className={styles.timeValue}>
              {new Date(record.createdAt).toLocaleString("zh-CN")}
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
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
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
