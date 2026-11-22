import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { mobileApi } from '../../services/api';
import { useMobileAuth } from '../../contexts/AuthContext';
import { Job } from '../../types';

export const JobsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useMobileAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filterReferral, setFilterReferral] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [filterReferral]);

  const loadJobs = async () => {
    try {
      const res = await mobileApi.jobs.getAll({
        canReferOnly: filterReferral ? 'true' : undefined,
        currentUserId: user?._id,
      });
      if (res.jobs) {
        setJobs(res.jobs);
      }
    } catch (e) {
      console.log('Failed to load jobs:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }: { item: Job }) => {
    return (
      <Card>
        <TouchableOpacity
          onPress={() => navigation.navigate('JobDetails', { job: item })}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.jobTitle}>{item.title}</Text>
              <Text style={styles.companyName}>{item.company}</Text>
            </View>
            {item.canRefer && (
              <View style={styles.referralBadge}>
                <Text style={styles.referralText}>⭐ ALUMNI REFERRAL</Text>
              </View>
            )}
          </View>

          <Text style={styles.location}>📍 {item.location} • {item.employmentType || 'FULL_TIME'}</Text>

          {item.salaryRange && (
            <Text style={styles.salary}>💰 {item.salaryRange}</Text>
          )}

          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.footerRow}>
            <Text style={styles.postedBy}>Posted by: {item.posterName || 'Gujarat Alumnus'}</Text>
            <Text style={styles.viewDetails}>View Details & Apply →</Text>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Job Board & Referrals"
        subtitle="Exclusive career opportunities posted by verified alumni"
      />

      <View style={styles.filterRow}>
        <TouchableOpacity
          onPress={() => setFilterReferral(false)}
          style={[styles.filterChip, !filterReferral && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, !filterReferral && styles.filterTextActive]}>All Openings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilterReferral(true)}
          style={[styles.filterChip, filterReferral && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, filterReferral && styles.filterTextActive]}>⭐ Internal Referrals</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#3b82f6" size="large" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadJobs();
              }}
              tintColor="#3b82f6"
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Job Postings"
              message="No job openings currently match your criteria. Check back soon!"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#131b2e',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: { backgroundColor: '#2563eb', borderColor: '#3b82f6' },
  filterText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  filterTextActive: { color: '#ffffff' },
  jobTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  companyName: { fontSize: 13, color: '#60a5fa', marginTop: 2, fontWeight: '600' },
  referralBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  referralText: { fontSize: 9, fontWeight: '800', color: '#fbbf24' },
  location: { fontSize: 12, color: '#cbd5e1', marginTop: 6 },
  salary: { fontSize: 12, color: '#34d399', fontWeight: '600', marginTop: 2 },
  desc: { fontSize: 12, color: '#94a3b8', marginTop: 8, lineHeight: 18 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  postedBy: { fontSize: 11, color: '#64748b' },
  viewDetails: { fontSize: 12, color: '#60a5fa', fontWeight: '600' },
});
