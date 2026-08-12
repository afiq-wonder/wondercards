"use client";

import type { ReactNode } from "react";
import { PlatformProvider } from "@/platform/PlatformProvider";
import { PurchasesProvider } from "@/platform/purchases/PurchasesProvider";

export function AppProviders({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PurchasesProvider>
      <PlatformProvider>{children}</PlatformProvider>
    </PurchasesProvider>
  );
}
