import type { ReactNode } from "react";
import styles from "./wonder.module.css";
export function PageTransition({ sceneKey, children }: { sceneKey: string; children: ReactNode }) {
  return <div key={sceneKey} className={styles.transition}>{children}</div>;
}
