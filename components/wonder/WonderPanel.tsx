import type { ReactNode } from "react";
import styles from "./wonder.module.css";
export function WonderPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`${styles.card} ${className}`}>{children}</section>;
}
