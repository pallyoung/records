import { useState, useEffect, useRef } from "react";
import styles from "./index.module.scss";

export interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync viewDate with external value changes
  useEffect(() => {
    if (value) {
      setViewDate(value);
    }
  }, [value]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Get number of days in a month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // 获取某月第一天是周几
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(
    viewDate.getFullYear(),
    viewDate.getMonth(),
  );
  const firstDay = getFirstDayOfMonth(
    viewDate.getFullYear(),
    viewDate.getMonth(),
  );

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      day,
    );
    onChange?.(selectedDate);
    setIsOpen(false);
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return "选择日期";
    const weekDayNames = [
      "周日",
      "周一",
      "周二",
      "周三",
      "周四",
      "周五",
      "周六",
    ];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDay = weekDayNames[date.getDay()];
    return `${month}/${day} ${weekDay}`;
  };

  return (
    <div className={styles.datePicker} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        {formatDisplayDate(value ?? null)}
      </button>
      {isOpen && (
        <div className={styles.popup}>
          <div className={styles.header}>
            <button type="button" onClick={handlePrevMonth}>
              ‹
            </button>
            <span>
              {viewDate.getFullYear()}年{viewDate.getMonth() + 1}月
            </span>
            <button type="button" onClick={handleNextMonth}>
              ›
            </button>
          </div>
          <div className={styles.weekDays}>
            {weekDays.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>
          <div className={styles.days}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className={styles.empty} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                value?.getDate() === day &&
                value?.getMonth() === viewDate.getMonth() &&
                value?.getFullYear() === viewDate.getFullYear();
              return (
                <button
                  key={day}
                  type="button"
                  className={`${styles.day} ${isSelected ? styles.selected : ""}`}
                  onClick={() => handleDateSelect(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
