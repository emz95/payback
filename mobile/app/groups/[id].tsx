import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

const groupData = {
  id: '1',
  name: 'Tokyo Trip 2026',
  date: 'Mar 15 – Mar 22',
  balance: 145.50,
  owesYou: true,
  expenses: [
    {
      id: '1',
      title: 'Dinner at Sushi Place',
      paidBy: 'You',
      date: '2026-03-15',
      amount: 85.50,
      splitWays: 3,
      note: 'Amazing omakase!',
      color: '#f4a0a0',
    },
    {
      id: '2',
      title: 'Train tickets',
      paidBy: 'sarah_kim',
      date: '2026-03-15',
      amount: 45.00,
      splitWays: 3,
      note: null,
      color: '#a0d4b0',
    },
    {
      id: '3',
      title: 'Hotel - Night 1',
      paidBy: 'You',
      date: '2026-03-15',
      amount: 180.00,
      splitWays: 3,
      note: null,
      color: '#f4d080',
    },
  ],
};

export default function GroupDetailScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerCard}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.groupName}>{groupData.name}</Text>
          <Text style={styles.groupDate}>{groupData.date}</Text>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <Text style={[styles.balanceAmount, groupData.owesYou ? styles.positive : styles.negative]}>
              {groupData.owesYou ? '+' : ''}${groupData.balance.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Expenses */}
        <Text style={styles.sectionTitle}>Expenses</Text>

        <View style={styles.expensesList}>
          {groupData.expenses.map((expense) => (
            <View key={expense.id} style={styles.expenseCard}>
              <View style={styles.expenseTop}>
                <View style={styles.expenseLeft}>
                  <View style={[styles.dot, { backgroundColor: expense.color }]} />
                  <View>
                    <Text style={styles.expenseTitle}>{expense.title}</Text>
                    <Text style={styles.expensePaidBy}>Paid by {expense.paidBy}</Text>
                    <Text style={styles.expenseDate}>{expense.date}</Text>
                  </View>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
                  <Text style={styles.expenseSplit}>Split {expense.splitWays} ways</Text>
                </View>
              </View>

              {expense.note && (
                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>{expense.note}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* FABs */}
      <TouchableOpacity style={styles.fabCamera} onPress={() => console.log('scan receipt')}>
        <Text style={styles.fabIcon}>📷</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.fabAdd} onPress={() => router.push('/groups/add-expense')}>
        <Text style={styles.fabPlusIcon}>+</Text>
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
    paddingBottom: 120,
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
  groupName: {
    color: '#fff',
    fontSize: 26,
    fontFamily: 'serif',
    fontWeight: '600',
    marginBottom: 4,
  },
  groupDate: {
    color: '#a8c4b8',
    fontFamily: 'monospace',
    fontSize: 13,
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  balanceLabel: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  balanceAmount: {
    fontFamily: 'monospace',
    fontSize: 28,
    fontWeight: 'bold',
  },

  // Expenses
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'serif',
    color: '#1a1a1a',
    marginLeft: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  expensesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  expenseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  expenseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  expenseTitle: {
    fontWeight: 'bold',
    fontFamily: 'serif',
    fontSize: 15,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  expensePaidBy: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#888',
  },
  expenseDate: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#bbb',
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  expenseSplit: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  noteBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
  },
  noteText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#555',
  },

  // FABs
  fabCamera: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3b5e4f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  fabAdd: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f4a0a0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  fabIcon: {
    fontSize: 22,
  },
  fabPlusIcon: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
  },

  // Shared
  positive: { color: '#3daa6e' },
  negative: { color: '#e07070' },
});
