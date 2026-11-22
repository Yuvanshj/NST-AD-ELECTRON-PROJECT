import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useMobileAuth } from '../../contexts/AuthContext';
import { mobileApi } from '../../services/api';

export const EventDetailsScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { event } = route.params;
  const { user } = useMobileAuth();

  const handleRsvp = async () => {
    if (!user?._id) {
      Alert.alert('Sign In', 'Please sign in to register.');
      return;
    }
    try {
      const res = await mobileApi.events.rsvp(event._id, user._id);
      navigation.navigate('QrTicket', { ticket: res.rsvp, eventTitle: event.title });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={event.title} subtitle="Event Details" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card>
          <Text style={styles.type}>{event.type || 'REUNION'}</Text>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.college}>{event.collegeName || 'Gujarat Technological University'}</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoItem}>📍 Venue: {event.venue || event.location}</Text>
            <Text style={styles.infoItem}>
              📅 Date: {new Date(event.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
            <Text style={styles.infoItem}>⏰ Time: {event.time || '10:00 AM IST'}</Text>
            <Text style={styles.infoItem}>👥 Capacity: {event.capacity} seats</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>About the Event</Text>
          <Text style={styles.desc}>{event.description}</Text>
        </Card>

        <Button
          title={event.isRegistered ? "🎟️ View Digital QR Ticket" : "Register & Generate QR Ticket"}
          onPress={handleRsvp}
          variant="success"
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d' },
  type: { fontSize: 11, fontWeight: '800', color: '#60a5fa', textTransform: 'uppercase' },
  title: { fontSize: 20, fontWeight: '800', color: '#ffffff', marginTop: 4 },
  college: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  infoBox: {
    marginTop: 14,
    backgroundColor: '#0d1527',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  infoItem: { fontSize: 13, color: '#cbd5e1' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 8 },
  desc: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },
});
