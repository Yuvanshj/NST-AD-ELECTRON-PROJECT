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
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { mobileApi } from '../../services/api';

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (!email) {
      Alert.alert('Required', 'Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      const res = await mobileApi.auth.forgotPassword(email.trim().toLowerCase());
      setStep(2);
      Alert.alert('Code Dispatched', res.message);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      Alert.alert('Required', 'Please enter code and new password.');
      return;
    }
    setLoading(true);
    try {
      const res = await mobileApi.auth.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });
      Alert.alert('Success', res.message, [
        { text: 'Log In', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
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
          <Text style={styles.title}>Account Recovery</Text>
          <Text style={styles.subtitle}>Reset your MahaSetu account password</Text>
        </View>

        <Card>
          {step === 1 ? (
            <>
              <Text style={styles.label}>Registered Email</Text>
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
                title="Send Recovery Code"
                onPress={handleRequestOtp}
                loading={loading}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>6-Digit Recovery Code</Text>
              <TextInput
                style={styles.input}
                placeholder="123456"
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
              <Text style={styles.label}>New Password (Min. 6 chars)</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <Button
                title="Set New Password"
                onPress={handleResetPassword}
                loading={loading}
                variant="success"
              />
            </>
          )}
        </Card>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 24, alignItems: 'center' }}>
          <Text style={{ color: '#60a5fa', fontSize: 13 }}>Back to Sign In</Text>
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
});
