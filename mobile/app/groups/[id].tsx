import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { getGroup, getExpensesForGroup, getGroupBalance, type ApiGroup, type ApiExpense } from '@/lib/api';

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

export default function GroupDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];
  const [group, setGroup] = useState<ApiGroup | null>(null);
  const [expenses, setExpenses] = useState<ApiExpense[]>([]);
  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [groupData, expensesData, balanceData] = await Promise.all([
        getGroup(id),
        getExpensesForGroup(id),
        getGroupBalance(id),
      ]);
      setGroup(groupData);
      setExpenses(expensesData);
      setBalanceCents(balanceData.balance_cents);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refetch when screen comes back into focus (e.g. after adding an expense)
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      Promise.all([
        getExpensesForGroup(id),
        getGroupBalance(id),
      ]).then(([expensesData, balanceData]) => {
        setExpenses(expensesData);
        setBalanceCents(balanceData.balance_cents);
      }).catch(() => {});
    }, [id])
  );

  const handleScanReceipt = () => {
    Alert.alert('Scan Receipt', 'Choose an option', [
      { text: 'Take Photo', onPress: () => pickImage('camera') },
      { text: 'Choose from Library', onPress: () => pickImage('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickImage = async (source: 'camera' | 'library') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library permission is required.');
        return;
      }
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled) return;
    // Receipt image captured; not sent to backend yet. Go to add-expense to enter manually.
    if (id) {
      router.push({ pathname: '/groups/add-expense', params: { group_id: id } });
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color="#3b5e4f" />
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.errorText}>{error ?? 'Group not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dateRange = formatDateRange(group.start_date, group.end_date);
  const balanceText =
    balanceCents === null
      ? '—'
      : balanceCents === 0
        ? '$0.00'
        : balanceCents > 0
          ? `+$${(balanceCents / 100).toFixed(2)}`
          : `-$${(Math.abs(balanceCents) / 100).toFixed(2)}`;
  const balancePositive = balanceCents != null && balanceCents > 0;
  const balanceNegative = balanceCents != null && balanceCents < 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerCard}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupDate}>{dateRange}</Text>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <Text
              style={[
                styles.balanceAmount,
                balancePositive && styles.balancePositive,
                balanceNegative && styles.balanceNegative,
              ]}
            >
              {balanceText}
            </Text>
          </View>
        </View>

        {/* Expenses */}
        <Text style={styles.sectionTitle}>Expenses</Text>

        <View style={styles.expensesList}>
          {expenses.length === 0 ? (
            <View style={styles.emptyExpenses}>
              <Text style={styles.emptyText}>No expenses yet. Tap + to add one.</Text>
            </View>
          ) : (
            expenses.map((expense) => (
              <View key={expense.id} style={styles.expenseCard}>
                <View style={styles.expenseTop}>
                  <View style={styles.expenseLeft}>
                    <View style={styles.dot} />
                    <View>
                      <Text style={styles.expenseTitle}>{expense.title}</Text>
                      <Text style={styles.expensePaidBy}>
                        Paid by {expense.paid_by_username ?? expense.paid_by}
                      </Text>
                      {expense.category && (
                        <Text style={styles.expenseDate}>{expense.category}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>
                      ${(expense.amount_cents / 100).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FABs */}
      <TouchableOpacity style={styles.fabCamera} onPress={handleScanReceipt}>
        <Text style={styles.fabIcon}>📷</Text>
      </TouchableOpacity>
    <TouchableOpacity
        style={styles.fabAdd}
        onPress={() => router.push(`/groups/add-expense?group_id=${id}`)}
      >
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    paddingBottom: 120,
  },
  errorText: {
    fontFamily: 'monospace',
    color: '#c62828',
    textAlign: 'center',
  },
  backLink: { marginTop: 12 },
  backLinkText: { fontFamily: 'monospace', color: '#3b5e4f', fontSize: 16 },

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
    color: '#1a1a1a',
  },
  balancePositive: {
    color: '#2e7d32',
  },
  balanceNegative: {
    color: '#c62828',
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
  emptyExpenses: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'monospace',
    color: '#888',
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
    backgroundColor: '#3b5e4f',
  },
  expenseTitle: {
    fontWeight: 'bold',
    fontFamily: 'serif',
    fontSize: 16,
    color: '#1a1a1a',
  },
  expensePaidBy: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#666',
  },
  expenseDate: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#888',
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  // FABs
  fabCamera: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f0e8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  fabAdd: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b5e4f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
});
