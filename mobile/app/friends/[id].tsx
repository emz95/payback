import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Image, ActivityIndicator
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getProfile, type ApiProfile } from '@/lib/api';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
  } from 'react-native-reanimated';
  import { Dimensions } from 'react-native';
  
  const { width, height } = Dimensions.get('window');
  
  const miso1 = require('../../assets/images/miso1.png');
  const miso2 = require('../../assets/images/miso2.png');
  const trisha = require('../../assets/images/wario.png'); // swap with trisha
  
  const IMAGES = [miso1, miso2, trisha];
const angryCat = require('../../assets/images/trisha.png'); // swap with your angry cat photo

function avatarLetter(username: string): string {
  return (username[0] ?? '?').toUpperCase();
}

const [raining, setRaining] = useState(false);

const sendReminder = () => {
  setRaining(true);
  setTimeout(() => setRaining(false), 3000); // stop after 3 seconds
  Alert.alert('Reminder Sent! 📢', `${friend.username} has been reminded to pay you.`);
};

function FallingImage({ source, delay, startX }: { source: any, delay: number, startX: number }) {
    const translateY = useSharedValue(-100);
  
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
      position: 'absolute',
      left: startX,
      top: 0,
    }));
  
    useEffect(() => {
      translateY.value = withDelay(
        delay,
        withTiming(height + 100, { duration: 2000, easing: Easing.linear })
      );
    }, []);
  
    return (
      <Animated.View style={animatedStyle}>
        <Image source={source} style={{ width: 60, height: 60, borderRadius: 30 }} />
        {raining && (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {Array.from({ length: 12 }).map((_, i) => (
      <FallingImage
        key={i}
        source={IMAGES[i % IMAGES.length]}
        delay={i * 200}
        startX={Math.random() * width}
      />
    ))}
  </View>
)}
      </Animated.View>
    );
  }

export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [friend, setFriend] = useState<ApiProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile(id);
        setFriend(profile);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const copyToClipboard = (text: string, label: string) => {
    Alert.alert('Copied!', `${label} copied to clipboard`);
    // TODO: use expo-clipboard for real copy
  };

  const sendReminder = () => {
    Alert.alert('Reminder Sent! 📢', `${friend?.username} has been reminded to pay you.`);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b5e4f" />
      </View>
    );
  }

  if (error || !friend) {
    return (
      <View style={styles.centered}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonError}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.errorText}>{error ?? 'Friend not found'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerCard}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Profile */}
        <View style={styles.profileSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{avatarLetter(friend.username)}</Text>
          </View>
          <Text style={styles.username}>{friend.username}</Text>
        </View>

        {/* Payment Information */}
        {(friend.venmo || friend.zelle) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information</Text>

            {friend.venmo && (
              <>
                <Text style={styles.fieldLabel}>Venmo</Text>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldValue}>{friend.venmo}</Text>
                  <TouchableOpacity
                    style={styles.copyButtonPink}
                    onPress={() => copyToClipboard(friend.venmo!, 'Venmo')}
                  >
                    <Text style={styles.copyButtonText}>Copy</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {friend.zelle && (
              <>
                <Text style={styles.fieldLabel}>Zelle</Text>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldValue}>{friend.zelle}</Text>
                  <TouchableOpacity
                    style={styles.copyButtonGreen}
                    onPress={() => copyToClipboard(friend.zelle!, 'Zelle')}
                  >
                    <Text style={styles.copyButtonText}>Copy</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            <Text style={styles.noPaymentText}>
              {friend.username} hasn't added payment info yet.
            </Text>
          </View>
        )}

        {/* Tip Box */}
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            💡 Send the payment through Venmo or Zelle, then mark it as paid below
          </Text>
        </View>

        {/* Send Reminder */}
        <TouchableOpacity style={styles.reminderRow} onPress={sendReminder}>
          <Image source={angryCat} style={styles.angryCatImage} />
          <Text style={styles.reminderText}>Send Payment Reminder 📢</Text>
        </TouchableOpacity>

        {/* Mark as Paid */}
        <TouchableOpacity
          style={styles.markPaidButton}
          onPress={() => Alert.alert('Marked as Paid!', `${friend.username} has been marked as paid.`)}
        >
          <Text style={styles.markPaidText}>Mark as Paid</Text>
        </TouchableOpacity>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonEmoji}>🕐</Text>
            <Text style={styles.comingSoonText}>Coming soon...</Text>
          </View>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0efeb',
    padding: 24,
  },
  errorText: {
    fontFamily: 'monospace',
    color: '#c62828',
    textAlign: 'center',
  },
  backButtonError: {
    position: 'absolute',
    top: 60,
    left: 20,
  },

  // Header
  headerCard: {
    backgroundColor: '#3b5e4f',
    borderRadius: 20,
    margin: 16,
    marginBottom: 0,
    padding: 20,
    paddingBottom: 44,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backArrow: {
    color: '#fff',
    fontSize: 22,
  },

  // Profile
  profileSection: {
    alignItems: 'center',
    marginTop: -28,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3b5e4f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 4,
    borderColor: '#f0efeb',
  },
  avatarLetter: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'serif',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'serif',
    color: '#1a1a1a',
    marginBottom: 4,
  },

  // Section card
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  fieldValue: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#1a1a1a',
  },
  copyButtonPink: {
    backgroundColor: '#e8a0a0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  copyButtonGreen: {
    backgroundColor: '#3b5e4f',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  copyButtonText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '600',
  },
  noPaymentText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    paddingVertical: 10,
  },

  // Tip box
  tipBox: {
    backgroundColor: '#fdf8e8',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 12,
  },
  tipText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#a07830',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Reminder
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  angryCatImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  reminderText: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  // Mark as paid
  markPaidButton: {
    backgroundColor: '#3b5e4f',
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  markPaidText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '600',
  },

  // Coming soon
  comingSoon: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  comingSoonEmoji: {
    fontSize: 32,
  },
  comingSoonText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#aaa',
  },

  positive: { color: '#3daa6e' },
  negative: { color: '#e07070' },
});