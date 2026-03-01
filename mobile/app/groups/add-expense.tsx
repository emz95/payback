import { useState } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, StyleSheet
} from 'react-native';
import { router } from 'expo-router';

const GROUP_MEMBERS = ['You', 'sarah_kim', 'mike_chen'];

const CATEGORIES = [
  { label: 'Food',          color: '#f4a0a0' },
  { label: 'Transport',     color: '#a0d4b0' },
  { label: 'Hotel',         color: '#f4d080' },
  { label: 'Entertainment', color: '#a0b8f4' },
  { label: 'Shopping',      color: '#c4a0f4' },
  { label: 'Other',         color: '#cccccc' },
];

export default function AddExpenseScreen() {
  const [title, setTitle]               = useState('');
  const [notes, setNotes]               = useState('');
  const [amount, setAmount]             = useState('');
  const [selectedCategory, setCategory] = useState(CATEGORIES[0]);
  const [showCategoryDrop, setShowCategoryDrop] = useState(false);
  const [selectedMembers, setSelectedMembers]   = useState<string[]>([...GROUP_MEMBERS]);
  const [paidBy, setPaidBy]             = useState('You');
  const [showPaidByDrop, setShowPaidByDrop]     = useState(false);
  const [splitOption, setSplitOption]   = useState<'equally' | 'manually'>('equally');
  const [continuePressed, setContinuePressed] = useState(false);

  const toggleMember = (member: string) => {
    setSelectedMembers((prev) =>
      prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]
    );
  };

  const perPerson =
    selectedMembers.length > 0 && parseFloat(amount) > 0
      ? (parseFloat(amount) / selectedMembers.length).toFixed(2)
      : null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerCard}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
        </View>

        <View style={styles.form}>
          {/* Title */}
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Dinner at restaurant"
            placeholderTextColor="#aaa"
            value={title}
            onChangeText={setTitle}
          />

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowCategoryDrop(!showCategoryDrop)}
          >
            <View style={styles.dropdownLeft}>
              <View style={[styles.dot, { backgroundColor: selectedCategory.color }]} />
              <Text style={styles.dropdownText}>{selectedCategory.label}</Text>
            </View>
            <Text style={styles.chevron}>⌄</Text>
          </TouchableOpacity>
          {showCategoryDrop && (
            <View style={styles.dropdownMenu}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.label}
                  style={styles.dropdownItem}
                  onPress={() => { setCategory(cat); setShowCategoryDrop(false); }}
                >
                  <View style={[styles.dot, { backgroundColor: cat.color }]} />
                  <Text style={styles.dropdownText}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Notes */}
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional details..."
            placeholderTextColor="#aaa"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          {/* Total Amount */}
          <Text style={styles.label}>Total Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#aaa"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          {/* Split Between */}
          <Text style={styles.label}>Split Between</Text>
          <View style={styles.checkboxGroup}>
            {GROUP_MEMBERS.map((member) => (
              <TouchableOpacity
                key={member}
                style={styles.checkboxRow}
                onPress={() => toggleMember(member)}
              >
                <View style={[styles.checkbox, selectedMembers.includes(member) && styles.checkboxChecked]}>
                  {selectedMembers.includes(member) && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>{member}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.selectedCount}>Selected: {selectedMembers.length} people</Text>
          </View>

          {/* Paid By */}
          <Text style={styles.label}>Paid By</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowPaidByDrop(!showPaidByDrop)}
          >
            <Text style={styles.dropdownText}>{paidBy}</Text>
            <Text style={styles.chevron}>⌄</Text>
          </TouchableOpacity>
          {showPaidByDrop && (
            <View style={styles.dropdownMenu}>
              {GROUP_MEMBERS.map((member) => (
                <TouchableOpacity
                  key={member}
                  style={styles.dropdownItem}
                  onPress={() => { setPaidBy(member); setShowPaidByDrop(false); }}
                >
                  <Text style={styles.dropdownText}>{member}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Split Options */}
          <Text style={styles.label}>Split Options</Text>
          <View style={styles.splitToggleRow}>
            <TouchableOpacity
              style={[styles.splitToggle, splitOption === 'equally' && styles.splitToggleActive]}
              onPress={() => setSplitOption('equally')}
            >
              <Text style={[styles.splitToggleText, splitOption === 'equally' && styles.splitToggleTextActive]}>
                Split Equally
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.splitToggle, splitOption === 'manually' && styles.splitToggleActive]}
              onPress={() => setSplitOption('manually')}
            >
              <Text style={[styles.splitToggleText, splitOption === 'manually' && styles.splitToggleTextActive]}>
                Split Manually
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          {splitOption === 'equally' ? (
            <TouchableOpacity style={styles.button} onPress={() => console.log('add expense')}>
              <Text style={styles.buttonText}>
                Add Expense{perPerson ? `  ·  $${perPerson} each` : ''}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
                style={[styles.continueButton, continuePressed && { backgroundColor: '#3b5e4f' }]}
                onPressIn={() => setContinuePressed(true)}
                onPressOut={() => setContinuePressed(false)}
                onPress={() => console.log('go to manual split')}
>
  <Text style={styles.buttonText}>Continue</Text>
</TouchableOpacity>
          )}
        </View>
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
  },

  // Form
  form: {
    paddingHorizontal: 16,
    gap: 6,
  },
  label: {
    fontWeight: 'bold',
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 14,
    padding: 14,
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Dropdown
  dropdown: {
    backgroundColor: '#f0f0f0',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#333',
  },
  chevron: {
    fontSize: 16,
    color: '#888',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginTop: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // Checkboxes
  checkboxGroup: {
    backgroundColor: '#f0f0f0',
    borderRadius: 14,
    padding: 8,
    gap: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#1a1a1a',
  },
  selectedCount: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#888',
    paddingLeft: 10,
    paddingTop: 4,
  },

  // Split toggle
  splitToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  splitToggle: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  splitToggleActive: {
    backgroundColor: '#3b5e4f',
  },
  splitToggleText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#888',
  },
  splitToggleTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Button
  button: {
    backgroundColor: '#3b5e4f',
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'monospace',
  },
  continueButton: {
    backgroundColor: '#e8a0a0',
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
  },
});
