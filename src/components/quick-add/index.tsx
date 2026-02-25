import { useState, useEffect, useRef } from "react";
import styles from "./index.module.scss";
import { useTags } from "../../hooks/useTags";
import { useRelaxValue, recordsState } from "../../store/recordStore";

interface QuickAddProps {
  visible: boolean;
  existingTags: string[];
  onClose: () => void;
  onSave: (data: {
    content: string;
    tags: string[];
    status: "pending" | "in_progress" | "completed";
  }) => void;
}

export function QuickAdd({
  visible,
  existingTags: _existingTags,
  onClose,
  onSave,
}: QuickAddProps) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"pending" | "in_progress" | "completed">(
    "pending",
  );
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

  const insertTag = (tag: string) => {
    insertText(`#${tag} `);
    setSearchQuery("");
    setShowDropdown(false);
  };

  // 点击外部关闭下拉框
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

  useEffect(() => {
    if (visible) {
      setContent("");
      setStatus("pending");
      setSearchQuery("");
      setShowDropdown(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  // 从输入框解析第一个标签作为分类（单选）
  const parseTagFromContent = (content: string): string[] => {
    const tagMatch = content.match(/#(\S+)/);
    return tagMatch ? [tagMatch[1]] : [];
  };

  const handleSave = () => {
    if (!content.trim()) return;
    const tags = parseTagFromContent(content); // 只取第一个标签
    onSave({ content: content.trim(), tags, status });
    setContent("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      onClose();
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

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
        {/* 顶部把手 */}
        <div className={styles.sheetHandle} />

        {/* 标题 */}
        <h2 className={styles.sheetTitle}>添加任务</h2>

        {/* 输入框 */}
        <div className={styles.sheetInputWrapper} ref={dropdownRef}>
          <input
            ref={inputRef}
            type="text"
            className={styles.sheetInput}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              // 检测输入中是否有 # 触发搜索
              const value = e.target.value;
              const lastHashIndex = value.lastIndexOf("#");
              // 只有当 # 后没有空格时才触发搜索
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

          {/* 模糊搜索下拉框 */}
          {showDropdown && searchQuery.trim() && (
            <div
              className={styles.dropdown}
              role="listbox"
              aria-label="选择分类"
            >
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

        {/* 常用分类 */}
        {frequentTags.length > 0 && (
          <div className={styles.categorySection}>
            <div className={styles.categoryLabel}>常用分类</div>
            <div className={styles.categoryList}>
              {frequentTags.map((tag) => (
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
