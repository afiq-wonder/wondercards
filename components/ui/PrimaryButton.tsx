"use client";

import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

interface PrimaryButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
}

export function PrimaryButton({
  children,
  fullWidth = true,
  className = "",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      {...props}
      className={[
        "rounded-2xl bg-slate-900 px-6 py-4",
        "font-semibold text-white shadow-lg",
        "transition hover:-translate-y-0.5",
        "hover:shadow-xl disabled:cursor-not-allowed",
        "disabled:opacity-50",
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
