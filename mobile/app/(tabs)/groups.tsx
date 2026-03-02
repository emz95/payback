import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { router } from 'expo-router';

import { getGroups, createGroup, type ApiGroup } from '@/lib/api';

/** Parse mm/dd/yyyy or similar to YYYY-MM-DD for the API. */
function toISODate(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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

const FRIENDS = ['sarah_kim', 'mike_chen', 'emma_j', 'alex_wu'];

export default function GroupsScreen() {
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [friendSearch, setFriendSearch] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const filteredFriends = FRIENDS.filter(
    (f) =>
      f.toLowerCase().includes(friendSearch.toLowerCase()) &&
      !selectedFriends.includes(f)
  );

  const toggleFriend = (friend: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friend) ? prev.filter((f) => f !== friend) : [...prev, friend]
    );
  };

  const resetModal = () => {
    setGroupName('');
    setStartDate('');
    setEndDate('');
    setFriendSearch('');
    setSelectedFriends([]);
    setCreateError(null);
    setModalVisible(false);
  };

  const handleCreateGroup = async () => {
    const name = groupName.trim();
    if (!name) {
      setCreateError('Enter a group name');
      return;
    }
    const start = toISODate(startDate);
    const end = toISODate(endDate);
    if (startDate.trim() && !start) {
      setCreateError('Enter a valid start date (e.g. 12/25/2025)');
      return;
    }
    if (endDate.trim() && !end) {
      setCreateError('Enter a valid end date (e.g. 12/31/2025)');
      return;
    }
    setCreateError(null);
    setCreateLoading(true);
    try {
      const newGroup = await createGroup({
        name,
        ...(start && { start_date: start }),
        ...(end && { end_date: end }),
      });
      resetModal();
      setGroups((prev) => [newGroup, ...prev]);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create group');
    } finally {
      setCreateLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getGroups();
        setGroups(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load groups';
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
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Groups & Trips</Text>
          </View>
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
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Create Group Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={resetModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={styles.modalBackdrop} onPress={resetModal} />
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Group</Text>
              <TouchableOpacity onPress={resetModal}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Group Name */}
              <Text style={styles.label}>Trip/Group Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Tokyo Trip"
                placeholderTextColor="#aaa"
                value={groupName}
                onChangeText={setGroupName}
              />

              {/* Dates */}
              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <Text style={styles.label}>Start Date</Text>
                  <View style={styles.dateInput}>
                    <TextInput
                      style={styles.dateText}
                      placeholder="mm/dd/yyyy"
                      placeholderTextColor="#aaa"
                      value={startDate}
                      onChangeText={setStartDate}
                      keyboardType="numeric"
                    />
                    <Text style={styles.calendarIcon}>📅</Text>
                  </View>
                </View>
                <View style={styles.dateField}>
                  <Text style={styles.label}>End Date</Text>
                  <View style={styles.dateInput}>
                    <TextInput
                      style={styles.dateText}
                      placeholder="mm/dd/yyyy"
                      placeholderTextColor="#aaa"
                      value={endDate}
                      onChangeText={setEndDate}
                      keyboardType="numeric"
                    />
                    <Text style={styles.calendarIcon}>📅</Text>
                  </View>
                </View>
              </View>

              {/* Invite Friends */}
              <Text style={styles.label}>Invite Friends (min 2 people)</Text>
              <TextInput
                style={styles.input}
                placeholder="Search by username..."
                placeholderTextColor="#aaa"
                value={friendSearch}
                onChangeText={setFriendSearch}
                autoCapitalize="none"
              />

              {/* Search Results */}
              {friendSearch.length > 0 && filteredFriends.length > 0 && (
                <View style={styles.searchResults}>
                  {filteredFriends.map((friend) => (
                    <TouchableOpacity
                      key={friend}
                      style={styles.searchResultRow}
                      onPress={() => {
                        toggleFriend(friend);
                        setFriendSearch('');
                      }}
                    >
                      <Text style={styles.searchResultText}>{friend}</Text>
                      <Text style={styles.searchResultAdd}>+ Add</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Selected Friends Chips */}
              {selectedFriends.length > 0 && (
                <View style={styles.selectedRow}>
                  {selectedFriends.map((friend) => (
                    <TouchableOpacity
                      key={friend}
                      style={styles.selectedChip}
                      onPress={() => toggleFriend(friend)}
                    >
                      <Text style={styles.selectedChipText}>{friend} ✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.selectedCount}>
                Selected: You + {selectedFriends.length} friend{selectedFriends.length !== 1 ? 's' : ''}
              </Text>

              {createError ? (
                <Text style={styles.errorText}>{createError}</Text>
              ) : null}

              {/* Create Button */}
              <TouchableOpacity
                style={[
                  styles.createButton,
                  (!groupName.trim() || createLoading) && styles.createButtonDisabled,
                ]}
                disabled={!groupName.trim() || createLoading}
                onPress={handleCreateGroup}
              >
                {createLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createButtonText}>Create Group</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerCard: {
    backgroundColor: '#3b5e4f',
    borderRadius: 20,
    margin: 16,
    padding: 24,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  positive: { color: '#3daa6e' },
  negative: { color: '#e07070' },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'serif',
    color: '#1a1a1a',
  },
  closeButton: {
    fontSize: 18,
    color: '#888',
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
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  calendarIcon: {
    fontSize: 16,
  },
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 6,
    overflow: 'hidden',
  },
  searchResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#1a1a1a',
  },
  searchResultAdd: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#3b5e4f',
    fontWeight: '600',
  },
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  selectedChip: {
    backgroundColor: '#3b5e4f',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  selectedChipText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  selectedCount: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    marginBottom: 4,
  },
  createButton: {
    backgroundColor: '#3b5e4f',
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '600',
  },
});
