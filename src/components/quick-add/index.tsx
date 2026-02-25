import { useState, useEffect, useRef } from "react";
import styles from "./index.module.scss";

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
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<"pending" | "in_progress" | "completed">(
    "pending",
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) {
      setContent("");
      setTags([]);
      setStatus("pending");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  const handleSave = () => {
    if (!content.trim()) return;
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
        <div className={styles.sheetInputWrapper}>
          <input
            ref={inputRef}
            type="text"
            className={styles.sheetInput}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="添加任务... (支持: 明天 周五 #标签)"
          />
        </div>

        {/* 快捷标签 */}
        <div className={styles.quickAddHints}>
          <button
            type="button"
            className={styles.hintTag}
            onClick={() => insertText("今天 ")}
          >
            今天
          </button>
          <button
            type="button"
            className={styles.hintTag}
            onClick={() => insertText("明天 ")}
          >
            明天
          </button>
          <button
            type="button"
            className={styles.hintTag}
            onClick={() => insertText("#工作 ")}
          >
            #工作
          </button>
          <button
            type="button"
            className={styles.hintTag}
            onClick={() => insertText("#生活 ")}
          >
            #生活
          </button>
          <button
            type="button"
            className={styles.hintTag}
            onClick={() => insertText("#学习 ")}
          >
            #学习
          </button>
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
