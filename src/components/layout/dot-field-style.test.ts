import { describe, expect, it } from "vitest";
import {
  DOT_FIELD_BACKGROUND_PROPS,
  getDotFieldLayerClassName,
} from "./dot-field-style";

describe("Dot Field background style", () => {
  it("uses FocusFlow emerald tones instead of the default purple palette", () => {
    expect(DOT_FIELD_BACKGROUND_PROPS.gradientFrom).toBe("rgba(16, 185, 129, 0.34)");
    expect(DOT_FIELD_BACKGROUND_PROPS.gradientTo).toBe("rgba(20, 184, 166, 0.18)");
    expect(DOT_FIELD_BACKGROUND_PROPS.glowColor).toBe("rgba(16, 185, 129, 0.22)");
  });

  it("keeps the background calmer while the timer is running", () => {
    expect(getDotFieldLayerClassName("running")).toContain("opacity-35");
    expect(getDotFieldLayerClassName("idle")).toContain("opacity-75");
  });
});
