import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useMobileAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { mobileApi } from '../../services/api';

export const OtpVerifyScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { loginWithOtp } = useMobileAuth();
  const initialEmail = route.params?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert('Required', 'Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      const res = await mobileApi.auth.sendOtp(email.trim().toLowerCase());
      setIsOtpSent(true);
      Alert.alert('Code Dispatched', res.message || 'OTP sent to your email.');
    } catch (err: any) {
      Alert.alert('Failed to send OTP', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Required', 'Please enter the 6-digit OTP code.');
      return;
    }
    setLoading(true);
    try {
      await loginWithOtp(email.trim().toLowerCase(), otp.trim());
    } catch (err: any) {
      Alert.alert('Invalid Code', err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Secure OTP Sign In</Text>
          <Text style={styles.subtitle}>Passwordless login for registered alumni and students</Text>
        </View>

        <Card>
          {!isOtpSent ? (
            <>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="hardik.patel@alum.ldce.ac.in"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <Button
                title="Send Verification Code"
                onPress={handleSendOtp}
                loading={loading}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Enter 6-Digit OTP</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="123456"
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
              <Button
                title="Verify and Sign In"
                onPress={handleVerifyOtp}
                loading={loading}
                variant="success"
              />
              <TouchableOpacity onPress={() => setIsOtpSent(false)} style={styles.resendBtn}>
                <Text style={styles.resendText}>Change Email or Resend</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 24, alignItems: 'center' }}>
          <Text style={{ color: '#60a5fa', fontSize: 13 }}>Back to Password Sign In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d' },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  header: { marginBottom: 24, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#94a3b8', textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#cbd5e1', marginBottom: 6 },
  input: {
    backgroundColor: '#0d1527',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 14,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: '700',
  },
  resendBtn: { marginTop: 12, alignItems: 'center', padding: 8 },
  resendText: { color: '#94a3b8', fontSize: 12 },
});
