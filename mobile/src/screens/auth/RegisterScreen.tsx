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

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { register, colleges } = useMobileAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ALUMNI' | 'STUDENT'>('ALUMNI');
  const [collegeId, setCollegeId] = useState(colleges[0]?._id || '');
  const [batch, setBatch] = useState('2020');
  const [branch, setBranch] = useState('Computer Engineering');
  const [enrollment, setEnrollment] = useState('');
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Required', 'Full name, email and password are required.');
      return;
    }
    setLoading(true);
    try {
      await register({
        fullName,
        email: email.trim().toLowerCase(),
        phone,
        password,
        role,
        collegeId: collegeId || colleges[0]?._id,
        batch: Number(batch),
        branch,
        enrollmentNumber: enrollment,
        currentCompany: company,
        designation,
      });
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
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
          <Text style={styles.title}>Alumni Registration</Text>
          <Text style={styles.subtitle}>Join the Gujarat State Technical Education Network</Text>
        </View>

        <Card>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Bhavesh Joshi"
            placeholderTextColor="#64748b"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="bhavesh.joshi@alum.ldce.ac.in"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 9876543210"
            placeholderTextColor="#64748b"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Portal Role</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              onPress={() => setRole('ALUMNI')}
              style={[styles.roleBtn, role === 'ALUMNI' && styles.roleBtnActive]}
            >
              <Text style={[styles.roleText, role === 'ALUMNI' && styles.roleTextActive]}>Alumni</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRole('STUDENT')}
              style={[styles.roleBtn, role === 'STUDENT' && styles.roleBtnActive]}
            >
              <Text style={[styles.roleText, role === 'STUDENT' && styles.roleTextActive]}>Student</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Graduation Year</Text>
          <TextInput
            style={styles.input}
            placeholder="2020"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            value={batch}
            onChangeText={setBatch}
          />

          <Text style={styles.label}>Branch / Engineering Department</Text>
          <TextInput
            style={styles.input}
            placeholder="Computer Engineering"
            placeholderTextColor="#64748b"
            value={branch}
            onChangeText={setBranch}
          />

          {role === 'ALUMNI' && (
            <>
              <Text style={styles.label}>GTU Enrollment No. (For Verification Queue)</Text>
              <TextInput
                style={styles.input}
                placeholder="160280107042"
                placeholderTextColor="#64748b"
                value={enrollment}
                onChangeText={setEnrollment}
              />

              <Text style={styles.label}>Current Company</Text>
              <TextInput
                style={styles.input}
                placeholder="TCS Digital Gujarat"
                placeholderTextColor="#64748b"
                value={company}
                onChangeText={setCompany}
              />

              <Text style={styles.label}>Designation</Text>
              <TextInput
                style={styles.input}
                placeholder="Software Engineer"
                placeholderTextColor="#64748b"
                value={designation}
                onChangeText={setDesignation}
              />
            </>
          )}

          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button
            title="Create Verified Account"
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: 8 }}
          />
        </Card>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#60a5fa', fontSize: 13 }}>Already registered? Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d' },
  scroll: { padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#94a3b8' },
  label: { fontSize: 13, fontWeight: '600', color: '#cbd5e1', marginBottom: 6 },
  input: {
    backgroundColor: '#0d1527',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 12,
  },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#0d1527',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    alignItems: 'center',
  },
  roleBtnActive: { backgroundColor: '#2563eb', borderColor: '#3b82f6' },
  roleText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },
  roleTextActive: { color: '#ffffff' },
});
