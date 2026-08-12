import type { CSSProperties } from "react";
import styles from "./wonder.module.css";

const particles = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  left: `${(index * 53) % 96}%`,
  top: `${8 + ((index * 31) % 82)}%`,
  size: `${2 + ((index * 5) % 5)}px`,
  duration: `${3.8 + ((index * 9) % 5)}s`,
  delay: `${-((index * 1.3) % 6)}s`,
}));

export function FloatingParticles() {
  return (
    <div className={styles.particles} aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className={styles.particle}
          style={{
            "--left": particle.left,
            "--top": particle.top,
            "--size": particle.size,
            "--duration": particle.duration,
            "--delay": particle.delay,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
