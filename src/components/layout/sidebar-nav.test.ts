import { describe, expect, it } from "vitest";
import { ACCOUNT_NAV_ITEM } from "./sidebar-nav";

describe("sidebar navigation", () => {
  it("keeps the account shortcut inside the authenticated app", () => {
    expect(ACCOUNT_NAV_ITEM.href).not.toBe("/login");
    expect(ACCOUNT_NAV_ITEM.href).toBe("/settings");
  });
});
