// =============================================================
// EcoSphere — Scoring engine (ScoreProvider fan-in)
// OWNER: Shivam (platform).
//
// Each domain module (environmental, social, governance) registers a
// ScoreProvider. The engine fans in across all registered providers,
// applies the weights from esg_config, and returns a 0..100 total.
//
// Module owners: register your provider once in registerProviders()
// below (a one-line sanctioned cross-boundary edit). Do NOT change the
// contract itself.
//
// ---------------------------------------------------------------
// PILLAR OWNERS — HOW TO REGISTER YOUR REAL PROVIDER (read this):
//   1. Implement the ScoreProvider contract below in YOUR module
//      folder (e.g. src/server/.../environmental-score-provider.ts).
//   2. In registerProviders() at the bottom of THIS file, REPLACE
//      your pillar's stub line with your real provider, e.g.:
//         registerProvider(environmentalScoreProvider)  // Mitesh
//      This single-line edit is the ONE sanctioned cross-boundary
//      edit to this file. Do not touch anything else here.
// The stub providers below return 0 so the wiring works and the
// dashboard/engine run before your real providers land.
// ---------------------------------------------------------------
// =============================================================

export type ScorePeriod = string // "2026-07"

export interface ScoreBreakdown {
  environmental: number // 0..100
  social: number // 0..100
  governance: number // 0..100
}

export interface ScoreProvider {
  /** Which ESG pillar this provider contributes to. */
  pillar: keyof ScoreBreakdown
  /** Human-readable name for debugging/telemetry. */
  name: string
  /**
   * Return this provider's contribution for a department + period,
   * normalized to 0..100.
   */
  getScore(deptId: string, period: ScorePeriod): Promise<number>
}

const providers: ScoreProvider[] = []

/** Register a provider. Called once at module load (see registerProviders). */
export function registerProvider(provider: ScoreProvider) {
  providers.push(provider)
}

export function getRegisteredProviders(): readonly ScoreProvider[] {
  return providers
}

/**
 * Default pillar weights. The live values come from the esg_config
 * singleton; these are the fallback used when config is unavailable.
 */
const DEFAULT_WEIGHTS: ScoreBreakdown = {
  environmental: 0.4,
  social: 0.3,
  governance: 0.3,
}

/**
 * Compute a department's ESG score for a period by fanning in across all
 * registered providers for each pillar (averaged), then weighting.
 * Returns a value in 0..100.
 */
export async function getScore(
  deptId: string,
  period: ScorePeriod,
  weights: ScoreBreakdown = DEFAULT_WEIGHTS,
): Promise<{ total: number; breakdown: ScoreBreakdown }> {
  const pillars: (keyof ScoreBreakdown)[] = ['environmental', 'social', 'governance']
  const breakdown: ScoreBreakdown = { environmental: 0, social: 0, governance: 0 }

  for (const pillar of pillars) {
    const pillarProviders = providers.filter((p) => p.pillar === pillar)
    if (pillarProviders.length === 0) {
      breakdown[pillar] = 0
      continue
    }
    const scores = await Promise.all(
      pillarProviders.map((p) => p.getScore(deptId, period)),
    )
    breakdown[pillar] = scores.reduce((a, b) => a + b, 0) / scores.length
  }

  const total =
    breakdown.environmental * weights.environmental +
    breakdown.social * weights.social +
    breakdown.governance * weights.governance

  return { total: Math.round(total * 100) / 100, breakdown }
}

// =============================================================
// STUB PROVIDERS — one per pillar, each returns 0.
// These exist so the registry/engine/dashboard have something to
// fan in over before the real pillar providers land. Pillar owners:
// REPLACE your stub in registerProviders() with your real provider.
// =============================================================
export const environmentalScoreStub: ScoreProvider = {
  pillar: 'environmental',
  name: 'environmental-stub',
  async getScore() {
    return 0
  },
}

export const socialScoreStub: ScoreProvider = {
  pillar: 'social',
  name: 'social-stub',
  async getScore() {
    return 0
  },
}

export const governanceScoreStub: ScoreProvider = {
  pillar: 'governance',
  name: 'governance-stub',
  async getScore() {
    return 0
  },
}

/**
 * Central registration point for domain ScoreProviders.
 * Sanctioned cross-boundary edit: each module owner REPLACES their
 * pillar's stub line below with ONE line registering their real
 * provider, e.g.:
 *
 *   registerProvider(environmentalScoreProvider)  // Mitesh
 *   registerProvider(socialScoreProvider)         // Hetvi
 *   registerProvider(governanceScoreProvider)     // Hetvi
 *
 * Guarded so it's safe to call more than once (idempotent).
 */
let registered = false
export function registerProviders() {
  if (registered) return
  registered = true

  // --- STUBS (replace with your real provider) ---
  registerProvider(environmentalScoreStub) // Mitesh — replace with real environmental provider
  registerProvider(socialScoreStub) // Hetvi — replace with real social provider
  registerProvider(governanceScoreStub) // Hetvi — replace with real governance provider
}
