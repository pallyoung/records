import { DatePicker } from "../date-picker";
import { TimePickerWheel } from "../time-picker-wheel";
import styles from "./index.module.scss";

export interface DateTimeRowProps {
  label: string;
  value?: Date | null;
  onChange?: (date: Date | null) => void;
}

export function DateTimeRow({ label, value, onChange }: DateTimeRowProps) {
  const handleDateChange = (date: Date) => {
    const newDate = value ? new Date(value) : new Date();
    newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    onChange?.(newDate);
  };

  const handleTimeChange = (date: Date) => {
    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(date.getHours(), date.getMinutes());
    onChange?.(newDate);
  };

  return (
    <div className={styles.dateTimeRow}>
      <span className={styles.label}>{label}</span>
      <div className={styles.pickers}>
        <div className={styles.picker}>
          <DatePicker value={value} onChange={handleDateChange} />
        </div>
        <div className={styles.picker}>
          <TimePickerWheel value={value} onChange={handleTimeChange} />
        </div>
      </div>
    </div>
  );
}
