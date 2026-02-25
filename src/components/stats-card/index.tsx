import styles from "./index.module.scss";

interface StatsCardProps {
  number: number;
  label: string;
  variant?: "default" | "danger";
}

export function StatsCard({
  number,
  label,
  variant = "default",
}: StatsCardProps) {
  return (
    <div className={styles.statsCard}>
      <div
        className={`${styles.statsNumber} ${variant === "danger" ? styles.danger : ""}`}
      >
        {number}
      </div>
      <div className={styles.statsLabel}>{label}</div>
    </div>
  );
}
