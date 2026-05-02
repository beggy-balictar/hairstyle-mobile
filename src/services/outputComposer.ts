export function normalizeScore(score?: number): number {
  if (typeof score !== 'number' || Number.isNaN(score)) return 0;
  if (score <= 1) return Math.max(0, score);
  if (score <= 100) return Math.max(0, score / 100);
  return Math.min(1, score / 10000);
}
