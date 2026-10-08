import { useFonts } from 'expo-font';
import { fontAssets } from '@/theme/font-assets';

export function useAppFonts() {
  return useFonts(fontAssets);
}
