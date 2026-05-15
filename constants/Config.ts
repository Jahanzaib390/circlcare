/** Central config — all env vars and tuneable constants in one place */
const Config = {
  // API
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001',

  // Polling
  bookingStatusPollIntervalMs: 5_000,

  // Timeouts
  apiTimeoutMs: 15_000,

  // Matching
  confidenceThreshold: 0.7,
  maxMatchResults: 3,

  // Pagination
  recentRequestsLimit: 10,
} as const;

export default Config;
