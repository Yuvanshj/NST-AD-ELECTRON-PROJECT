import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useMobileAuth } from '../../contexts/AuthContext';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useMobileAuth();
  const profile = user?.profile || {};
  const isVerified = user?.verificationStatus === 'VERIFIED';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of MahaSetu?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="My Profile" subtitle="Account Credentials & Institutional Status" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'U'}</Text>
          </View>
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.role}>{user?.role} • {user?.email}</Text>

          <View style={[styles.badge, isVerified ? styles.badgeVerified : styles.badgePending]}>
            <Text style={styles.badgeText}>
              {isVerified ? '✓ GTU VERIFIED ALUMNUS' : '⏳ PENDING REGISTRAR VERIFICATION'}
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Institutional Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Institution:</Text>
            <Text style={styles.val}>{user?.collegeName || 'L.D. College of Engineering'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Enrollment No:</Text>
            <Text style={styles.val}>{profile.enrollmentNumber || '160280107042'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Department:</Text>
            <Text style={styles.val}>{profile.branch || 'Computer Engineering'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Class / Batch:</Text>
            <Text style={styles.val}>{profile.batch || '2020'}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Quick Shortcuts</Text>
          <Button
            title="🔔 In-App Notifications"
            variant="secondary"
            onPress={() => navigation.navigate('Notifications')}
            style={{ marginBottom: 8 }}
          />
          <Button
            title="💬 Direct Messages"
            variant="secondary"
            onPress={() => navigation.navigate('Chat')}
          />
        </Card>

        <Button
          title="Sign Out of MahaSetu"
          variant="danger"
          onPress={handleLogout}
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d' },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#ffffff' },
  name: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  role: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 10 },
  badgeVerified: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: '#10b981' },
  badgePending: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: '#f59e0b' },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#ffffff' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 13, color: '#94a3b8' },
  val: { fontSize: 13, color: '#ffffff', fontWeight: '600' },
});
