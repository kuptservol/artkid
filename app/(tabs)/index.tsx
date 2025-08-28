import { generateFromScribble } from '@/services/generation';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const [inputUri, setInputUri] = useState<string | null>(null);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onPickOrCapture = useCallback(async () => {
    setResultUri(null);
    // Request permissions
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (camPerm.status !== 'granted' && mediaPerm.status !== 'granted') return;
    // Prefer camera; fallback to library
    const camera = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    let uri: string | undefined = undefined;
    if (!camera.canceled) {
      uri = camera.assets?.[0]?.uri;
    } else {
      const lib = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (!lib.canceled) {
        uri = lib.assets?.[0]?.uri;
      }
    }
    if (!uri) return;
    setInputUri(uri);
  }, []);

  const onGenerate = useCallback(async () => {
    if (!inputUri) return;
    setIsLoading(true);
    try {
      const outputUrl = await generateFromScribble({
        imageUri: inputUri,
        prompt: 'friendly watercolor illustration for children, soft colors, clean shapes',
      });
      setResultUri(outputUrl);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoading(false);
    }
  }, [inputUri]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Скетч → Картинка</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Шаг 1: Сфотографируйте рисунок</ThemedText>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable onPress={onPickOrCapture} style={styles.button}>
            <ThemedText type="defaultSemiBold">Камера / Галерея</ThemedText>
          </Pressable>
          <Pressable onPress={onGenerate} style={[styles.button, !inputUri && styles.buttonDisabled]} disabled={!inputUri || isLoading}>
            <ThemedText type="defaultSemiBold">Сгенерировать</ThemedText>
          </Pressable>
        </View>
        {isLoading && (
          <View style={{ marginTop: 12 }}>
            <ActivityIndicator />
          </View>
        )}
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Выбранный рисунок</ThemedText>
        {inputUri ? (
          <Image source={{ uri: inputUri }} style={{ width: '100%', height: 240, borderRadius: 8 }} contentFit="contain" />
        ) : (
          <ThemedText>Нет изображения</ThemedText>
        )}
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Результат</ThemedText>
        {resultUri ? (
          <Image source={{ uri: resultUri }} style={{ width: '100%', height: 300, borderRadius: 8 }} contentFit="contain" />
        ) : (
          <ThemedText>Пока нет результата</ThemedText>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9BBCE6',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
