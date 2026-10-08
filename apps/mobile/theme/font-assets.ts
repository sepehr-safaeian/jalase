import { fontFamily } from './font-family';

export const fontAssets = {
  [fontFamily.regular]: require('../assets/fonts/Vazirmatn-Regular.ttf'),
  [fontFamily.medium]: require('../assets/fonts/Vazirmatn-Medium.ttf'),
  [fontFamily.semiBold]: require('../assets/fonts/Vazirmatn-SemiBold.ttf'),
  [fontFamily.bold]: require('../assets/fonts/Vazirmatn-Bold.ttf'),
} as const;
