import { FEATURE_FLAGS, type FeatureFlagKey } from './flags.js';
import { tierAtLeast, type Tier } from '../types/tier.js';

export interface FeatureCheckContext {
  tier: Tier;
  isDev?: boolean;
}

export function isFeatureEnabled(
  key: FeatureFlagKey,
  ctx: FeatureCheckContext,
): boolean {
  const flag = FEATURE_FLAGS.find((f) => f.key === key);
  if (!flag) return false;
  if (flag.disabled) return false;

  if (ctx.isDev && flag.enabledInDev) return true;

  return tierAtLeast(ctx.tier, flag.minTier);
}

export function getEnabledFeatures(ctx: FeatureCheckContext): FeatureFlagKey[] {
  return FEATURE_FLAGS.filter((f) => isFeatureEnabled(f.key, ctx)).map(
    (f) => f.key,
  );
}
