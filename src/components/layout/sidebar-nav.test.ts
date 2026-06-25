import { describe, expect, it } from "vitest";
import { ACCOUNT_NAV_ITEM, APP_NAV_ITEM, STATUS_NAV_ITEM } from "./sidebar-nav";

describe("sidebar navigation", () => {
  it("uses the app mark as a home shortcut", () => {
    expect(APP_NAV_ITEM.href).toBe("/");
    expect(APP_NAV_ITEM.label).toBe("FocusFlow");
  });

  it("keeps the account shortcut inside the authenticated app", () => {
    expect(ACCOUNT_NAV_ITEM.href).not.toBe("/login");
    expect(ACCOUNT_NAV_ITEM.href).toBe("/settings");
  });

  it("uses a neutral focus status icon instead of an emoji streak", () => {
    expect(STATUS_NAV_ITEM.label).toBe("Focus streak");
    expect(STATUS_NAV_ITEM.icon).not.toBe("🔥");
  });
});
