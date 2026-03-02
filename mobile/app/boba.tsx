import { View, Text, StyleSheet } from 'react-native';

export default function BobaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Boba</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0efeb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'serif',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#888',
  },
});
