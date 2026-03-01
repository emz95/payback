import { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

const SUGGESTED_FRIENDS = [
  { id: '1', username: 'jordan_lee',    icon: '🐱' },
  { id: '2', username: 'taylor_swift',  icon: '🐰' },
  { id: '3', username: 'chris_evans',   icon: '🐶' },
  { id: '4', username: 'zoe_williams',  icon: '🐦' },
  { id: '5', username: 'maya_patel',    icon: '🐟' },
  { id: '6', username: 'ryan_garcia',   icon: '🐿️' },
];

export default function FriendsScreen() {
  const [search, setSearch] = useState('');
  const [followed, setFollowed] = useState<string[]>([]);

  const filtered = SUGGESTED_FRIENDS.filter((f) =>
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFollow = (id: string) => {
    setFollowed((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerCard}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Friends</Text>
          <Text style={styles.headerSubtitle}>Manage your connections</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>

        {/* Suggested Friends */}
        <Text style={styles.sectionTitle}>Suggested Friends</Text>

        <View style={styles.list}>
          {filtered.map((friend) => (
            <View key={friend.id} style={styles.friendRow}>
              <View style={styles.friendLeft}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>{friend.icon}</Text>
                </View>
                <Text style={styles.username}>{friend.username}</Text>
              </View>
              <TouchableOpacity
                style={[styles.followButton, followed.includes(friend.id) && styles.followButtonPending]}
                onPress={() => toggleFollow(friend.id)}
              >
                <Text style={styles.followButtonText}>
                  {followed.includes(friend.id) ? 'Pending' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🐾</Text>
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptySubtitle}>Try a different username</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
    padding: 20,
  },
  backButton: {
    marginBottom: 12,
  },
  backArrow: {
    color: '#fff',
    fontSize: 22,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontFamily: 'serif',
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#a8c4b8',
    fontFamily: 'monospace',
    fontSize: 13,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    marginHorizontal: 16,
    marginBottom: 20,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    padding: 14,
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#333',
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'serif',
    color: '#1a1a1a',
    marginLeft: 20,
    marginBottom: 12,
  },

  // List
  list: {
    paddingHorizontal: 16,
    gap: 10,
  },
  friendRow: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b5e4f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  username: {
    fontFamily: 'monospace',
    fontSize: 15,
    color: '#1a1a1a',
  },
  followButton: {
    backgroundColor: '#3b5e4f',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  followButtonPending: {
    backgroundColor: '#ccc',
  },
  followButtonText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyTitle: {
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  emptySubtitle: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#888',
  },
});