import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { mobileApi } from '../../services/api';
import { useMobileAuth } from '../../contexts/AuthContext';

export const NotificationsScreen: React.FC = () => {
  const { user } = useMobileAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await mobileApi.notifications.getAll(user!._id);
      if (res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (e) {
      console.log('Error loading notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await mobileApi.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      <Header title="Notifications" subtitle="Alerts, updates and verification notices" />
      {loading ? (
        <ActivityIndicator color="#3b82f6" size="large" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => markAsRead(item._id)} activeOpacity={0.8}>
              <Card style={item.isRead ? { opacity: 0.6 } : { borderColor: '#3b82f6' }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>
                  {new Date(item.createdAt).toLocaleDateString([], {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </Card>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <EmptyState
              title="No Notifications"
              message="You have no unread notifications at this time."
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d' },
  title: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  message: { fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: 18 },
  time: { fontSize: 10, color: '#64748b', marginTop: 6 },
});
