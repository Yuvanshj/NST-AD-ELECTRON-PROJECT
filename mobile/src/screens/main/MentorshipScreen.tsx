import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { mobileApi } from '../../services/api';
import { useMobileAuth } from '../../contexts/AuthContext';

export const MentorshipScreen: React.FC<{ navigation: any }> = () => {
  const { user } = useMobileAuth();
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMentors();
  }, []);

  const loadMentors = async () => {
    try {
      const res = await mobileApi.mentorship.getMentors(user?._id);
      if (Array.isArray(res)) {
        setMentors(res);
      }
    } catch (e) {
      console.log('Failed to load mentors:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRequestMentorship = async (mentor: any) => {
    if (!user?._id) {
      Alert.alert('Sign In', 'Please sign in to request mentorship.');
      return;
    }
    try {
      await mobileApi.mentorship.requestMatch({
        mentorId: mentor.userId,
        menteeId: user._id,
        topic: 'Career Guidance & Industry Navigation',
        message: 'Looking forward to learning from your experience in the Gujarat tech industry.',
      });
      Alert.alert('Request Sent', `Mentorship request submitted to ${mentor.fullName}!`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.name}>{item.fullName}</Text>
            <Text style={styles.company}>
              {item.designation || 'Alumnus'} at {item.currentCompany || 'Industry Leader'}
            </Text>
            <Text style={styles.branch}>
              {item.branch} • Class of {item.batch}
            </Text>
          </View>
          <View style={styles.matchBadge}>
            <Text style={styles.matchText}>{item.matchScore}% MATCH</Text>
          </View>
        </View>

        {item.mentorDomain && (
          <Text style={styles.domain}>Focus Domain: {item.mentorDomain}</Text>
        )}

        {item.mentorAvailability && (
          <Text style={styles.avail}>⏰ Availability: {item.mentorAvailability}</Text>
        )}

        <Button
          title="Request Mentorship Session"
          onPress={() => handleRequestMentorship(item)}
          style={{ marginTop: 12 }}
        />
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Student-Alumni Mentorship"
        subtitle="Skills-based matching with industry alumni"
      />

      {loading ? (
        <ActivityIndicator color="#3b82f6" size="large" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={mentors}
          keyExtractor={(item) => item.userId || item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadMentors();
              }}
              tintColor="#3b82f6"
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Mentors Available"
              message="Check back soon as verified alumni join the mentor cohort."
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d' },
  name: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  company: { fontSize: 13, color: '#60a5fa', fontWeight: '600', marginTop: 2 },
  branch: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  matchBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchText: { fontSize: 10, fontWeight: '800', color: '#34d399' },
  domain: { fontSize: 12, color: '#cbd5e1', marginTop: 8 },
  avail: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
});
