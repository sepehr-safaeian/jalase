import { Image, StyleSheet, View } from 'react-native';
import {
  illustrationAssets,
  type IllustrationKey,
} from '@/assets/illustrations/registry';

interface UndrawIllustrationProps {
  name: IllustrationKey;
}

export function UndrawIllustration({ name }: UndrawIllustrationProps) {
  return (
    <View style={styles.wrap}>
      <Image
        source={illustrationAssets[name]}
        style={styles.image}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
