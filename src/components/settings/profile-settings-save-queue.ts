import type { ProfileTimerSettings } from "@/lib/settings/timer-settings";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

type ProfileSettingsSaveQueueOptions = {
  save: (settings: ProfileTimerSettings) => Promise<ProfileTimerSettings>;
  applySavedSettings: (settings: ProfileTimerSettings) => void;
  setSaveStatus: (status: SaveStatus) => void;
};

export function createProfileSettingsSaveQueue({
  save,
  applySavedSettings,
  setSaveStatus,
}: ProfileSettingsSaveQueueOptions) {
  let inFlight = false;
  let queuedSettings: ProfileTimerSettings | null = null;

  async function run(settings: ProfileTimerSettings) {
    inFlight = true;
    setSaveStatus("saving");

    try {
      const savedSettings = await save(settings);
      applySavedSettings(savedSettings);

      if (!queuedSettings) {
        setSaveStatus("saved");
      }
    } catch {
      if (!queuedSettings) {
        setSaveStatus("error");
      }
    } finally {
      inFlight = false;

      if (queuedSettings) {
        const nextSettings = queuedSettings;
        queuedSettings = null;
        void run(nextSettings);
      }
    }
  }

  return {
    enqueue(settings: ProfileTimerSettings) {
      queuedSettings = settings;

      if (!inFlight) {
        const nextSettings = queuedSettings;
        queuedSettings = null;
        void run(nextSettings);
      }
    },
  };
}
