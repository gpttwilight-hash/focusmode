import { describe, expect, it, vi } from "vitest";
import { stopAudioNodes } from "./generated-audio-handle";

describe("stopAudioNodes", () => {
  it("stops and disconnects every generated audio node", () => {
    const leftOscillator = { stop: vi.fn(), disconnect: vi.fn() };
    const rightOscillator = { stop: vi.fn(), disconnect: vi.fn() };
    const gainNode = { disconnect: vi.fn() };

    stopAudioNodes([leftOscillator, rightOscillator, gainNode]);

    expect(leftOscillator.stop).toHaveBeenCalledOnce();
    expect(rightOscillator.stop).toHaveBeenCalledOnce();
    expect(leftOscillator.disconnect).toHaveBeenCalledOnce();
    expect(rightOscillator.disconnect).toHaveBeenCalledOnce();
    expect(gainNode.disconnect).toHaveBeenCalledOnce();
  });

  it("continues disconnecting nodes when one stop call has already expired", () => {
    const expiredOscillator = {
      stop: vi.fn(() => {
        throw new Error("already stopped");
      }),
      disconnect: vi.fn(),
    };
    const activeOscillator = { stop: vi.fn(), disconnect: vi.fn() };

    stopAudioNodes([expiredOscillator, activeOscillator]);

    expect(expiredOscillator.disconnect).toHaveBeenCalledOnce();
    expect(activeOscillator.stop).toHaveBeenCalledOnce();
    expect(activeOscillator.disconnect).toHaveBeenCalledOnce();
  });
});
