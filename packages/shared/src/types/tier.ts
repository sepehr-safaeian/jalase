/** سطوح دسترسی محصول */

export type Tier = 'free' | 'plus' | 'pro' | 'enterprise';



export const TIER_ORDER: Record<Tier, number> = {

  free: 0,

  plus: 1,

  pro: 2,

  enterprise: 3,

};



export function tierAtLeast(current: Tier, required: Tier): boolean {

  return TIER_ORDER[current] >= TIER_ORDER[required];

}



/** نگاشت کلیدهای قدیمی پلن به tier جدید */

export function normalizeTier(tier: string): Tier {

  const legacy: Record<string, Tier> = {

    personal: 'plus',

    team: 'pro',

  };

  return (legacy[tier] ?? tier) as Tier;

}

