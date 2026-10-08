export const illustrationAssets = {
  features: require('./features.svg'),
  'how-help': require('./how-help.svg'),
  before: require('./before.svg'),
  during: require('./during.svg'),
  after: require('./after.svg'),
  start: require('./start.svg'),
} as const;

export type IllustrationKey = keyof typeof illustrationAssets;
