import { describe, expect, it } from "vitest";
import { createWonderDNA } from "../platform/dna";
import { applyGrowth } from "../platform/growth";

describe("applyGrowth", () => {
  it("awards XP and updates WonderDNA", () => {
    const dna = createWonderDNA("family-test");

    const result = applyGrowth({
      dna,
      familyId: "family-test",
      cycleId: "cycle-test",
      trait: "curiosity",
    });

    expect(result.dna.adventureCount).toBe(1);
    expect(result.dna.wonderMoments).toBe(1);
    expect(
      result.dna.traits.curiosity.xp,
    ).toBe(10);
    expect(
      result.growthEvent.xpAwarded,
    ).toBe(10);
  });
});
