// src/components/time-range-picker/index.tsx
import { useState, useEffect, useRef } from "react";
import styles from "./index.module.scss";

export interface TimeRangePickerProps {
  startTime?: Date | null;
  endTime?: Date | null;
  onStartTimeChange?: (date: Date | null) => void;
  onEndTimeChange?: (date: Date | null) => void;
}

// 格式化时间为 HH:MM
function formatTime(date: Date | null | undefined): string {
  if (!date) return "--:--";
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// 格式化日期为 MM-DD
function formatDate(date: Date | null | undefined): string {
  if (!date) return "选择日期";
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}-${day}`;
}

// 星期几
const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

// 生成日期选项（今天开始的30天）
function generateDateOptions(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
}

// 小时选项
const hours = Array.from({ length: 24 }, (_, i) => i);
// 分钟选项（每5分钟）
const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

const dateOptions = generateDateOptions();

export function TimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: TimeRangePickerProps) {
  const [localStartTime, setLocalStartTime] = useState<Date | null>(null);
  const [localEndTime, setLocalEndTime] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  // 当前编辑的是开始时间还是结束时间
  const [editingType, setEditingType] = useState<"start" | "end">("start");

  // Modal 内部的临时时间状态
  const [modalStartTime, setModalStartTime] = useState<Date | null>(null);
  const [modalEndTime, setModalEndTime] = useState<Date | null>(null);

  // Initialize from props
  useEffect(() => {
    setLocalStartTime(startTime ?? null);
    setLocalEndTime(endTime ?? null);
  }, [startTime, endTime]);

  // 打开 Modal 时初始化
  const handleTimeRowClick = () => {
    setModalStartTime(localStartTime);
    setModalEndTime(localEndTime);
    setEditingType("start");
    setShowModal(true);
  };

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

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleModalConfirm = () => {
    if (modalStartTime) {
      handleStartTimeChange(modalStartTime);
    }
    if (modalEndTime) {
      handleEndTimeChange(modalEndTime);
    }
    setShowModal(false);
  };

  // Modal 内部切换编辑类型
  const handleToggleEditingType = (type: "start" | "end") => {
    setEditingType(type);
  };

  // Modal 内更新日期
  const handleModalDateChange = (date: Date) => {
    if (editingType === "start" && modalStartTime) {
      const newDate = new Date(modalStartTime);
      newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setModalStartTime(newDate);
    } else if (editingType === "end" && modalEndTime) {
      const newDate = new Date(modalEndTime);
      newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setModalEndTime(newDate);
    }
  };

  // Modal 内更新小时
  const handleModalHourChange = (hour: number) => {
    if (editingType === "start" && modalStartTime) {
      const newDate = new Date(modalStartTime);
      newDate.setHours(hour);
      setModalStartTime(newDate);
    } else if (editingType === "end" && modalEndTime) {
      const newDate = new Date(modalEndTime);
      newDate.setHours(hour);
      setModalEndTime(newDate);
    }
  };

  // Modal 内更新分钟
  const handleModalMinuteChange = (minute: number) => {
    if (editingType === "start" && modalStartTime) {
      const newDate = new Date(modalStartTime);
      newDate.setMinutes(minute);
      setModalStartTime(newDate);
    } else if (editingType === "end" && modalEndTime) {
      const newDate = new Date(modalEndTime);
      newDate.setMinutes(minute);
      setModalEndTime(newDate);
    }
  };

  // 查找当前选中日期的索引
  const getDateIndex = (date: Date | null) => {
    if (!date) return 0;
    for (let i = 0; i < dateOptions.length; i++) {
      if (
        dateOptions[i].getFullYear() === date.getFullYear() &&
        dateOptions[i].getMonth() === date.getMonth() &&
        dateOptions[i].getDate() === date.getDate()
      ) {
        return i;
      }
    }
    return 0;
  };

  // 当前编辑的时间
  const currentEditingTime =
    editingType === "start" ? modalStartTime : modalEndTime;

  return (
    <div className={styles.timePicker}>
      {/* 一行显示时间选择 */}
      <div className={styles.timeRow} onClick={handleTimeRowClick}>
        <span className={styles.timeLabel}>选择时间</span>
        <div className={styles.timeDisplay}>
          <span className={styles.timeValue}>
            {localStartTime ? formatDate(localStartTime) : "选择日期"}
          </span>
          <span className={styles.timeSeparator}> &gt; </span>
          <span className={styles.timeValue}>
            {localEndTime ? formatDate(localEndTime) : "选择日期"}
          </span>
          {localStartTime && (
            <>
              <span className={styles.timeHour}>
                {formatTime(localStartTime)}
              </span>
              <span className={styles.timeSeparator}>-</span>
              <span className={styles.timeHour}>
                {formatTime(localEndTime)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 快捷按钮 */}
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

      {/* 时间选择 Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={handleModalClose}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <button type="button" onClick={handleModalClose}>
                取消
              </button>
              <span className={styles.modalTitle}>时间</span>
              <button type="button" onClick={handleModalConfirm}>
                完成
              </button>
            </div>

            {/* 时间范围显示（可点击切换） */}
            <div className={styles.timeRangeDisplay}>
              <button
                type="button"
                className={`${styles.timeRangeBtn} ${
                  editingType === "start" ? styles.timeRangeBtnActive : ""
                }`}
                onClick={() => handleToggleEditingType("start")}
              >
                {modalStartTime ? formatTime(modalStartTime) : "--:--"}
              </button>
              <span className={styles.timeRangeSeparator}>&gt;</span>
              <button
                type="button"
                className={`${styles.timeRangeBtn} ${
                  editingType === "end" ? styles.timeRangeBtnActive : ""
                }`}
                onClick={() => handleToggleEditingType("end")}
              >
                {modalEndTime ? formatTime(modalEndTime) : "--:--"}
              </button>
            </div>

            {/* 滚动选择器 */}
            <div className={styles.pickerContainer}>
              {/* 日期列 */}
              <div className={styles.pickerColumn}>
                <div className={styles.pickerLabel}>日期</div>
                <div className={styles.pickerWheel}>
                  {dateOptions.map((date, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`${styles.pickerItem} ${
                        currentEditingTime &&
                        date.getFullYear() ===
                          currentEditingTime.getFullYear() &&
                        date.getMonth() === currentEditingTime.getMonth() &&
                        date.getDate() === currentEditingTime.getDate()
                          ? styles.pickerItemActive
                          : ""
                      }`}
                      onClick={() => handleModalDateChange(date)}
                    >
                      {date.getMonth() + 1}/{date.getDate()}{" "}
                      {weekdays[date.getDay()]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 小时列 */}
              <div className={styles.pickerColumn}>
                <div className={styles.pickerLabel}>小时</div>
                <div className={styles.pickerWheel}>
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      className={`${styles.pickerItem} ${
                        currentEditingTime &&
                        currentEditingTime.getHours() === hour
                          ? styles.pickerItemActive
                          : ""
                      }`}
                      onClick={() => handleModalHourChange(hour)}
                    >
                      {hour.toString().padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>

              {/* 分钟列 */}
              <div className={styles.pickerColumn}>
                <div className={styles.pickerLabel}>分钟</div>
                <div className={styles.pickerWheel}>
                  {minutes.map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      className={`${styles.pickerItem} ${
                        currentEditingTime &&
                        currentEditingTime.getMinutes() === minute
                          ? styles.pickerItemActive
                          : ""
                      }`}
                      onClick={() => handleModalMinuteChange(minute)}
                    >
                      {minute.toString().padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 快捷按钮 */}
            <div className={styles.modalQuickButtons}>
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
        </div>
      )}
    </div>
  );
}
