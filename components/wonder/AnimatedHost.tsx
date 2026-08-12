import styles from "./wonder.module.css";
export function AnimatedHost({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} className={`${styles.host} ${className}`} />;
}
