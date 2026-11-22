import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { mobileApi } from '../../services/api';
import { useMobileAuth } from '../../contexts/AuthContext';

export const ChatScreen: React.FC<{ route: any; navigation: any }> = ({ route }) => {
  const { user } = useMobileAuth();
  const peerId = route.params?.peerId;
  const peerName = route.params?.peerName || 'Alumni Colleague';

  const [threads, setThreads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (peerId && user?._id) {
      loadMessages();
    } else if (user?._id) {
      loadThreads();
    }
  }, [peerId, user]);

  const loadThreads = async () => {
    try {
      const res = await mobileApi.chat.getConversations(user!._id);
      if (res.conversations || res.threads) {
        setThreads(res.conversations || res.threads);
      }
    } catch (e) {
      console.log('Error loading threads:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await mobileApi.chat.getMessages(user!._id, peerId);
      if (res.messages) {
        setMessages(res.messages);
      }
    } catch (e) {
      console.log('Error loading messages:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?._id || !peerId) return;
    try {
      await mobileApi.chat.sendMessage({
        senderId: user._id,
        receiverId: peerId,
        content: newMessage.trim(),
      });
      setNewMessage('');
      loadMessages();
    } catch (e) {
      console.log('Error sending message:', e);
    }
  };

  if (!peerId) {
    return (
      <View style={styles.container}>
        <Header title="Direct Messages" subtitle="Conversations with connected alumni" />
        {loading ? (
          <ActivityIndicator color="#3b82f6" size="large" style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            data={threads}
            keyExtractor={(item) => item.peerId}
            renderItem={({ item }) => (
              <Card>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.peerName?.charAt(0) || 'U'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.threadName}>{item.peerName}</Text>
                    <Text style={styles.lastMsg} numberOfLines={1}>
                      {item.lastMessage || 'Start conversation...'}
                    </Text>
                  </View>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Card>
            )}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <EmptyState
                title="No Conversations Yet"
                message="Connect with alumni in the Directory to start direct messaging."
              />
            }
          />
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Header title={peerName} subtitle="Encrypted Direct Message" />
      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const isMe = item.senderId === user?._id;
          return (
            <View style={[styles.msgBubble, isMe ? styles.msgMe : styles.msgPeer]}>
              <Text style={styles.msgText}>{item.content}</Text>
              <Text style={styles.msgTime}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={{ padding: 16 }}
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.msgInput}
          placeholder="Type a message..."
          placeholderTextColor="#64748b"
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity onPress={handleSendMessage} style={styles.sendBtn}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  threadName: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  lastMsg: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unreadText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  msgBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  msgMe: { alignSelf: 'flex-end', backgroundColor: '#2563eb' },
  msgPeer: { alignSelf: 'flex-start', backgroundColor: '#1e293b' },
  msgText: { color: '#ffffff', fontSize: 13 },
  msgTime: { fontSize: 10, color: 'rgba(255, 255, 255, 0.6)', marginTop: 4, alignSelf: 'flex-end' },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#0d1527',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'center',
  },
  msgInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 13,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
