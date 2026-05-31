import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const baseConfig: NextConfig = {
  reactStrictMode: true,
};

// Only run the Sentry build plugin when the upload token is present —
// otherwise it would fail every build that does not have the token
// (local dev, preview deploys without secrets).
const config: NextConfig =
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
    ? withSentryConfig(baseConfig, {
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        silent: !process.env.CI,
        widenClientFileUpload: true,
        sourcemaps: { deleteSourcemapsAfterUpload: true },
        disableLogger: true,
        telemetry: false,
      })
    : baseConfig;

export default config;
