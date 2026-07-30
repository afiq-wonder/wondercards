import { describe, expect, it } from "vitest";
import { generateWonderGenome } from "../platform/genome";

describe("generateWonderGenome", () => {
  it("is deterministic for the same seed", () => {
    const first = generateWonderGenome({
      familyId: "family-test",
      date: "2026-07-29",
      seed: "same-seed",
    });

    const second = generateWonderGenome({
      familyId: "family-test",
      date: "2026-07-29",
      seed: "same-seed",
    });

    expect(first.friend).toBe(second.friend);
    expect(first.world).toBe(second.world);
    expect(first.value).toBe(second.value);
  });
});
