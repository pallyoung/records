// src/components/time-range-picker/index.tsx
import { useState, useEffect } from "react";
import styles from "./index.module.scss";

export interface TimeRangePickerProps {
  startTime?: Date | null;
  endTime?: Date | null;
  onStartTimeChange?: (date: Date | null) => void;
  onEndTimeChange?: (date: Date | null) => void;
}

export function TimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: TimeRangePickerProps) {
  const [localStartTime, setLocalStartTime] = useState<string>("");
  const [localEndTime, setLocalEndTime] = useState<string>("");

  // Initialize from props
  useEffect(() => {
    if (startTime) {
      setLocalStartTime(formatDateTimeLocal(new Date(startTime)));
    }
    if (endTime) {
      setLocalEndTime(formatDateTimeLocal(new Date(endTime)));
    }
  }, [startTime, endTime]);

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalStartTime(value);
    if (value) {
      onStartTimeChange?.(new Date(value));
    } else {
      onStartTimeChange?.(null);
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalEndTime(value);
    if (value) {
      onEndTimeChange?.(new Date(value));
    } else {
      onEndTimeChange?.(null);
    }
  };

  const setQuickRange = (type: "today" | "tomorrow" | "week") => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (type) {
      case "today":
        start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          9,
          0,
        );
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
        );
        break;
      case "tomorrow":
        start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
          9,
          0,
        );
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
          23,
          59,
        );
        break;
      case "week":
        start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          9,
          0,
        );
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 7,
          23,
          59,
        );
        break;
    }

    setLocalStartTime(formatDateTimeLocal(start));
    setLocalEndTime(formatDateTimeLocal(end));
    onStartTimeChange?.(start);
    onEndTimeChange?.(end);
  };

  return (
    <div className={styles.timePicker}>
      <div className={styles.timeRow}>
        <label htmlFor="start-time" className={styles.timeLabel}>
          开始时间
        </label>
        <input
          id="start-time"
          type="datetime-local"
          className={styles.timeInput}
          value={localStartTime}
          onChange={handleStartTimeChange}
        />
      </div>

      <div className={styles.timeRow}>
        <label htmlFor="end-time" className={styles.timeLabel}>
          结束时间
        </label>
        <input
          id="end-time"
          type="datetime-local"
          className={styles.timeInput}
          value={localEndTime}
          onChange={handleEndTimeChange}
        />
      </div>

      <div className={styles.quickButtons}>
        <button type="button" onClick={() => setQuickRange("today")}>
          今天
        </button>
        <button type="button" onClick={() => setQuickRange("tomorrow")}>
          明天
        </button>
        <button type="button" onClick={() => setQuickRange("week")}>
          本周
        </button>
      </div>
    </div>
  );
}

function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
