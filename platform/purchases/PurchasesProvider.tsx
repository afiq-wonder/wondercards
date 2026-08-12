"use client";

import { Capacitor } from "@capacitor/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CustomerInfo } from "@revenuecat/purchases-capacitor";

export const WONDERCARDS_ENTITLEMENT_ID = "wondercards_plus";

const REVENUECAT_API_KEY =
  process.env.NEXT_PUBLIC_REVENUECAT_API_KEY?.trim() ?? "";

type PurchasesPlugin =
  typeof import("@revenuecat/purchases-capacitor").Purchases;

export type PurchasesStatus =
  | "loading"
  | "unavailable"
  | "ready"
  | "error";

interface PurchasesContextValue {
  status: PurchasesStatus;
  isPremium: boolean;
  isBusy: boolean;
  error: string | null;
  showPaywall(): Promise<boolean>;
  restorePurchases(): Promise<boolean>;
}

const PurchasesContext =
  createContext<PurchasesContextValue | null>(null);

let configuredPurchasesPromise: Promise<PurchasesPlugin> | null =
  null;

function isWonderCardsPlusActive(
  customerInfo: CustomerInfo,
): boolean {
  return Boolean(
    customerInfo.entitlements.active[
      WONDERCARDS_ENTITLEMENT_ID
    ],
  );
}

function getErrorMessage(cause: unknown): string {
  if (cause instanceof Error && cause.message.trim()) {
    return cause.message;
  }

  return "Purchases are unavailable right now. Please try again.";
}

function configurePurchases(
  apiKey: string,
): Promise<PurchasesPlugin> {
  if (!configuredPurchasesPromise) {
    configuredPurchasesPromise = (async () => {
      const { Purchases, LOG_LEVEL } = await import(
        "@revenuecat/purchases-capacitor"
      );
      const { isConfigured } =
        await Purchases.isConfigured();

      if (!isConfigured) {
        if (apiKey.startsWith("test_")) {
          await Purchases.setLogLevel({
            level: LOG_LEVEL.DEBUG,
          });
        }

        await Purchases.configure({ apiKey });
      }

      return Purchases;
    })().catch((cause) => {
      configuredPurchasesPromise = null;
      throw cause;
    });
  }

  return configuredPurchasesPromise;
}

export function PurchasesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [status, setStatus] =
    useState<PurchasesStatus>("loading");
  const [isPremium, setIsPremium] =
    useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const refreshCustomerInfo = useCallback(
    async (): Promise<boolean> => {
      if (!REVENUECAT_API_KEY) {
        return false;
      }

      const purchases = await configurePurchases(
        REVENUECAT_API_KEY,
      );
      const { customerInfo } =
        await purchases.getCustomerInfo();
      const active =
        isWonderCardsPlusActive(customerInfo);

      setIsPremium(active);
      return active;
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    let purchases: PurchasesPlugin | null = null;
    let listenerId: string | null = null;

    async function initialise(): Promise<void> {
      if (
        !Capacitor.isNativePlatform() ||
        Capacitor.getPlatform() !== "android" ||
        !REVENUECAT_API_KEY
      ) {
        setStatus("unavailable");
        return;
      }

      try {
        purchases = await configurePurchases(
          REVENUECAT_API_KEY,
        );

        if (cancelled) {
          return;
        }

        const { customerInfo } =
          await purchases.getCustomerInfo();

        if (cancelled) {
          return;
        }

        setIsPremium(
          isWonderCardsPlusActive(customerInfo),
        );
        const addedListenerId =
          await purchases.addCustomerInfoUpdateListener(
            (updatedCustomerInfo) => {
              if (!cancelled) {
                setIsPremium(
                  isWonderCardsPlusActive(
                    updatedCustomerInfo,
                  ),
                );
              }
            },
          );

        if (cancelled) {
          await purchases.removeCustomerInfoUpdateListener({
            listenerToRemove: addedListenerId,
          });
          return;
        }

        listenerId = addedListenerId;
        setStatus("ready");
        setError(null);
      } catch (cause) {
        if (!cancelled) {
          setStatus("error");
          setError(getErrorMessage(cause));
        }
      }
    }

    void initialise();

    return () => {
      cancelled = true;

      if (purchases && listenerId) {
        void purchases.removeCustomerInfoUpdateListener({
          listenerToRemove: listenerId,
        });
      }
    };
  }, []);

  const showPaywall = useCallback(
    async (): Promise<boolean> => {
      if (
        status !== "ready" ||
        !REVENUECAT_API_KEY
      ) {
        return false;
      }

      setIsBusy(true);
      setError(null);

      try {
        const { RevenueCatUI } = await import(
          "@revenuecat/purchases-capacitor-ui"
        );

        await RevenueCatUI.presentPaywallIfNeeded({
          requiredEntitlementIdentifier:
            WONDERCARDS_ENTITLEMENT_ID,
        });

        return await refreshCustomerInfo();
      } catch (cause) {
        setError(getErrorMessage(cause));
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [refreshCustomerInfo, status],
  );

  const restorePurchases = useCallback(
    async (): Promise<boolean> => {
      if (
        status !== "ready" ||
        !REVENUECAT_API_KEY
      ) {
        return false;
      }

      setIsBusy(true);
      setError(null);

      try {
        const purchases = await configurePurchases(
          REVENUECAT_API_KEY,
        );
        const { customerInfo } =
          await purchases.restorePurchases();
        const active =
          isWonderCardsPlusActive(customerInfo);

        setIsPremium(active);
        return active;
      } catch (cause) {
        setError(getErrorMessage(cause));
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [status],
  );

  const value = useMemo(
    () => ({
      status,
      isPremium,
      isBusy,
      error,
      showPaywall,
      restorePurchases,
    }),
    [
      status,
      isPremium,
      isBusy,
      error,
      showPaywall,
      restorePurchases,
    ],
  );

  return (
    <PurchasesContext.Provider value={value}>
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases(): PurchasesContextValue {
  const context = useContext(PurchasesContext);

  if (!context) {
    throw new Error(
      "usePurchases must be used inside PurchasesProvider.",
    );
  }

  return context;
}
