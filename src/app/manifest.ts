import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FocusFlow",
    short_name: "FocusFlow",
    description: "A calm focus timer with synced deep-work sessions.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#080f0e",
    theme_color: "#10b981",
    orientation: "any",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/maskable-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
