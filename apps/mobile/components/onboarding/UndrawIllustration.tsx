import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';
import { SvgXml } from 'react-native-svg';
import {
  illustrationAssets,
  type IllustrationKey,
} from '@/assets/illustrations/registry';

interface UndrawIllustrationProps {
  name: IllustrationKey;
}

export function UndrawIllustration({ name }: UndrawIllustrationProps) {
  const source = illustrationAssets[name];
  const [xml, setXml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const asset = Asset.fromModule(source);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      if (!uri || cancelled) {
        return;
      }

      const response = await fetch(uri);
      const text = await response.text();
      if (!cancelled) {
        setXml(text);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source]);

  return (
    <View style={styles.wrap}>
      {xml ? <SvgXml xml={xml} width="100%" height="100%" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: '100%',
  },
});
