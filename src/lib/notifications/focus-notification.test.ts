import { describe, expect, it, vi } from "vitest";
import { showTimerCompleteNotification } from "./focus-notification";

describe("showTimerCompleteNotification", () => {
  it("shows a notification when profile notifications are enabled and permission is granted", () => {
    const createNotification = vi.fn();

    showTimerCompleteNotification({
      enabled: true,
      permission: "granted",
      mode: "focus",
      createNotification,
    });

    expect(createNotification).toHaveBeenCalledWith("Focus session complete", {
      body: "Nice work. Time for a break.",
      tag: "focusflow-timer-complete",
    });
  });

  it("does not show a notification when the user disabled them", () => {
    const createNotification = vi.fn();

    showTimerCompleteNotification({
      enabled: false,
      permission: "granted",
      mode: "focus",
      createNotification,
    });

    expect(createNotification).not.toHaveBeenCalled();
  });
});
