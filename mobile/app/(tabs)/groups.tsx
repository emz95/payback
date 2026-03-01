import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

import { getGroups, type ApiGroup } from '@/lib/api';

function formatDateRange(start: string, end: string): string {
  try {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return start;
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } catch {
    return `${start} – ${end}`;
  }
}

export default function GroupsScreen() {
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getGroups();
        setGroups(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load groups';
        if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
          router.replace('/');
          return;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Groups & Trips</Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#3b5e4f" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.groupsList}>
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupCard}
                onPress={() => router.push(`/groups/${group.id}`)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupDate}>
                      {formatDateRange(group.start_date, group.end_date)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <Text style={styles.membersIcon}>👥</Text>
                  <Text style={styles.memberCount}>View details</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => console.log('Create group – add app/groups/new.tsx or a modal')}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f0efeb',
  },
  container: {
    paddingBottom: 100,
  },

  // Header
  headerCard: {
    backgroundColor: '#3b5e4f',
    borderRadius: 20,
    margin: 16,
    padding: 24,
    paddingBottom: 32,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontFamily: 'serif',
    fontWeight: '600',
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
  // Groups List
  groupsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    gap: 4,
  },
  groupName: {
    fontSize: 17,
    fontWeight: 'bold',
    fontFamily: 'serif',
    color: '#1a1a1a',
  },
  groupDate: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#888',
  },
  groupAmount: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '600',
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  membersIcon: {
    fontSize: 16,
    color: '#aaa',
  },
  avatarRow: {
    flexDirection: 'row',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b5e4f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarEmoji: {
    fontSize: 16,
  },
  memberCount: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    left: '50%',
    transform: [{ translateX: -28 }],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f0e8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  fabIcon: {
    fontSize: 28,
    color: '#e8a0a0',
    lineHeight: 32,
  },

  // Shared
  positive: { color: '#3daa6e' },
  negative: { color: '#e07070' },
});
