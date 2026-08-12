"use client";

import type { ReactNode } from "react";
import { PlatformProvider } from "@/platform/PlatformProvider";

export function AppProviders({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PlatformProvider>{children}</PlatformProvider>
  );
}
