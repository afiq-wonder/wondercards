"use client";

import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import {
  createWonderPlatform,
  type WonderPlatform,
} from "./wonder-platform";

const WonderPlatformContext =
  createContext<WonderPlatform | null>(null);

export function PlatformProvider({
  children,
}: {
  children: ReactNode;
}) {
  const platformRef =
    useRef<WonderPlatform | null>(null);

  if (!platformRef.current) {
    platformRef.current = createWonderPlatform();
  }

  return (
    <WonderPlatformContext.Provider
      value={platformRef.current}
    >
      {children}
    </WonderPlatformContext.Provider>
  );
}

export function useWonderPlatform(): WonderPlatform {
  const platform = useContext(
    WonderPlatformContext,
  );

  if (!platform) {
    throw new Error(
      "useWonderPlatform must be used inside PlatformProvider.",
    );
  }

  return platform;
}
