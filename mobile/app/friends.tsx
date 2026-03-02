import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

import { getProfiles, getFollowing, followUser, type ApiProfile } from '@/lib/api';
import { supabase } from '@/lib/supabase';

function avatarLetter(username: string): string {
  return (username[0] ?? '?').toUpperCase();
}

export default function FriendsScreen() {
  const [search, setSearch] = useState('');
  const [allProfiles, setAllProfiles] = useState<ApiProfile[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUserId(session?.user?.id ?? null);
        const [profiles, following] = await Promise.all([getProfiles(), getFollowing()]);
        setAllProfiles(profiles);
        setFollowingIds(new Set(following.map((p) => p.id)));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const suggested = allProfiles.filter(
    (p) => p.id !== currentUserId && !followingIds.has(p.id)
  );
  const filtered = suggested.filter((f) =>
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleFollow = async (id: string) => {
    if (followingInProgress.has(id)) return;
    setFollowingInProgress((prev) => new Set(prev).add(id));
    try {
      await followUser(id);
      setFollowingIds((prev) => new Set(prev).add(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Follow failed');
    } finally {
      setFollowingInProgress((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
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

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#3b5e4f" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((friend) => (
              <View key={friend.id} style={styles.friendRow}>
                <View style={styles.friendLeft}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarEmoji}>{avatarLetter(friend.username)}</Text>
                  </View>
                  <Text style={styles.username}>{friend.username}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    followingInProgress.has(friend.id) && styles.followButtonDisabled,
                  ]}
                  onPress={() => handleFollow(friend.id)}
                  disabled={followingInProgress.has(friend.id)}
                >
                  {followingInProgress.has(friend.id) ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.followButtonText}>Follow</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}

            {filtered.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🐾</Text>
                <Text style={styles.emptyTitle}>
                  {suggested.length === 0 ? 'No one left to follow' : 'No users found'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {suggested.length === 0 ? "You're following everyone!" : 'Try a different username'}
                </Text>
              </View>
            )}
          </View>
        )}
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
  followButtonDisabled: {
    backgroundColor: '#999',
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