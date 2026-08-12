import type { CSSProperties } from "react";
import styles from "./wonder.module.css";
const symbols = ["✨", "⭐", "🫧", "💛", "🌱"];
export function CelebrationEffect({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className={styles.celebration} aria-hidden="true">
      {Array.from({ length: 24 }, (_, index) => (
        <span key={index} className={styles.spark} style={{
          "--left": `${(index * 43) % 96}%`,
          "--size": `${14 + ((index * 11) % 18)}px`,
          "--duration": `${2.6 + ((index * 7) % 3)}s`,
          "--delay": `${(index % 8) * 0.09}s`,
        } as CSSProperties}>{symbols[index % symbols.length]}</span>
      ))}
    </div>
  );
}
