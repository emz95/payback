import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';

const PROFILE_ICONS = ['🐱', '🐰', '🐶', '🐦', '🐟', '🐿️'];

export default function SignupScreen() {
  const [selectedIcon, setSelectedIcon] = useState(0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join Payback today!</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="cooluser123"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="········"
          placeholderTextColor="#aaa"
          secureTextEntry
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="········"
          placeholderTextColor="#aaa"
          secureTextEntry
        />

        <Text style={styles.label}>Choose Your Profile Icon</Text>
        <View style={styles.iconRow}>
          {PROFILE_ICONS.map((icon, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.iconButton, selectedIcon === index && styles.iconButtonSelected]}
              onPress={() => setSelectedIcon(index)}
            >
              <Text style={styles.iconText}>{icon}</Text>
              {selectedIcon === index && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)/home')}
        >
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/')}>
            <Text style={styles.loginLink}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    fontFamily: 'monospace',
    marginBottom: 36,
  },
  form: {
    width: '100%',
  },
  label: {
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 6,
    fontSize: 15,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    padding: 16,
    marginBottom: 16,
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#333',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    marginTop: 8,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3b5e4f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonSelected: {
    borderWidth: 2,
    borderColor: '#3b5e4f',
    backgroundColor: '#3b5e4f',
  },
  iconText: {
    fontSize: 24,
  },
  checkBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#4caf50',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#3b5e4f',
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  loginText: {
    textAlign: 'center',
    fontFamily: 'monospace',
    color: '#333',
  },
  loginLink: {
    color: '#e8a0a0',
    fontFamily: 'monospace',
  },
});
