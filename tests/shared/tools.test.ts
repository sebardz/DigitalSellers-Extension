import { describe, expect, it } from "vitest";

import { getTool, listEnabledTools } from "../../src/shared/tools";

describe("tool registry", () => {
  it("keeps experimental tools hidden from the production menu", () => {
    expect(listEnabledTools()).toEqual([]);
  });

  it("resolves the simulator definition by its stable identifier", () => {
    expect(getTool("simulator-calc")).toMatchObject({
      enabled: false,
      scraperId: "simulator",
      targetPath: "/",
    });
  });
});
