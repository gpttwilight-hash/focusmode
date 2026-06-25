import { describe, expect, it } from "vitest";
import { parseYouTubeUrl } from "./youtube-url";

describe("parseYouTubeUrl", () => {
  it("parses a YouTube playlist URL", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/playlist?list=PLabc123")).toEqual({
      kind: "playlist",
      id: "PLabc123",
    });
  });

  it("prefers the playlist from a watch URL that includes list", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/watch?v=jfKfPfyJRdk&list=PLfocus")).toEqual({
      kind: "playlist",
      id: "PLfocus",
    });
  });

  it("parses a short video URL", () => {
    expect(parseYouTubeUrl("https://youtu.be/jfKfPfyJRdk")).toEqual({
      kind: "video",
      id: "jfKfPfyJRdk",
    });
  });

  it("rejects non-YouTube URLs", () => {
    expect(parseYouTubeUrl("https://example.com/music")).toBeNull();
  });
});
