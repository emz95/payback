import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Switch, Image
} from 'react-native';
import { router } from 'expo-router';

const miso1 = require('../../assets/images/miso1.png');
const miso2 = require('../../assets/images/miso2.png');
const wario = require('../../assets/images/wario.png');

const ICONS = [
  { id: 'miso1', source: miso1, label: 'Miso 1' },
  { id: 'miso2', source: miso2, label: 'Miso 2' },
  { id: 'wario', source: wario, label: 'Miso 3'  },
];

export default function SettingsScreen() {
  const [username, setUsername]           = useState('cooluser123');
  const [email, setEmail]                 = useState('your@email.com');
  const [venmo, setVenmo]                 = useState('');
  const [zelle, setZelle]                 = useState('');
  const [selectedIcon, setSelectedIcon]   = useState('miso1');
  const [pushNotifs, setPushNotifs]       = useState(true);
  const [emailNotifs, setEmailNotifs]     = useState(true);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>

        {/* Icon Selector */}
        <Text style={styles.label}>Profile Icon</Text>
        <View style={styles.iconRow}>
          {ICONS.map((icon) => (
            <TouchableOpacity
              key={icon.id}
              style={[styles.iconButton, selectedIcon === icon.id && styles.iconButtonSelected]}
              onPress={() => setSelectedIcon(icon.id)}
            >
              <Image source={icon.source} style={styles.iconImage} />
              {selectedIcon === icon.id && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
              <Text style={styles.iconLabel}>{icon.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Username */}
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholderTextColor="#aaa"
        />

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Payment Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Information</Text>

        <Text style={styles.label}>Venmo Username</Text>
        <TextInput
          style={styles.input}
          value={venmo}
          onChangeText={setVenmo}
          placeholder="@yourvenmo"
          autoCapitalize="none"
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Zelle ID</Text>
        <TextInput
          style={styles.input}
          value={zelle}
          onChangeText={setZelle}
          placeholder="Phone or email"
          autoCapitalize="none"
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Push Notifications</Text>
            <Text style={styles.switchSubtitle}>Get notified about new expenses</Text>
          </View>
          <Switch
            value={pushNotifs}
            onValueChange={setPushNotifs}
            trackColor={{ false: '#ccc', true: '#3b5e4f' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Email Notifications</Text>
            <Text style={styles.switchSubtitle}>Receive email summaries</Text>
          </View>
          <Switch
            value={emailNotifs}
            onValueChange={setEmailNotifs}
            trackColor={{ false: '#ccc', true: '#3b5e4f' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={() => console.log('save settings')}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
          {/*boba button */}
        <TouchableOpacity style={styles.bobaButton} onPress={() => router.replace('/')}>
        <Text style={styles.bobaButtonText}>Buy us boba pls</Text>
      </TouchableOpacity>
      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace('/')}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f0efeb',
  },
  container: {
    paddingBottom: 60,
  },

  // Header
  headerCard: {
    backgroundColor: '#3b5e4f',
    borderRadius: 20,
    margin: 16,
    padding: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontFamily: 'serif',
    fontWeight: '600',
  },

  // Sections
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  label: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 13,
    color: '#1a1a1a',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 14,
    padding: 14,
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#333',
  },

  // Icon selector
  iconRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  iconButton: {
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconButtonSelected: {
    borderColor: '#3b5e4f',
    backgroundColor: '#f0f7f4',
  },
  iconImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
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
  iconLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#888',
  },

  // Switches
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchLabel: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  switchSubtitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#aaa',
  },

  // Buttons
  saveButton: {
    backgroundColor: '#3b5e4f',
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '600',
  },
  bobaButton: {
    backgroundColor: '#e8a0a0',
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  bobaButtonText: {
    fontFamily: 'monospace',
    fontSize: 15,
    color: '#fff',
  },
  logoutButton: {
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  logoutButtonText: {
    fontFamily: 'monospace',
    fontSize: 15,
    color: '#888',
  },
});