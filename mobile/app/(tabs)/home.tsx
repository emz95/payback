import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getProfileIconSource, getProfileIconSourceForUserId, getStoredProfileIconId } from '@/constants/profile-icon';
import { Fonts } from '@/constants/theme';
import { getFollowing, getFollowingBalances, getProfile, getTotalBalance, type ApiProfile } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [friends, setFriends] = useState<ApiProfile[]>([]);
  const [myName, setMyName] = useState<string>('');
  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [friendBalances, setFriendBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileIconId, setProfileIconId] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        const [data, me, balance, followingBalances] = await Promise.all([
          getFollowing(),
          getProfile(userId).catch(() => null),
          getTotalBalance().catch(() => ({ balance_cents: 0 })),
          getFollowingBalances().catch(() => []),
        ]);
        setFriends(data);
        setMyName(me?.username ?? '');
        setBalanceCents(balance.balance_cents);
        setFriendBalances(
          Object.fromEntries(followingBalances.map((b) => [b.user_id, b.balance_cents]))
        );
      } else {
        setFriends([]);
        setMyName('');
        setBalanceCents(null);
        setFriendBalances({});
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
      getStoredProfileIconId().then(setProfileIconId);
    }, [loadFriends])
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 8 }]}
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          {profileIconId && getProfileIconSource(profileIconId) ? (
            <Image
              source={getProfileIconSource(profileIconId)!}
              style={styles.headerIconImage}
            />
          ) : (
            <Text style={styles.headerIcon}>🐱</Text>
          )}
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.usernameText}>{myName || '…'}</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Overall balance</Text>
          <Text
            style={[
              styles.balanceAmount,
              balanceCents != null && balanceCents > 0 && styles.balancePositive,
              balanceCents != null && balanceCents < 0 && styles.balanceNegative,
            ]}
          >
            {balanceCents === null
              ? '—'
              : balanceCents === 0
                ? '$0.00'
                : balanceCents > 0
                  ? `+$${(balanceCents / 100).toFixed(2)}`
                  : `-$${(Math.abs(balanceCents) / 100).toFixed(2)}`}
          </Text>
          <Text style={styles.balanceSubtitle}>
            {balanceCents != null && balanceCents > 0
              ? 'You are owed'
              : balanceCents != null && balanceCents < 0
                ? 'You owe'
                : 'Across all groups'}
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
          {friends.map((friend) => {
            const cents = friendBalances[friend.id] ?? 0;
            const balanceText =
              cents === 0 ? '$0.00' : cents > 0 ? `+$${(cents / 100).toFixed(2)}` : `-$${(Math.abs(cents) / 100).toFixed(2)}`;
            const balancePositive = cents > 0;
            const balanceNegative = cents < 0;
            return (
              <TouchableOpacity
                key={friend.id}
                style={styles.friendCard}
                onPress={() => router.push(`/friends/${friend.id}`)}
              >
                <View style={styles.friendLeft}>
                  <Image
                    source={getProfileIconSourceForUserId(friend.id)}
                    style={styles.avatarImage}
                  />
                  <View>
                    <Text style={styles.friendName}>{friend.username}</Text>
                    <Text style={styles.friendSubtitle}>friend</Text>
                  </View>
                </View>
                <View style={styles.friendRight}>
                  <Text
                    style={[
                      styles.friendBalance,
                      balancePositive && styles.balancePositive,
                      balanceNegative && styles.balanceNegative,
                    ]}
                  >
                    {balanceText}
                  </Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })}
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
  headerIconImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: Fonts.serif,
  },
  usernameText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
  },
  centered: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: Fonts.mono,
    color: '#c62828',
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: Fonts.mono,
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
    fontFamily: Fonts.mono,
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
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  balanceAmount: {
    fontFamily: Fonts.mono,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1a1a1a',
  },
  balancePositive: {
    color: '#2e7d32',
  },
  balanceNegative: {
    color: '#c62828',
  },
  balanceSubtitle: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: '#888',
  },

  // Friends
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Fonts.serif,
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
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  friendName: {
    fontFamily: Fonts.mono,
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  friendSubtitle: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: '#aaa',
  },
  friendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  friendBalance: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  friendAmount: {
    fontFamily: Fonts.mono,
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
