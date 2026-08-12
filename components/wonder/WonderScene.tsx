import type { ReactNode } from "react";
import { AmbientLight } from "./AmbientLight";
import { BubbleLayer } from "./BubbleLayer";
import { FloatingParticles } from "./FloatingParticles";
import styles from "./wonder.module.css";

export function WonderScene({ children }: { children: ReactNode }) {
  return (
    <main className={styles.scene}>
      <AmbientLight />
      <BubbleLayer />
      <FloatingParticles />
      <div className={styles.content}>{children}</div>
    </main>
  );
}
