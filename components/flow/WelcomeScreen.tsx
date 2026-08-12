"use client";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useWonderCycle } from "@/platform/WonderCycleContext";
import { usePurchases } from "@/platform/purchases/PurchasesProvider";
import { FlowShell } from "./FlowShell";

export function WelcomeScreen() {
  const {
    card,
    beginAdventure,
    isBusy,
    error,
  } = useWonderCycle();
  const {
    status: purchaseStatus,
    isPremium,
    isBusy: isPurchaseBusy,
    error: purchaseError,
    showPaywall,
    restorePurchases,
  } = usePurchases();

  return (
    <FlowShell
      eyebrow="✨ It’s Wonder Time!"
      title={`${card.emoji} ${card.title}`}
    >
      <p className="text-lg leading-8 text-slate-600">
        {card.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">
          {card.duration}
        </span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
          Ages {card.ageRange}
        </span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
          {card.activityType}
        </span>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-7">
        <PrimaryButton
          onClick={() => void beginAdventure()}
          disabled={isBusy}
        >
          {isBusy
            ? "Starting Wonder Cycle..."
            : "Begin Adventure!"}
        </PrimaryButton>
      </div>

      {purchaseStatus === "ready" ? (
        <section
          aria-label="WonderCards Plus membership"
          className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/70 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">
                WonderCards+
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {isPremium
                  ? "Membership active"
                  : "Explore membership options"}
              </p>
            </div>
            {isPremium ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                Active
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void showPaywall()}
                disabled={isPurchaseBusy}
                className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPurchaseBusy ? "Opening..." : "View options"}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => void restorePurchases()}
            disabled={isPurchaseBusy}
            className="mt-3 text-sm font-medium text-sky-800 underline decoration-sky-300 underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Restore purchases
          </button>

          {purchaseError ? (
            <p
              role="alert"
              className="mt-3 text-sm text-red-700"
            >
              {purchaseError}
            </p>
          ) : null}
        </section>
      ) : purchaseStatus === "error" ? (
        <p
          role="status"
          className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"
        >
          WonderCards+ is temporarily unavailable.
        </p>
      ) : null}
    </FlowShell>
  );
}
