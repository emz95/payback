import { Image } from 'expo-image';
import { Platform, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getHello, getRoot } from '@/lib/api';

export default function HomeScreen() {
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const [apiStatus, setApiStatus] = useState<string>('Checking…');
  const [helloName, setHelloName] = useState('friend');
  const [helloMessage, setHelloMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkApi = useCallback(async () => {
    try {
      const data = await getRoot();
      setApiStatus(data.message ?? 'API connected');
    } catch {
      setApiStatus('Backend not reachable');
    }
  }, []);

  useEffect(() => {
    checkApi();
  }, [checkApi]);

  const onSayHello = async () => {
    setHelloMessage(null);
    setLoading(true);
    try {
      const data = await getHello(helloName.trim() || 'friend');
      setHelloMessage(data.message);
    } catch {
      setHelloMessage('Request failed');
    } finally {
      setLoading(false);
    }
  };

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
        <ThemedText type="title">Payback</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Backend</ThemedText>
        <ThemedText style={styles.status}>{apiStatus}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Say hello</ThemedText>
        <TextInput
          style={[styles.input, { borderColor, color: textColor }]}
          placeholder="Your name"
          placeholderTextColor={borderColor}
          value={helloName}
          onChangeText={setHelloName}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onSayHello}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>{loading ? '…' : 'Hello'}</ThemedText>
        </TouchableOpacity>
        {helloMessage !== null && (
          <ThemedText style={styles.result}>{helloMessage}</ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Dev</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>. Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          for dev tools.
        </ThemedText>
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
  status: {
    fontSize: 14,
    opacity: 0.9,
  },
  input: {
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 44,
  },
  button: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  result: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
