"use client";

import { useMemo } from "react";

import WonderFlow from "@/components/flow/WonderFlow";

import {
  wonderCardBuilder,
  wonderDNAEngine,
} from "@/engine";

const FAMILY_ID = "afiq-family";

export default function WonderApp() {
  const card = useMemo(() => {
    const genome =
      wonderDNAEngine.generateDailyGenome({
        familyId: FAMILY_ID,

        archetypeId: "wonder",

        date: new Date(),

        ageRange: {
          min: 4,
          max: 6,
        },

        duration: 5,
      });

    return wonderCardBuilder.build(
      genome,
      {
        version: genome.version,

        status: "ready",

        wonderScore: 0,

        createdAt: genome.createdAt,
      }
    );
  }, []);

  return <WonderFlow card={card} />;
}