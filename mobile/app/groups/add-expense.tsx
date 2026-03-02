import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, StyleSheet, ActivityIndicator
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getGroup, getGroupMembers, createExpense, splitExpenseEqual } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  { label: 'Food',          color: '#f4a0a0' },
  { label: 'Transport',     color: '#a0d4b0' },
  { label: 'Hotel',         color: '#f4d080' },
  { label: 'Entertainment', color: '#a0b8f4' },
  { label: 'Shopping',      color: '#c4a0f4' },
  { label: 'Other',         color: '#cccccc' },
];

type MemberOption = { id: string; label: string };

export default function AddExpenseScreen() {
  const params = useLocalSearchParams<{ group_id?: string }>();
  const groupId = typeof params.group_id === 'string' ? params.group_id : params.group_id?.[0];

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setCategory] = useState(CATEGORIES[0]);
  const [showCategoryDrop, setShowCategoryDrop] = useState(false);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [paidById, setPaidById] = useState<string | null>(null);
  const [showPaidByDrop, setShowPaidByDrop] = useState(false);
  const [splitOption, setSplitOption] = useState<'equally' | 'manually'>('equally');
  const [step, setStep] = useState<1 | 2>(1);
  const [continuePressed, setContinuePressed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      setError('Missing group');
      return;
    }
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const me = session?.user?.id ?? null;
        setCurrentUserId(me);
        const [group, members] = await Promise.all([
          getGroup(groupId),
          getGroupMembers(groupId),
        ]);
        const options: MemberOption[] = members.map((m) => ({
          id: m.user_id,
          label: m.user_id === me ? 'You' : m.username,
        }));
        setMemberOptions(options);
        setSelectedMemberIds(options.map((o) => o.id));
        setPaidById(me ?? options[0]?.id ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId]);

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const paidByLabel = memberOptions.find((m) => m.id === paidById)?.label ?? '—';
  const perPerson =
    selectedMemberIds.length > 0 && parseFloat(amount) > 0
      ? (parseFloat(amount) / selectedMemberIds.length).toFixed(2)
      : null;

  const handleAddExpenseEqual = async () => {
    if (!groupId || !currentUserId || !paidById) return;
    const amt = parseFloat(amount);
    if (!title.trim()) { setError('Enter a title'); return; }
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); return; }
    if (selectedMemberIds.length === 0) { setError('Select at least one person'); return; }
    setError(null);
    setSubmitLoading(true);
    try {
      const expense = await createExpense({
        group_id: groupId,
        title: title.trim(),
        category: selectedCategory.label,
        amount_cents: Math.round(amt * 100),
        paid_by: paidById,
        split_mode: 'equal',
      });
      await splitExpenseEqual(expense.id, selectedMemberIds);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add expense');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleContinueManual = async () => {
    if (!groupId || !currentUserId || !paidById) return;
    const amt = parseFloat(amount);
    if (!title.trim()) { setError('Enter a title'); return; }
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); return; }
    if (selectedMemberIds.length === 0) { setError('Select at least one person'); return; }
    setError(null);
    setSubmitLoading(true);
    try {
      const expense = await createExpense({
        group_id: groupId,
        title: title.trim(),
        category: selectedCategory.label,
        amount_cents: Math.round(amt * 100),
        paid_by: paidById,
        split_mode: 'manual',
      });
      setSubmitLoading(false);
      const query = new URLSearchParams({
        expense_id: expense.id,
        group_id: groupId,
        member_ids: selectedMemberIds.join(','),
        total_cents: String(expense.amount_cents),
        title: title.trim(),
      });
      router.push(`/groups/manual-split?${query.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add expense');
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color="#3b5e4f" />
      </View>
    );
  }

  const canGoNext =
    title.trim().length > 0 &&
    !isNaN(parseFloat(amount)) &&
    parseFloat(amount) > 0 &&
    selectedMemberIds.length > 0 &&
    paidById != null;

  if (error && !groupId) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerCard}>
          <TouchableOpacity
            onPress={() => (step === 1 ? router.back() : setStep(1))}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
          {step === 2 ? (
            <Text style={styles.headerStep}>Step 2 of 2</Text>
          ) : null}
        </View>

        {error ? <Text style={styles.formError}>{error}</Text> : null}

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
            onPress={() => { setShowPaidByDrop(false); setShowCategoryDrop((v) => !v); }}
            activeOpacity={0.7}
          >
            <View style={styles.dropdownLeft}>
              <View style={[styles.dot, { backgroundColor: selectedCategory.color }]} />
              <Text style={styles.dropdownText}>{selectedCategory.label}</Text>
            </View>
            <Text style={styles.chevron}>⌄</Text>
          </TouchableOpacity>
          {showCategoryDrop && (
            <View style={styles.dropdownMenuRaised}>
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

          {/* Paid By — dropdown first (wrapped so menu draws above Split Between) */}
          <View style={styles.dropdownSection}>
            <Text style={styles.label}>Paid By</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setShowCategoryDrop(false);
                setShowPaidByDrop((v) => !v);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownText}>{paidByLabel}</Text>
              <Text style={styles.chevron}>{showPaidByDrop ? '⌃' : '⌄'}</Text>
            </TouchableOpacity>
            {showPaidByDrop && (
              <View style={styles.dropdownMenuRaised}>
                {memberOptions.length === 0 ? (
                  <Text style={styles.dropdownEmpty}>No members in this group</Text>
                ) : (
                  memberOptions.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      style={styles.dropdownItem}
                      onPress={() => { setPaidById(member.id); setShowPaidByDrop(false); }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dropdownText}>{member.label}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Split Between — list of members to split among */}
          <Text style={styles.label}>Split Between</Text>
          <View style={styles.checkboxGroup}>
            {memberOptions.length === 0 ? (
              <Text style={styles.selectedCount}>No members in this group. Add members to the group first.</Text>
            ) : (
              <>
                {memberOptions.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.checkboxRow}
                    onPress={() => toggleMember(member.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, selectedMemberIds.includes(member.id) && styles.checkboxChecked]}>
                      {selectedMemberIds.includes(member.id) && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>{member.label}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.selectedCount}>Selected: {selectedMemberIds.length} people</Text>
              </>
            )}
          </View>

          {step === 1 ? (
            <TouchableOpacity
              style={[styles.button, !canGoNext && styles.buttonDisabled]}
              onPress={() => setStep(2)}
              disabled={!canGoNext}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <>
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
                <TouchableOpacity
                  style={[styles.button, submitLoading && styles.buttonDisabled]}
                  onPress={handleAddExpenseEqual}
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Add Expense{perPerson ? `  ·  $${perPerson} each` : ''}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    (continuePressed || submitLoading) && { backgroundColor: '#3b5e4f' },
                    submitLoading && styles.buttonDisabled,
                  ]}
                  onPressIn={() => setContinuePressed(true)}
                  onPressOut={() => setContinuePressed(false)}
                  onPress={handleContinueManual}
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Continue</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    paddingBottom: 60,
  },
  errorText: {
    fontFamily: 'monospace',
    color: '#c62828',
    textAlign: 'center',
  },
  backLink: { marginTop: 12 },
  backLinkText: { fontFamily: 'monospace', color: '#3b5e4f', fontSize: 16 },
  formError: {
    fontFamily: 'monospace',
    color: '#c62828',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  buttonDisabled: { opacity: 0.7 },

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
  headerStep: {
    color: '#a8c4b8',
    fontFamily: 'monospace',
    fontSize: 13,
    marginTop: 4,
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
  dropdownSection: {
    zIndex: 1000,
    elevation: 10,
  },
  dropdownMenuRaised: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginTop: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    zIndex: 1001,
    elevation: 11,
  },
  dropdownEmpty: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#888',
    padding: 14,
    textAlign: 'center',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    minHeight: 44,
    justifyContent: 'center',
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
    padding: 12,
    gap: 12,
    minHeight: 48,
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
