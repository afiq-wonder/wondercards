"use client";
import type { ButtonHTMLAttributes } from "react";
import styles from "./wonder.module.css";
export function WonderPrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={`${styles.button} ${props.className ?? ""}`} />;
}
