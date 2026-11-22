import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useMobileAuth } from '../../contexts/AuthContext';
import { mobileApi } from '../../services/api';

export const AlumniProfileScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { alumnus } = route.params;
  const { user } = useMobileAuth();
  const profile = alumnus.profile || {};
  const isVerified = alumnus.verificationStatus === 'VERIFIED';

  const handleConnect = async () => {
    if (!user?._id) return;
    try {
      await mobileApi.directory.connect(user._id, alumnus._id);
      Alert.alert('Request Sent', `Connection request sent to ${alumnus.fullName}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleStartChat = () => {
    navigation.navigate('ChatConversation', {
      peerId: alumnus._id,
      peerName: alumnus.fullName,
    });
  };

  return (
    <View style={styles.container}>
      <Header title={alumnus.fullName} subtitle="Alumni Profile" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{alumnus.fullName?.charAt(0) || 'A'}</Text>
          </View>
          <Text style={styles.name}>{alumnus.fullName}</Text>
          {isVerified && <Text style={styles.badge}>✓ GUJARAT STATE VERIFIED ALUMNUS</Text>}
          <Text style={styles.role}>
            {profile.designation || 'Alumnus'} at {profile.currentCompany || 'Gujarat Tech'}
          </Text>
          <Text style={styles.college}>
            {alumnus.collegeName || 'Gujarat Technological University'}
          </Text>

          <View style={styles.actionRow}>
            <Button
              title="Message"
              onPress={handleStartChat}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="+ Connect"
              variant="secondary"
              onPress={handleConnect}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Academic Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Discipline / Branch:</Text>
            <Text style={styles.infoVal}>{alumnus.branch || profile.branch || 'Engineering'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Graduation Year:</Text>
            <Text style={styles.infoVal}>{alumnus.batchYear || profile.batch || '2020'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoVal}>{profile.city || 'Ahmedabad'}, Gujarat</Text>
          </View>
        </Card>

        {profile.skills && profile.skills.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Skills & Expertise</Text>
            <View style={styles.skillsRow}>
              {profile.skills.map((s: string, idx: number) => (
                <View key={idx} style={styles.chip}>
                  <Text style={styles.chipText}>{s}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d' },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLargeText: { fontSize: 32, fontWeight: '800', color: '#ffffff' },
  name: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34d399',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 6,
  },
  role: { fontSize: 13, color: '#cbd5e1', marginTop: 6 },
  college: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  actionRow: { flexDirection: 'row', marginTop: 16, width: '100%' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 13, color: '#94a3b8' },
  infoVal: { fontSize: 13, color: '#ffffff', fontWeight: '600' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  chipText: { fontSize: 12, color: '#60a5fa', fontWeight: '500' },
});
