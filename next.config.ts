import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Bundle files read from disk at runtime into the serverless functions:
  // /prompts Markdown (loadPrompt) and the embedded book fonts (lib/books/pdf-fonts).
  outputFileTracingIncludes: {
    "/**": ["./prompts/**/*", "./lib/fonts/*.ttf"],
  },
};

export default withSentryConfig(nextConfig, {
  // Organisation + Project — from the Sentry dashboard URL, static info.
  org: "buchwerk",
  project: "buchwerk-web",

  // Only upload source maps when an auth token is available (CI/production
  // with SENTRY_AUTH_TOKEN set). Keeps local dev fast and avoids upload
  // failures when the token is missing.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Widen the set of client files that get uploaded, so traces to bundled
  // chunks resolve back to readable source.
  widenClientFileUpload: true,

  // Silence the Sentry CLI output during builds unless we're in CI.
  silent: !process.env.CI,
});
