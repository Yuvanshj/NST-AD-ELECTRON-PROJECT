import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { useMobileAuth } from '../../contexts/AuthContext';

export const QrTicketScreen: React.FC<{ route: any; navigation: any }> = ({ route }) => {
  const { ticket, eventTitle } = route.params;
  const { user } = useMobileAuth();

  return (
    <View style={styles.container}>
      <Header title="QR Event Pass" subtitle="Verifiable Digital Admission Ticket" />
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Card style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <Text style={styles.portalBrand}>MahaSetu • GUJARAT EDUCATION</Text>
            <Text style={styles.eventTitle}>{eventTitle || 'Campus Reunion Event'}</Text>
          </View>

          {ticket?.qrCode ? (
            <Image
              source={{ uri: ticket.qrCode }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={{ color: '#0f766e', fontWeight: '800', fontSize: 18 }}>
                {ticket?.ticketNumber || 'TKT-PASS'}
              </Text>
            </View>
          )}

          <View style={styles.ticketDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>TICKET NUMBER</Text>
              <Text style={styles.detailValue}>{ticket?.ticketNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ATTENDEE NAME</Text>
              <Text style={styles.detailValue}>{user?.fullName || 'Gujarat Alumnus'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ADMISSION STATUS</Text>
              <Text style={[styles.detailValue, { color: ticket?.isCheckedIn ? '#10b981' : '#38bdf8' }]}>
                {ticket?.isCheckedIn ? '✓ CHECKED IN' : 'CONFIRMED PASS'}
              </Text>
            </View>
          </View>

          <View style={styles.securityNote}>
            <Text style={styles.securityText}>
              🔒 Present this QR code at the registration desk for instant optical scan check-in.
            </Text>
          </View>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d' },
  ticketCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0d1527',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f766e',
  },
  ticketHeader: { alignItems: 'center', marginBottom: 16 },
  portalBrand: { fontSize: 10, fontWeight: '800', color: '#34d399', letterSpacing: 1 },
  eventTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff', marginTop: 4, textAlign: 'center' },
  qrImage: { width: 200, height: 200, borderRadius: 8, backgroundColor: '#ffffff', padding: 8 },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketDetails: { width: '100%', marginTop: 20, borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 14, gap: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  detailValue: { fontSize: 12, color: '#ffffff', fontWeight: '700' },
  securityNote: {
    marginTop: 16,
    backgroundColor: 'rgba(15, 118, 110, 0.15)',
    padding: 10,
    borderRadius: 8,
    width: '100%',
  },
  securityText: { fontSize: 11, color: '#2dd4bf', textAlign: 'center', lineHeight: 16 },
});
