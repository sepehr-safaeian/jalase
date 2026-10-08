export const fontFamily = {
  regular: 'Vazirmatn-Regular',
  medium: 'Vazirmatn-Medium',
  semiBold: 'Vazirmatn-SemiBold',
  bold: 'Vazirmatn-Bold',
} as const;

type FontWeightKey = '400' | '500' | '600' | '700' | 'normal' | 'bold';

const weightMap: Record<string, keyof typeof fontFamily> = {
  '400': 'regular',
  normal: 'regular',
  '500': 'medium',
  '600': 'semiBold',
  '700': 'bold',
  bold: 'bold',
};

export function resolveFontFamily(
  weight: FontWeightKey | string = '400',
): string {
  const key = weightMap[weight] ?? 'regular';
  return fontFamily[key];
}
