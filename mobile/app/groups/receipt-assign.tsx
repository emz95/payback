// After receipt scan: list items, tap each to assign to a person; choose who paid; confirm creates expense + manual split.
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Fonts } from '@/constants/theme';
import { getGroupMembers, createExpense, splitExpenseManual, type ApiReceiptItem } from '@/lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

type MemberOption = { id: string; label: string };

function avatarLetter(label: string): string {
  return (label[0] ?? '?').toUpperCase();
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string {
  const v = params[key];
  return typeof v === 'string' ? v : Array.isArray(v) ? v[0] ?? '' : '';
}

export default function ReceiptAssignScreen() {
  const params = useLocalSearchParams<{
    group_id?: string;
    items_json?: string;
    total_cents?: string;
    total?: string;
  }>();
  const groupId = getParam(params, 'group_id');
  const itemsJson = getParam(params, 'items_json');
  const totalCentsParam = getParam(params, 'total_cents');
  const totalParam = getParam(params, 'total');

  const [items, setItems] = useState<ApiReceiptItem[]>([]);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [paidById, setPaidById] = useState<string | null>(null);
  const [showPaidByDrop, setShowPaidByDrop] = useState(false);
  const [itemAssignments, setItemAssignments] = useState<Record<number, string>>({});
  const [assigningItemIndex, setAssigningItemIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const totalCents = parseInt(totalCentsParam, 10) || 0;
  const totalDollars = parseFloat(totalParam) || totalCents / 100;

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      setError('Missing group');
      return;
    }
    let parsed: ApiReceiptItem[] = [];
    try {
      if (itemsJson) parsed = JSON.parse(decodeURIComponent(itemsJson)) as ApiReceiptItem[];
    } catch {
      setError('Invalid receipt data');
      setLoading(false);
      return;
    }
    setItems(parsed);

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const me = session?.user?.id ?? null;
        setCurrentUserId(me);
        const members = await getGroupMembers(groupId);
        const options: MemberOption[] = members.map((m) => ({
          id: m.user_id,
          label: m.user_id === me ? 'You' : m.username,
        }));
        setMemberOptions(options);
        setPaidById(me ?? options[0]?.id ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId, itemsJson]);

  const assignItemTo = (itemIndex: number, userId: string) => {
    setItemAssignments((prev) => ({ ...prev, [itemIndex]: userId }));
    setAssigningItemIndex(null);
  };

  const paidByLabel = memberOptions.find((m) => m.id === paidById)?.label ?? '—';
  const assignedCount = Object.keys(itemAssignments).length;
  const allAssigned = items.length > 0 && assignedCount === items.length;

  const handleConfirm = async () => {
    if (!groupId || !paidById || !allAssigned) return;
    setError(null);
    setSubmitLoading(true);
    try {
      const byUser: Record<string, number> = {};
      items.forEach((item, i) => {
        const uid = itemAssignments[i];
        if (uid) byUser[uid] = (byUser[uid] ?? 0) + item.amount_cents;
      });
      const splitItems = Object.entries(byUser).map(([user_id, base_cents]) => ({
        user_id,
        base_cents,
      }));

      const expense = await createExpense({
        group_id: groupId,
        title: 'Receipt',
        category: 'Other',
        amount_cents: totalCents,
        paid_by: paidById,
        split_mode: 'manual',
      });
      await splitExpenseManual(expense.id, splitItems);
      router.back();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add expense');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top + 8 }]}>
        <ActivityIndicator size="large" color="#3b5e4f" />
      </View>
    );
  }

  if (error && !groupId) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (items.length === 0 && !error) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.errorText}>No items to assign</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerCard}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign items</Text>
        <Text style={styles.headerSubtitle}>
          Tap each item to assign · Total ${totalDollars.toFixed(2)}
        </Text>
      </View>

      <View style={styles.paidBySection}>
        <Text style={styles.paidByLabel}>Paid by</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowPaidByDrop((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownText}>{paidByLabel}</Text>
          <Text style={styles.chevron}>{showPaidByDrop ? '⌃' : '⌄'}</Text>
        </TouchableOpacity>
        {showPaidByDrop && (
          <View style={styles.dropdownMenu}>
            {memberOptions.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setPaidById(m.id);
                  setShowPaidByDrop(false);
                }}
              >
                <Text style={styles.dropdownText}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.itemsList}>
          {items.map((item, index) => {
            const assigneeId = itemAssignments[index];
            const assigneeLabel = memberOptions.find((m) => m.id === assigneeId)?.label ?? 'Tap to assign';
            return (
              <TouchableOpacity
                key={index}
                style={styles.itemRow}
                onPress={() => setAssigningItemIndex(index)}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.itemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.assigneeBadge}>
                    <Text style={assigneeId ? styles.assigneeText : styles.assigneePlaceholder}>
                      {assigneeId ? avatarLetter(assigneeLabel) : '?'}
                    </Text>
                    <Text style={assigneeId ? styles.assigneeName : styles.assigneePlaceholderName}>
                      {assigneeLabel}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemAmount}>
                    ${(item.amount_cents / 100).toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={assigningItemIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAssigningItemIndex(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAssigningItemIndex(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign to</Text>
            {assigningItemIndex !== null && items[assigningItemIndex] && (
              <Text style={styles.modalItemDesc} numberOfLines={1}>
                {items[assigningItemIndex].description}
              </Text>
            )}
            <FlatList
              data={memberOptions}
              keyExtractor={(m) => m.id}
              renderItem={({ item: m }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => assigningItemIndex !== null && assignItemTo(assigningItemIndex, m.id)}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarEmoji}>{avatarLetter(m.label)}</Text>
                  </View>
                  <Text style={styles.modalOptionLabel}>{m.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.summaryBar}>
        {error ? <Text style={styles.formError}>{error}</Text> : null}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Assigned {assignedCount} / {items.length}
          </Text>
          <Text style={styles.summaryValueBold}>${totalDollars.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmButton, (!allAssigned || submitLoading) && styles.confirmButtonDisabled]}
          disabled={!allAssigned || submitLoading}
          onPress={handleConfirm}
        >
          {submitLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text
              style={[
                styles.confirmButtonText,
                !allAssigned && styles.confirmButtonTextDisabled,
              ]}
            >
              Add expense
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  errorText: {
    fontFamily: Fonts.mono,
    color: '#c62828',
    textAlign: 'center',
  },
  backLink: { marginTop: 12 },
  backLinkText: { fontFamily: Fonts.mono, color: '#3b5e4f', fontSize: 16 },
  formError: {
    fontFamily: Fonts.mono,
    color: '#c62828',
    marginBottom: 8,
  },

  headerCard: {
    backgroundColor: '#3b5e4f',
    borderRadius: 20,
    margin: 16,
    marginBottom: 0,
    padding: 20,
  },
  backButton: { marginBottom: 12 },
  backArrow: { color: '#fff', fontSize: 22 },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontFamily: Fonts.serif,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#a8c4b8',
    fontFamily: Fonts.mono,
    fontSize: 13,
  },

  paidBySection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#f0efeb',
    zIndex: 100,
  },
  paidByLabel: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  dropdownText: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: '#333',
  },
  chevron: { fontSize: 16, color: '#888' },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginTop: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  container: {
    padding: 16,
    paddingBottom: 24,
  },
  itemsList: { gap: 10 },
  itemRow: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: { flex: 1, gap: 8 },
  itemDescription: {
    fontFamily: Fonts.mono,
    fontSize: 15,
    color: '#1a1a1a',
  },
  assigneeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assigneeText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: '#3b5e4f',
    fontWeight: '600',
  },
  assigneePlaceholder: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: '#aaa',
  },
  assigneeName: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: '#666',
  },
  assigneePlaceholderName: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: '#aaa',
    fontStyle: 'italic',
  },
  itemRight: { alignItems: 'flex-end' },
  itemAmount: {
    fontFamily: Fonts.mono,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  modalItemDesc: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b5e4f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
    color: '#fff',
  },
  modalOptionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 15,
    color: '#1a1a1a',
  },

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
  summaryLabel: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: '#888',
  },
  summaryValueBold: {
    fontFamily: Fonts.mono,
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
    fontFamily: Fonts.mono,
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButtonTextDisabled: {
    color: '#fff',
  },
});
