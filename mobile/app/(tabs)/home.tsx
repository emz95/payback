import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payback</Text>
      <Text style={styles.subtitle}>Track expenses with friends</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter username"
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          placeholderTextColor="#aaa"
          secureTextEntry
        />

        <TouchableOpacity>
          <Text style={styles.forgot}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <Text style={styles.signupText}>
          Don't have an account?{' '}
          <Text style={styles.signupLink} onPress={() => router.push('/signup')}>
            Sign up
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6a9fd8',
    marginBottom: 40,
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
  forgot: {
    color: '#e8a0a0',
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: 20,
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
  },
  signupText: {
    textAlign: 'center',
    fontFamily: 'monospace',
    color: '#333',
  },
  signupLink: {
    color: '#e8a0a0',
  },
});