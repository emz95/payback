import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

const groups = [
  {
    id: '1',
    name: 'Tokyo Trip 2026',
    date: 'Mar 15 – Mar 22',
    members: ['🐱', '🐰', '🐶'],
    amount: 145.50,
    owesYou: true,
  },
  {
    id: '2',
    name: 'Weekly Dinners',
    date: 'Ongoing',
    members: ['🐱', '🐦', '🐟'],
    amount: 15.25,
    owesYou: false,
  },
  {
    id: '3',
    name: 'SF Weekend',
    date: 'Feb 10 – Feb 12',
    members: ['🐱', '🐰', '🐦'],
    amount: 67.00,
    owesYou: true,
  },
];

export default function GroupsScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Groups & Trips</Text>
          </View>
        </View>

        {/* Group Cards */}
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
                  <Text style={styles.groupDate}>{group.date}</Text>
                </View>
                <Text style={[styles.groupAmount, group.owesYou ? styles.positive : styles.negative]}>
                  {group.owesYou ? '+' : ''}${group.amount.toFixed(2)}
                </Text>
              </View>

              <View style={styles.cardBottom}>
                <Text style={styles.membersIcon}>👥</Text>
                <View style={styles.avatarRow}>
                  {group.members.map((icon, i) => (
                    <View key={i} style={[styles.avatarCircle, { marginLeft: i === 0 ? 0 : -10 }]}>
                      <Text style={styles.avatarEmoji}>{icon}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.memberCount}>{group.members.length} members</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => console.log('Create group')}>
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
});