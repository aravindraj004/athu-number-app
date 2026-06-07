// Loads a local .env file if present (no dependency). On hosting platforms the
// environment variables are already set, so the missing file is simply ignored.
// Imported first (before db.js) so DB credentials are available at import time.
try {
  process.loadEnvFile()
} catch {
  /* no .env file — fine */
}
