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

// 解析自然语言输入
function parseInput(input: string): {
  content: string;
  tags: string[];
  plannedEndTime?: Date;
} {
  const result = {
    content: input,
    tags: [] as string[],
    plannedEndTime: undefined as Date | undefined,
  };

  // 提取 #标签
  const tagMatches = input.match(/#(\w+)/g);
  if (tagMatches) {
    result.tags = tagMatches.map((t) => t.slice(1));
    result.content = result.content.replace(/#\w+/g, "").trim();
  }

  // 提取时间关键词
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (input.includes("今天") || input.includes("today")) {
    result.plannedEndTime = today;
    result.content = result.content.replace(/今天|today/gi, "").trim();
  } else if (input.includes("明天") || input.includes("tomorrow")) {
    result.plannedEndTime = tomorrow;
    result.content = result.content.replace(/明天|tomorrow/gi, "").trim();
  } else if (input.includes("后天")) {
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    result.plannedEndTime = dayAfter;
    result.content = result.content.replace(/后天/gi, "").trim();
  }

  // 提取周五等星期几
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  for (const day of weekdays) {
    if (input.includes(day)) {
      const now2 = new Date();
      const currentDay = now2.getDay();
      const targetDay = weekdays.indexOf(day);
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;

      const targetDate = new Date(now2);
      targetDate.setDate(now2.getDate() + daysToAdd);
      result.plannedEndTime = targetDate;
      result.content = result.content.replace(day, "").trim();
      break;
    }
  }

  return result;
}

export function QuickAdd({
  visible,
  existingTags,
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
      <div
        className={styles.bottomSheet}
        onClick={(e) => e.stopPropagation()}
      >
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
            className={styles.hintTag}
            onClick={() => insertText("今天 ")}
          >
            今天
          </button>
          <button
            className={styles.hintTag}
            onClick={() => insertText("明天 ")}
          >
            明天
          </button>
          <button
            className={styles.hintTag}
            onClick={() => insertText("#工作 ")}
          >
            #工作
          </button>
          <button
            className={styles.hintTag}
            onClick={() => insertText("#生活 ")}
          >
            #生活
          </button>
          <button
            className={styles.hintTag}
            onClick={() => insertText("#学习 ")}
          >
            #学习
          </button>
        </div>

        {/* 操作按钮 */}
        <div className={styles.sheetActions}>
          <button className={styles.sheetBtnSecondary} onClick={onClose}>
            取消
          </button>
          <button
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
