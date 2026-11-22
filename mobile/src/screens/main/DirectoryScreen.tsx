import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { mobileApi } from '../../services/api';
import { useMobileAuth } from '../../contexts/AuthContext';
import { User } from '../../types';

export const DirectoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useMobileAuth();
  const [alumni, setAlumni] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDirectory();
  }, [search, branchFilter]);

  const loadDirectory = async () => {
    try {
      const res = await mobileApi.directory.search({
        query: search,
        branch: branchFilter,
        currentUserId: user?._id,
      });
      if (res.alumni) {
        setAlumni(res.alumni);
      }
    } catch (e) {
      console.log('Error loading directory:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleConnect = async (targetId: string) => {
    if (!user?._id) return;
    try {
      await mobileApi.directory.connect(user._id, targetId);
      Alert.alert('Sent', 'Connection request sent successfully!');
      loadDirectory();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isVerified = item.verificationStatus === 'VERIFIED';
    const isSelf = user?._id === item._id;

    return (
      <Card>
        <TouchableOpacity
          onPress={() => navigation.navigate('AlumniProfile', { alumnus: item })}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.fullName?.charAt(0) || 'A'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.name}>{item.fullName}</Text>
                {isVerified && <Text style={styles.verifiedBadge}>✓ VERIFIED</Text>}
              </View>
              <Text style={styles.company}>
                {item.profile?.designation || 'Alumnus'} • {item.profile?.currentCompany || 'Gujarat Tech'}
              </Text>
              <Text style={styles.meta}>
                {item.collegeName || 'GTU Engineering'} • Class of {item.batchYear || item.batch || '2020'}
              </Text>
            </View>
          </View>

          {item.profile?.skills && item.profile.skills.length > 0 && (
            <View style={styles.skillsRow}>
              {item.profile.skills.slice(0, 3).map((sk: string, idx: number) => (
                <View key={idx} style={styles.skillChip}>
                  <Text style={styles.skillText}>{sk}</Text>
                </View>
              ))}
            </View>
          )}

          {!isSelf && item.connectionStatus !== 'ACCEPTED' && (
            <TouchableOpacity
              onPress={() => handleConnect(item._id)}
              style={[
                styles.connectBtn,
                item.connectionStatus === 'PENDING' && { backgroundColor: '#334155' },
              ]}
              disabled={item.connectionStatus === 'PENDING'}
            >
              <Text style={styles.connectBtnText}>
                {item.connectionStatus === 'PENDING' ? 'Request Pending' : '+ Connect'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Alumni Directory"
        subtitle="Connect with graduates across Gujarat state colleges"
      />

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, company, skill or branch..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color="#3b82f6" size="large" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={alumni}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadDirectory();
              }}
              tintColor="#3b82f6"
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Alumni Found"
              message="Try adjusting your search criteria or explore other departments."
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d' },
  searchBox: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchInput: {
    backgroundColor: '#131b2e',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#ffffff',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  name: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  verifiedBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34d399',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  company: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  meta: { fontSize: 11, color: '#64748b', marginTop: 2 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  skillChip: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  skillText: { fontSize: 11, color: '#60a5fa', fontWeight: '500' },
  connectBtn: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  connectBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
});
