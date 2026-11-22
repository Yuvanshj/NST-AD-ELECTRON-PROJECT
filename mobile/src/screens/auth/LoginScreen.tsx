import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useMobileAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { login, loginWithOtp } = useMobileAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [useOtpMode, setUseOtpMode] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert('Authentication Failed', err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = async (personaRole: string) => {
    let testEmail = 'hardik.patel@alum.ldce.ac.in';
    if (personaRole === 'STUDENT') testEmail = 'meet.joshi@student.ldce.ac.in';
    else if (personaRole === 'COLLEGE_ADMIN') testEmail = 'alumni.admin@ldce.ac.in';
    else if (personaRole === 'STATE_DIRECTOR') testEmail = 'superadmin@gujarat.gov.in';

    setLoading(true);
    try {
      await login(testEmail, 'Password@123');
    } catch (err: any) {
      Alert.alert('Quick Access Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>મ</Text>
          </View>
          <Text style={styles.title}>MahaSetu Login</Text>
          <Text style={styles.subtitle}>Gujarat State Higher Education Alumni Network</Text>
        </View>

        <Card>
          <Text style={styles.label}>Registered Email</Text>
          <TextInput
            style={styles.input}
            placeholder="alumnus@alum.ldce.ac.in"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.passwordHeader}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.linkText}>Forgot?</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: 8 }}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('OtpVerify', { email: email.trim().toLowerCase() })}
            style={styles.otpBtn}
          >
            <Text style={styles.otpBtnText}>Or Sign In with One-Time Password (OTP)</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.linkText, { fontWeight: '700' }]}>Register Now</Text>
          </TouchableOpacity>
        </View>

        {/* Evaluator Quick Access */}
        <View style={styles.evaluatorSection}>
          <Text style={styles.evaluatorTitle}>EVALUATOR QUICK ACCESS (SEEDED CREDENTIALS)</Text>
          <View style={styles.personaRow}>
            <TouchableOpacity
              onPress={() => handleQuickPersona('ALUMNI')}
              style={styles.personaChip}
            >
              <Text style={styles.personaChipText}>Hardik Patel (Alumnus)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleQuickPersona('STUDENT')}
              style={styles.personaChip}
            >
              <Text style={styles.personaChipText}>Meet Joshi (Student)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleQuickPersona('COLLEGE_ADMIN')}
              style={styles.personaChip}
            >
              <Text style={styles.personaChipText}>Prof. Shah (Registrar)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  scroll: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
  linkText: {
    color: '#60a5fa',
    fontSize: 12,
  },
  otpBtn: {
    marginTop: 12,
    padding: 8,
    alignItems: 'center',
  },
  otpBtnText: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  evaluatorSection: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  evaluatorTitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  personaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  personaChip: {
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  personaChipText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
});
