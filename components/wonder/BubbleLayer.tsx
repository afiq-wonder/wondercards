import type { CSSProperties } from "react";
import styles from "./wonder.module.css";

const bubbles = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 96}%`,
  size: `${18 + ((index * 13) % 38)}px`,
  duration: `${8 + ((index * 7) % 8)}s`,
  delay: `${-((index * 1.9) % 13)}s`,
}));

export function BubbleLayer() {
  return (
    <div className={styles.bubbles} aria-hidden="true">
      {bubbles.map((bubble) => (
        <span
          key={bubble.id}
          className={styles.bubble}
          style={{
            "--left": bubble.left,
            "--size": bubble.size,
            "--duration": bubble.duration,
            "--delay": bubble.delay,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
