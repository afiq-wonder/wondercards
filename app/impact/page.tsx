"use client";

import { useEffect, useMemo, useState } from "react";

import type { WonderProofEvent } from "@/platform/types";
import { useWonderPlatform } from "@/platform/PlatformProvider";

type ImpactMetrics = {
  familiesTested: number;
  adventuresStarted: number;
  missionsCompleted: number;
  momentsSaved: number;
  adventuresCompleted: number;
  ratingsCount: number;
  averageRating: number;
  wonderConversion: number;
  completionRate: number;
  wonderMomentRate: number;
  repeatFamilies: number;
  repeatFamilyRate: number;
};

function percentage(
  numerator: number,
  denominator: number,
): number {
  if (denominator === 0) {
    return 0;
  }

  return Math.round(
    (numerator / denominator) * 1000,
  ) / 10;
}

function calculateMetrics(
  events: WonderProofEvent[],
): ImpactMetrics {
  const adventuresStarted =
    events.filter(
      (event) =>
        event.type === "adventure_started",
    );

  const missionsCompleted =
    events.filter(
      (event) =>
        event.type === "mission_completed",
    );

  const momentsSaved =
    events.filter(
      (event) =>
        event.type === "moment_saved",
    );

  const adventuresCompleted =
    events.filter(
      (event) =>
        event.type === "adventure_completed",
    );

  const ratings =
    events
      .filter(
        (event) =>
          event.type === "experience_rated",
      )
      .map((event) => {
        const rating =
          event.metadata?.rating;

        return typeof rating === "number"
          ? rating
          : null;
      })
      .filter(
        (rating): rating is number =>
          rating !== null,
      );

  const familyAdventureCounts =
    new Map<string, number>();

  for (const event of adventuresStarted) {
    const count =
      familyAdventureCounts.get(
        event.familyId,
      ) ?? 0;

    familyAdventureCounts.set(
      event.familyId,
      count + 1,
    );
  }

  const familiesTested =
    familyAdventureCounts.size;

  const repeatFamilies =
    Array.from(
      familyAdventureCounts.values(),
    ).filter(
      (count) => count > 1,
    ).length;

  const averageRating =
    ratings.length > 0
      ? Math.round(
          (ratings.reduce(
            (sum, rating) =>
              sum + rating,
            0,
          ) /
            ratings.length) *
            10,
        ) / 10
      : 0;

  return {
    familiesTested,
    adventuresStarted:
      adventuresStarted.length,
    missionsCompleted:
      missionsCompleted.length,
    momentsSaved:
      momentsSaved.length,
    adventuresCompleted:
      adventuresCompleted.length,
    ratingsCount:
      ratings.length,
    averageRating,

    wonderConversion:
      percentage(
        missionsCompleted.length,
        adventuresStarted.length,
      ),

    completionRate:
      percentage(
        adventuresCompleted.length,
        adventuresStarted.length,
      ),

    wonderMomentRate:
      percentage(
        momentsSaved.length,
        adventuresStarted.length,
      ),

    repeatFamilies,

    repeatFamilyRate:
      percentage(
        repeatFamilies,
        familiesTested,
      ),
  };
}

function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      {note ? (
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {note}
        </p>
      ) : null}
    </div>
  );
}

export default function ImpactPage() {
  const platform =
    useWonderPlatform();

  const [events, setEvents] =
    useState<WonderProofEvent[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    let active = true;

    async function loadImpact() {
      try {
        const proofEvents =
          await platform.getProofEvents();

        if (active) {
          setEvents(proofEvents);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadImpact();

    return () => {
      active = false;
    };
  }, [platform]);

  const metrics =
    useMemo(
      () =>
        calculateMetrics(events),
      [events],
    );

  const recentEvents =
    useMemo(
      () =>
        events.slice(0, 12),
      [events],
    );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-slate-500">
            Loading Wonder Proof...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">
            WonderLabs
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
            Wonder Proof
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Evidence that WonderCards is turning
            short digital experiences into
            meaningful real-world family moments.
          </p>
        </header>

        <section className="mt-8 rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm font-medium text-slate-300">
            Core Impact Metric
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-5xl font-bold tracking-tight">
                {metrics.wonderConversion}%
              </p>

              <p className="mt-2 text-lg font-semibold">
                Wonder Conversion
              </p>
            </div>

            <p className="max-w-md text-sm leading-6 text-slate-300">
              The percentage of started adventures
              that became completed real-world
              Wonder Missions.
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Families Tested"
            value={String(
              metrics.familiesTested,
            )}
            note="Unique anonymous family IDs."
          />

          <MetricCard
            label="Adventures Started"
            value={String(
              metrics.adventuresStarted,
            )}
            note="Total Wonder Cycles started."
          />

          <MetricCard
            label="Mission Completed"
            value={String(
              metrics.missionsCompleted,
            )}
            note="Families who reported completing the offline mission."
          />

          <MetricCard
            label="Wonder Moments"
            value={String(
              metrics.momentsSaved,
            )}
            note="Family memories successfully saved."
          />
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Completion Rate"
            value={`${metrics.completionRate}%`}
            note="Completed adventures divided by started adventures."
          />

          <MetricCard
            label="Wonder Moment Rate"
            value={`${metrics.wonderMomentRate}%`}
            note="Saved memories divided by started adventures."
          />

          <MetricCard
            label="Average Rating"
            value={
              metrics.ratingsCount > 0
                ? `${metrics.averageRating}/5`
                : "—"
            }
            note={
              metrics.ratingsCount > 0
                ? `${metrics.ratingsCount} family rating${
                    metrics.ratingsCount === 1
                      ? ""
                      : "s"
                  }.`
                : "No ratings yet."
            }
          />

          <MetricCard
            label="Repeat Families"
            value={`${metrics.repeatFamilyRate}%`}
            note={`${metrics.repeatFamilies} families started more than one adventure.`}
          />
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                Proof Funnel
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Screen → Real World → Memory
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {metrics.adventuresStarted} sessions
              tracked
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <FunnelRow
              label="Adventure Started"
              value={
                metrics.adventuresStarted
              }
              percent={100}
            />

            <FunnelRow
              label="Mission Completed"
              value={
                metrics.missionsCompleted
              }
              percent={
                metrics.wonderConversion
              }
            />

            <FunnelRow
              label="Wonder Moment Saved"
              value={
                metrics.momentsSaved
              }
              percent={
                metrics.wonderMomentRate
              }
            />

            <FunnelRow
              label="Adventure Completed"
              value={
                metrics.adventuresCompleted
              }
              percent={
                metrics.completionRate
              }
            />
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Recent Proof Events
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Latest activity
          </h2>

          {recentEvents.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-sm leading-6 text-slate-500">
              No Wonder Proof data yet. Complete an
              adventure and return here to see the
              evidence appear.
            </div>
          ) : (
            <div className="mt-6 divide-y divide-slate-100">
              {recentEvents.map(
                (event) => (
                  <div
                    key={event.id}
                    className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {event.type}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Family {event.familyId}
                        {" · "}
                        {event.adventureId}
                      </p>
                    </div>

                    <p className="text-xs text-slate-400">
                      {new Date(
                        event.createdAt,
                      ).toLocaleString()}
                    </p>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FunnelRow({
  label,
  value,
  percent,
}: {
  label: string;
  value: number;
  percent: number;
}) {
  const width =
    Math.max(
      0,
      Math.min(100, percent),
    );

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium text-slate-700">
          {label}
        </p>

        <p className="text-sm font-semibold text-slate-900">
          {value} · {percent}%
        </p>
      </div>

      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900 transition-all"
          style={{
            width: `${width}%`,
          }}
        />
      </div>
    </div>
  );
}