// Manual split: one row per groupmate (from "Split Between"), dollar inputs, proportionally fill remainder, confirm calls backend.
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Fonts } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { getGroupMembers, splitExpenseManual } from '@/lib/api';

type MemberRow = { id: string; username: string };

function avatarLetter(username: string): string {
  return (username[0] ?? '?').toUpperCase();
}

export default function ManualSplitScreen() {
  const params = useLocalSearchParams<{
    expense_id?: string;
    group_id?: string;
    member_ids?: string;
    total_cents?: string;
    title?: string;
  }>();
  const expenseId = typeof params.expense_id === 'string' ? params.expense_id : params.expense_id?.[0];
  const groupId = typeof params.group_id === 'string' ? params.group_id : params.group_id?.[0];
  const memberIdsParam = typeof params.member_ids === 'string' ? params.member_ids : params.member_ids?.[0] ?? '';
  const totalCentsParam = typeof params.total_cents === 'string' ? params.total_cents : params.total_cents?.[0] ?? '0';
  const titleParam = typeof params.title === 'string' ? params.title : params.title?.[0] ?? 'Expense';

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [viewingProportional, setViewingProportional] = useState(false);
  const [originalAmountsBeforeView, setOriginalAmountsBeforeView] = useState<Record<string, string> | null>(null);
  const insets = useSafeAreaInsets();

  const totalCents = parseInt(totalCentsParam, 10) || 0;
  const TOTAL = totalCents / 100;
  const EXPENSE_NAME = decodeURIComponent(titleParam);

  useEffect(() => {
    if (!groupId || !memberIdsParam) {
      setLoading(false);
      return;
    }
    const ids = memberIdsParam.split(',').filter(Boolean);
    (async () => {
      try {
        const [session, groupMembers] = await Promise.all([
          supabase.auth.getSession(),
          getGroupMembers(groupId),
        ]);
        const me = session.data?.session?.user?.id ?? null;
        setCurrentUserId(me);
        const ordered = ids
          .map((id) => groupMembers.find((m) => m.user_id === id))
          .filter(Boolean) as { user_id: string; username: string }[];
        const withNames = ordered.map((m) => ({
          id: m.user_id,
          username: me && m.user_id === me ? 'You' : m.username,
        }));
        setMembers(withNames);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId, memberIdsParam]);

  const getAmount = (id: string) => parseFloat(amounts[id] || '0') || 0;

  const subtotal = parseFloat(
    members.reduce((sum, m) => sum + getAmount(m.id), 0).toFixed(2)
  );
  const remaining = parseFloat((TOTAL - subtotal).toFixed(2));
  const isOver = remaining < 0;
  const isComplete = remaining === 0;

  const getPercent = (id: string) => {
    if (subtotal === 0) return '0%';
    return ((getAmount(id) / subtotal) * 100).toFixed(1) + '%';
  };

  const applyProportionalSplit = useCallback(() => {
    const newAmounts: Record<string, string> = {};
    if (subtotal === 0 || members.length === 0) {
      const equalEach = members.length > 0 ? TOTAL / members.length : 0;
      members.forEach((m) => {
        newAmounts[m.id] = parseFloat(equalEach.toFixed(2)).toString();
      });
      return newAmounts;
    }
    members.forEach((m) => {
      const share = getAmount(m.id) / subtotal;
      const newVal = parseFloat((getAmount(m.id) + share * remaining).toFixed(2));
      newAmounts[m.id] = newVal.toString();
    });
    return newAmounts;
  }, [amounts, members, subtotal, remaining, TOTAL]);

  const toggleViewSplit = useCallback(() => {
    if (viewingProportional) {
      if (originalAmountsBeforeView) setAmounts(originalAmountsBeforeView);
      setOriginalAmountsBeforeView(null);
      setViewingProportional(false);
    } else {
      setOriginalAmountsBeforeView({ ...amounts });
      const proportional = applyProportionalSplit();
      if (proportional) setAmounts(proportional);
      setViewingProportional(true);
    }
  }, [viewingProportional, originalAmountsBeforeView, amounts, applyProportionalSplit]);

  const handleConfirm = async () => {
    if (!expenseId || !isComplete) return;
    setError(null);
    setSubmitLoading(true);
    try {
      const items = members.map((m) => ({
        user_id: m.id,
        base_cents: Math.round(getAmount(m.id) * 100),
      }));
      await splitExpenseManual(expenseId, items);
      router.back();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save split');
    } finally {
      setSubmitLoading(false);
    }
  };

  const remainingColor = isOver ? '#e07070' : remaining > 0 ? '#e8b84b' : '#3daa6e';

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top + 8 }]}>
        <ActivityIndicator size="large" color="#3b5e4f" />
      </View>
    );
  }

  if (error && members.length === 0) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top + 8 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
        <View style={styles.membersList}>
          {members.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <View style={styles.memberLeft}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>{avatarLetter(member.username)}</Text>
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

        {members.length > 0 && (
          <TouchableOpacity style={styles.proportionalButton} onPress={toggleViewSplit}>
            <Text style={styles.proportionalButtonText}>
              {viewingProportional ? 'Back to amounts' : 'View Split'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.summaryBar}>
        {error ? <Text style={styles.formError}>{error}</Text> : null}
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
          style={[styles.confirmButton, (!isComplete || submitLoading) && styles.confirmButtonDisabled]}
          disabled={!isComplete || submitLoading}
          onPress={handleConfirm}
        >
          {submitLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.confirmButtonText, !isComplete && styles.confirmButtonTextDisabled]}>
              Confirm Split
            </Text>
          )}
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
    fontFamily: Fonts.serif,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#a8c4b8',
    fontFamily: Fonts.mono,
    fontSize: 13,
  },

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
    color: '#fff',
  },
  memberName: {
    fontFamily: Fonts.mono,
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
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: '#888',
    marginRight: 2,
  },
  amountInput: {
    fontFamily: Fonts.mono,
    fontSize: 15,
    color: '#1a1a1a',
    minWidth: 70,
    textAlign: 'right',
  },
  percentBadge: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: '#aaa',
  },

  proportionalButton: {
    backgroundColor: '#e8a0a0',
    borderRadius: 25,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  proportionalButtonText: {
    color: '#fff',
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '600',
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
  summaryRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  summaryLabel: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: '#888',
  },
  summaryValue: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: '#888',
  },
  summaryLabelBold: {
    fontFamily: Fonts.mono,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
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
