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
import { Event } from '../../types';

export const EventsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useMobileAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await mobileApi.events.getAll();
      if (res.events) {
        setEvents(res.events);
      }
    } catch (e) {
      console.log('Failed to load events:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRsvp = async (event: Event) => {
    if (!user?._id) {
      Alert.alert('Sign In', 'Please sign in to register for events.');
      return;
    }
    try {
      const res = await mobileApi.events.rsvp(event._id, user._id);
      Alert.alert('Registration Confirmed', `You have registered for ${event.title}!`, [
        {
          text: 'View QR Ticket Pass',
          onPress: () =>
            navigation.navigate('QrTicket', { ticket: res.rsvp, eventTitle: event.title }),
        },
        { text: 'OK', onPress: () => loadEvents() },
      ]);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
    }
  };

  const renderItem = ({ item }: { item: Event }) => {
    return (
      <Card>
        <TouchableOpacity
          onPress={() => navigation.navigate('EventDetails', { event: item })}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{item.type || 'REUNION'}</Text>
            </View>
            <Text style={styles.collegeName}>{item.collegeName || 'GTU Network'}</Text>
          </View>

          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.venue}>📍 {item.venue || item.location}</Text>
          <Text style={styles.dateTime}>
            📅 {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • ⏰ {item.time || '10:00 AM'}
          </Text>

          <View style={styles.capacityRow}>
            <Text style={styles.capacityText}>
              Capacity: {item.registeredCount || 0} / {item.capacity} Registered
            </Text>
          </View>

          <View style={styles.btnRow}>
            {item.isRegistered ? (
              <Button
                title="🎟️ View QR Pass"
                variant="success"
                onPress={() =>
                  navigation.navigate('QrTicket', {
                    ticket: item.userTicket,
                    eventTitle: item.title,
                  })
                }
                style={{ flex: 1 }}
              />
            ) : (
              <Button
                title="RSVP / Get Digital Pass"
                onPress={() => handleRsvp(item)}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Events & Reunions"
        subtitle="Annual reunions, technical summits and webinars"
      />

      {loading ? (
        <ActivityIndicator color="#3b82f6" size="large" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadEvents();
              }}
              tintColor="#3b82f6"
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Upcoming Events"
              message="Check back soon for upcoming campus reunions and workshops."
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d' },
  typeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeText: { fontSize: 10, fontWeight: '800', color: '#60a5fa' },
  collegeName: { fontSize: 11, color: '#94a3b8' },
  title: { fontSize: 17, fontWeight: '700', color: '#ffffff', marginTop: 8 },
  venue: { fontSize: 13, color: '#cbd5e1', marginTop: 4 },
  dateTime: { fontSize: 12, color: '#34d399', fontWeight: '600', marginTop: 2 },
  capacityRow: { marginTop: 10 },
  capacityText: { fontSize: 11, color: '#94a3b8' },
  btnRow: { marginTop: 12, flexDirection: 'row' },
});
