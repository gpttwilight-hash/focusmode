import { describe, expect, it, vi } from "vitest";
import { createProfileSettingsSaveQueue } from "./profile-settings-save-queue";
import type { ProfileTimerSettings } from "@/lib/settings/timer-settings";

function settings(minutes: number): ProfileTimerSettings {
  return {
    focusDurationSeconds: minutes * 60,
    shortBreakDurationSeconds: 5 * 60,
    longBreakDurationSeconds: 15 * 60,
    desktopNotificationsEnabled: false,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

describe("profile settings save queue", () => {
  it("sends the latest queued timer settings after an in-flight save finishes", async () => {
    const firstSave = deferred<ProfileTimerSettings>();
    const save = vi
      .fn<Parameters<typeof createProfileSettingsSaveQueue>[0]["save"]>()
      .mockReturnValueOnce(firstSave.promise)
      .mockResolvedValueOnce(settings(90));
    const applySavedSettings = vi.fn();
    const setSaveStatus = vi.fn();
    const queue = createProfileSettingsSaveQueue({
      save,
      applySavedSettings,
      setSaveStatus,
    });

    queue.enqueue(settings(69));
    queue.enqueue(settings(70));
    queue.enqueue(settings(90));

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(settings(69));

    firstSave.resolve(settings(69));
    await firstSave.promise;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(settings(90));
    expect(applySavedSettings).toHaveBeenLastCalledWith(settings(90));
    expect(setSaveStatus).toHaveBeenLastCalledWith("saved");
  });
});
