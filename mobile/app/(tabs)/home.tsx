import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { getFollowing, getProfile, type ApiProfile } from '@/lib/api';
import { supabase } from '@/lib/supabase';

function avatarLetter(username: string): string {
  return (username[0] ?? '?').toUpperCase();
}

export default function HomeScreen() {
  const [friends, setFriends] = useState<ApiProfile[]>([]);
  const [myName, setMyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        const [data, me] = await Promise.all([
          getFollowing(),
          getProfile(userId).catch(() => null),
        ]);
        setFriends(data);
        setMyName(me?.username ?? '');
      } else {
        setFriends([]);
        setMyName('');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFriends();
    }, [loadFriends])
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.headerIcon}>🐱</Text>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.usernameText}>{myName || '…'}</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Friends</Text>
          <Text style={styles.balanceAmount}>
            {friends.length}
          </Text>
          <Text style={styles.balanceSubtitle}>
            people you follow
          </Text>
        </View>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Friends</Text>
        <TouchableOpacity
          style={styles.addFriendsButton}
          onPress={() => router.push('/friends')}
        >
          <Text style={styles.addFriendsText}>+ Add Friends</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3b5e4f" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : friends.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No friends yet. Tap + Add Friends to follow people.</Text>
        </View>
      ) : (
        <View style={styles.friendsList}>
          {friends.map((friend) => (
            <TouchableOpacity
              key={friend.id}
              style={styles.friendCard}
            >
              <View style={styles.friendLeft}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>{avatarLetter(friend.username)}</Text>
                </View>
                <View>
                  <Text style={styles.friendName}>{friend.username}</Text>
                  <Text style={styles.friendSubtitle}>friend</Text>
                </View>
              </View>
              <View style={styles.friendRight}>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f0efeb',
  },
  container: {
    paddingBottom: 40,
  },

  // Header
  headerCard: {
    backgroundColor: '#3b5e4f',
    borderRadius: 20,
    margin: 16,
    padding: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerIcon: {
    fontSize: 36,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'serif',
  },
  usernameText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  centered: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: 'monospace',
    color: '#c62828',
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'monospace',
    color: '#888',
    textAlign: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  addFriendsButton: {
    backgroundColor: '#e8a0a0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addFriendsText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '600',
  },
  // Balance
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
  },
  balanceLabel: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  balanceAmount: {
    fontFamily: 'monospace',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1a1a1a',
  },
  balanceSubtitle: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#888',
  },

  // Friends
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'serif',
    color: '#2c3e50',
    marginLeft: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  friendsList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  friendCard: {
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b5e4f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  friendName: {
    fontFamily: 'monospace',
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  friendSubtitle: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#aaa',
  },
  friendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  friendAmount: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    color: '#bbb',
  },

  // Shared
  positive: { color: '#3daa6e' },
  negative: { color: '#e07070' },
});
