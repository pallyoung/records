import { useState, useRef, useEffect } from "react";
import styles from "./index.module.scss";

export interface TimePickerWheelProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
}

export function TimePickerWheel({ value, onChange }: TimePickerWheelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(value?.getHours() ?? 9);
  const [minutes, setMinutes] = useState(value?.getMinutes() ?? 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  // Sync hours and minutes with external value changes
  useEffect(() => {
    if (value) {
      setHours(value.getHours());
      setMinutes(value.getMinutes());
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

  const handleConfirm = () => {
    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    onChange?.(newDate);
    setIsOpen(false);
  };

  const formatDisplayTime = (date: Date | null) => {
    if (!date) return "选择时间";
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const handleScroll = (
    e: React.UIEvent<HTMLDivElement>,
    options: number[],
    setter: (val: number) => void,
  ) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const itemHeight = 40;
    const index = Math.round(scrollTop / itemHeight);
    setter(options[Math.min(index, options.length - 1)]);
  };

  return (
    <div className={styles.timePicker} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        {formatDisplayTime(value ?? null)}
      </button>
      {isOpen && (
        <div className={styles.popup}>
          <div className={styles.wheelContainer}>
            <div
              className={styles.wheel}
              ref={hoursRef}
              onScroll={(e) => handleScroll(e, hourOptions, setHours)}
            >
              {hourOptions.map((h) => (
                <div
                  key={h}
                  className={`${styles.option} ${hours === h ? styles.selected : ""}`}
                >
                  {h.toString().padStart(2, "0")}
                </div>
              ))}
            </div>
            <span className={styles.separator}>:</span>
            <div
              className={styles.wheel}
              ref={minutesRef}
              onScroll={(e) => handleScroll(e, minuteOptions, setMinutes)}
            >
              {minuteOptions.map((m) => (
                <div
                  key={m}
                  className={`${styles.option} ${minutes === m ? styles.selected : ""}`}
                >
                  {m.toString().padStart(2, "0")}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={() => setIsOpen(false)}>
              取消
            </button>
            <button
              type="button"
              className={styles.confirm}
              onClick={handleConfirm}
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
