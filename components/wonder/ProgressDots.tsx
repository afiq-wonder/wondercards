import styles from "./wonder.module.css";
export function ProgressDots({ current, total = 6 }: { current: number; total?: number }) {
  return (
    <div className={styles.progress} aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, index) => {
        const active = index + 1 <= current;
        return <span key={index} className={`${styles.dot} ${active ? styles.dotActive : ""}`} />;
      })}
    </div>
  );
}
