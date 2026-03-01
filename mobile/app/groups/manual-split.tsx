// Each member row has a dollar input and a live percentage badge that updates as you type
// "Split Remaining $X.XX Proportionally" button appears in pink when subtotal < total and subtotal > 0 — tap it and it distributes the remainder based on each person's share
// Bottom summary bar shows Subtotal, Remaining (yellow when partial, red if over, green when zero), and Total
// Confirm Split button is greyed out until remaining hits exactly $0.00, then turns dark green
import { useState } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { router } from 'expo-router';

// TODO: replace with real data passed from add-expense screen
const TOTAL = 92.00;
const EXPENSE_NAME = 'Dinner at Sushi Place';
const MEMBERS = [
  { id: '1', username: 'You',       icon: '🐱' },
  { id: '2', username: 'sarah_kim', icon: '🐰' },
  { id: '3', username: 'mike_chen', icon: '🐶' },
];

export default function ManualSplitScreen() {
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const getAmount = (id: string) => parseFloat(amounts[id] || '0') || 0;

  const subtotal = parseFloat(
    MEMBERS.reduce((sum, m) => sum + getAmount(m.id), 0).toFixed(2)
  );
  const remaining = parseFloat((TOTAL - subtotal).toFixed(2));
  const isOver     = remaining < 0;
  const isComplete = remaining === 0;

  const getPercent = (id: string) => {
    if (subtotal === 0) return '0%';
    return ((getAmount(id) / subtotal) * 100).toFixed(1) + '%';
  };

  const splitProportionally = () => {
    if (subtotal === 0) return;
    const newAmounts = { ...amounts };
    MEMBERS.forEach((m) => {
      const share = getAmount(m.id) / subtotal;
      const newVal = parseFloat((getAmount(m.id) + share * remaining).toFixed(2));
      newAmounts[m.id] = newVal.toString();
    });
    setAmounts(newAmounts);
  };

  const remainingColor = isOver ? '#e07070' : remaining > 0 ? '#e8b84b' : '#3daa6e';

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.headerCard}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manual Split</Text>
        <Text style={styles.headerSubtitle}>
          {EXPENSE_NAME} · ${TOTAL.toFixed(2)}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Member Rows */}
        <View style={styles.membersList}>
          {MEMBERS.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <View style={styles.memberLeft}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>{member.icon}</Text>
                </View>
                <Text style={styles.memberName}>{member.username}</Text>
              </View>
              <View style={styles.memberRight}>
                <View style={styles.amountInputWrapper}>
                  <Text style={styles.dollarSign}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor="#aaa"
                    keyboardType="decimal-pad"
                    value={amounts[member.id] || ''}
                    onChangeText={(val) =>
                      setAmounts((prev) => ({ ...prev, [member.id]: val }))
                    }
                  />
                </View>
                <Text style={styles.percentBadge}>{getPercent(member.id)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Split Proportionally Button */}
        {remaining > 0 && subtotal > 0 && (
          <TouchableOpacity style={styles.proportionalButton} onPress={splitProportionally}>
            <Text style={styles.proportionalButtonText}>
              Split Remaining ${remaining.toFixed(2)} Proportionally
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bottom Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Remaining</Text>
          <Text style={[styles.summaryValue, { color: remainingColor }]}>
            ${Math.abs(remaining).toFixed(2)}{isOver ? ' over' : ''}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryRowTotal]}>
          <Text style={styles.summaryLabelBold}>Total</Text>
          <Text style={styles.summaryValueBold}>${TOTAL.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, !isComplete && styles.confirmButtonDisabled]}
          disabled={!isComplete}
          onPress={() => {router.back(); router.back()}}
        >
          <Text style={[styles.confirmButtonText, !isComplete && styles.confirmButtonTextDisabled]}>
            Confirm Split
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f0efeb',
  },

  // Header
  headerCard: {
    backgroundColor: '#3b5e4f',
    borderRadius: 20,
    margin: 16,
    marginBottom: 0,
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

  // Members
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  membersList: {
    gap: 10,
  },
  memberRow: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3b5e4f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  memberName: {
    fontFamily: 'monospace',
    fontSize: 15,
    color: '#1a1a1a',
  },
  memberRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dollarSign: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#888',
    marginRight: 2,
  },
  amountInput: {
    fontFamily: 'monospace',
    fontSize: 15,
    color: '#1a1a1a',
    minWidth: 70,
    textAlign: 'right',
  },
  percentBadge: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#aaa',
  },

  // Proportional button
  proportionalButton: {
    backgroundColor: '#e8a0a0',
    borderRadius: 25,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  proportionalButtonText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '600',
  },

  // Summary bar
  summaryBar: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  summaryLabel: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#888',
  },
  summaryValue: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#888',
  },
  summaryLabelBold: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  summaryValueBold: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  confirmButton: {
    backgroundColor: '#3b5e4f',
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButtonTextDisabled: {
    color: '#fff',
  },
});