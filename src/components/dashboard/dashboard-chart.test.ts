import { describe, expect, it } from "vitest";
import { DASHBOARD_CHART_MARGIN, DASHBOARD_CHART_TICK } from "./dashboard-chart";

describe("dashboard chart layout", () => {
  it("keeps enough chart padding for axis labels", () => {
    expect(DASHBOARD_CHART_MARGIN.left).toBeGreaterThanOrEqual(8);
    expect(DASHBOARD_CHART_MARGIN.bottom).toBeGreaterThanOrEqual(24);
  });

  it("uses compact axis typography", () => {
    expect(DASHBOARD_CHART_TICK.fontSize).toBeLessThanOrEqual(11);
  });
});
