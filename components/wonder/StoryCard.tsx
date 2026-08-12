import type { ReactNode } from "react";
import styles from "./wonder.module.css";
export function StoryCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.storyCard} ${className}`}>{children}</div>;
}
