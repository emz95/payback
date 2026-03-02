import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

const friends = [
  { id: '1', username: 'sarah_kim',  icon: '🐰', amount: 45.50,  owesYou: true  },
  { id: '2', username: 'mike_chen',  icon: '🐶', amount: 23.00,  owesYou: false },
  { id: '3', username: 'emma_j',     icon: '🐦', amount: 12.75,  owesYou: true  },
  { id: '4', username: 'alex_wu',    icon: '🐟', amount: 8.50,   owesYou: false },
];

const overallBalance = friends.reduce((acc, f) => acc + (f.owesYou ? f.amount : -f.amount), 0);

export default function HomeScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.headerIcon}>🐱</Text>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.usernameText}>YOU</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Overall Balance</Text>
          <Text style={[styles.balanceAmount, overallBalance >= 0 ? styles.positive : styles.negative]}>
            {overallBalance >= 0 ? '+' : ''}${Math.abs(overallBalance).toFixed(2)}
          </Text>
          <Text style={styles.balanceSubtitle}>
            {overallBalance >= 0 ? 'You are owed' : 'You owe'}
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
      <View style={styles.friendsList}>
        {friends.map((friend) => (
          <TouchableOpacity
            key={friend.id}
            style={styles.friendCard}
           // onPress={() => router.push(`/friend/${friend.id}`)} //FRIEND ID AREA NAVIGATE
          >
            <View style={styles.friendLeft}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>{friend.icon}</Text>
              </View>
              <View>
                <Text style={styles.friendName}>{friend.username}</Text>
                <Text style={styles.friendSubtitle}>
                  {friend.owesYou ? 'owes you' : 'you owe'}
                </Text>
              </View>
            </View>
            <View style={styles.friendRight}>
              <Text style={[styles.friendAmount, friend.owesYou ? styles.positive : styles.negative]}>
                {friend.owesYou ? '+' : ''}${friend.amount.toFixed(2)}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
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
