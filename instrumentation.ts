/**
 * Runs once as the server starts (Next.js calls it): connects to the database
 * and makes its tables then, so the first visitor doesn't wait about a second
 * for it. It doesn't hold up the start; if the database isn't reachable yet,
 * the first request tries again.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { getDb } = await import('./lib/db');
  getDb().catch((error) => console.error('Database not ready at start (the first request tries again):', error));
}
