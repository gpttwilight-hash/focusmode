# Install FocusFlow As An App

## Mac

1. Start FocusFlow locally or open the deployed FocusFlow URL.
2. Open it in Chrome or another Chromium-based browser.
3. Use the browser install action for FocusFlow.
   - In Chrome, look for the install icon in the address bar or use the browser menu.
4. Launch FocusFlow from Applications, Dock, Spotlight, or the app switcher.
5. Sign in with the same account you use on other devices.

This first Mac app path uses FocusFlow as an installable PWA. It gives FocusFlow its own window, Dock presence, and app-switcher entry without requiring App Store distribution.

## iPhone

1. Open FocusFlow in Safari.
2. Sign in with the same account used on Mac.
3. Open the Share sheet.
4. Choose **Add to Home Screen**.
5. Launch FocusFlow from the Home Screen.

For the second-screen timer flow, start a focus session on Mac, then open FocusFlow on iPhone. The active timer should refresh into the same session after sync.

## Local Network Testing

When testing from an iPhone against a local Mac dev server:

1. Make sure the Mac and iPhone are on the same Wi-Fi.
2. Run the dev server on the Mac.
3. Open the Mac local network URL from the iPhone, not `localhost`.

Example URL shape:

```text
http://<mac-local-ip>:3000
```

The authenticated cloud sync path requires the app server and database environment to be available from the device you are testing.

## Later Native Wrapper

If the PWA shell does not feel native enough on Mac after testing, the next step is a Tauri wrapper around the same FocusFlow app. That would keep the current web UI and synced timer logic while producing a more traditional `.app` bundle.
