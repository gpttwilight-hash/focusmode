export type YouTubeSource =
  | {
      kind: "video";
      id: string;
    }
  | {
      kind: "playlist";
      id: string;
    };

const youtubeHosts = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);

export function parseYouTubeUrl(value: string): YouTubeSource | null {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (!youtubeHosts.has(url.hostname)) {
    return null;
  }

  const playlistId = url.searchParams.get("list");

  if (playlistId) {
    return { kind: "playlist", id: playlistId };
  }

  if (url.hostname === "youtu.be") {
    const videoId = url.pathname.split("/").filter(Boolean)[0];
    return videoId ? { kind: "video", id: videoId } : null;
  }

  const videoId = url.searchParams.get("v");

  if (videoId) {
    return { kind: "video", id: videoId };
  }

  const embedMatch = url.pathname.match(/^\/embed\/([^/?#]+)/);

  if (embedMatch?.[1] && embedMatch[1] !== "videoseries") {
    return { kind: "video", id: embedMatch[1] };
  }

  return null;
}

export function createYouTubeEmbedUrl(source: YouTubeSource, origin?: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    enablejsapi: "1",
    playsinline: "1",
    controls: "1",
    rel: "0",
  });

  if (origin) {
    params.set("origin", origin);
  }

  if (source.kind === "playlist") {
    params.set("listType", "playlist");
    params.set("list", source.id);
    return `https://www.youtube.com/embed/videoseries?${params.toString()}`;
  }

  params.set("loop", "1");
  params.set("playlist", source.id);

  return `https://www.youtube.com/embed/${source.id}?${params.toString()}`;
}
