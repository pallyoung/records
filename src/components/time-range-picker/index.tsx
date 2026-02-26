// src/components/time-range-picker/index.tsx
import { useState, useEffect } from "react";
import { DateTimeRow } from "../datetime-row";
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
  const [localStartTime, setLocalStartTime] = useState<Date | null>(null);
  const [localEndTime, setLocalEndTime] = useState<Date | null>(null);

  // Initialize from props
  useEffect(() => {
    setLocalStartTime(startTime ?? null);
    setLocalEndTime(endTime ?? null);
  }, [startTime, endTime]);

  const handleStartTimeChange = (date: Date) => {
    setLocalStartTime(date);
    onStartTimeChange?.(date);
  };

  const handleEndTimeChange = (date: Date) => {
    setLocalEndTime(date);
    onEndTimeChange?.(date);
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

    handleStartTimeChange(start);
    handleEndTimeChange(end);
  };

  return (
    <div className={styles.timePicker}>
      <DateTimeRow
        label="开始时间"
        value={localStartTime}
        onChange={handleStartTimeChange}
      />
      <DateTimeRow
        label="结束时间"
        value={localEndTime}
        onChange={handleEndTimeChange}
      />
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
