import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { mobileApi } from '../../services/api';
import { useMobileAuth } from '../../contexts/AuthContext';

export const JobDetailsScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { job } = route.params;
  const { user } = useMobileAuth();
  const [pitch, setPitch] = useState('');
  const [resumeUrl, setResumeUrl] = useState('https://drive.google.com/sample-resume.pdf');
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(job.hasApplied || false);

  const handleApply = async () => {
    if (!user?._id) {
      Alert.alert('Sign In Required', 'Please sign in to apply for this role.');
      return;
    }
    setApplying(true);
    try {
      await mobileApi.jobs.apply({
        jobId: job._id,
        applicantId: user._id,
        resumeUrl,
        coverNote: pitch,
        referralRequested: job.canRefer,
      });
      setHasApplied(true);
      Alert.alert('Application Submitted', 'Your application and internal referral request were sent to the alumni poster!');
    } catch (err: any) {
      Alert.alert('Application Failed', err.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={job.title} subtitle={job.company} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card>
          <Text style={styles.company}>{job.company}</Text>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.meta}>📍 {job.location} • {job.employmentType}</Text>
          {job.salaryRange && <Text style={styles.salary}>💰 {job.salaryRange}</Text>}

          {job.canRefer && (
            <View style={styles.referralBox}>
              <Text style={styles.referralTitle}>⭐ Alumni Referral Pledge Active</Text>
              <Text style={styles.referralDesc}>
                {job.referralInstructions || 'The poster has pledged to refer qualified GTU/Gujarat engineering candidates directly through their HR portal.'}
              </Text>
            </View>
          )}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.descText}>{job.description}</Text>

          {job.skillsRequired && job.skillsRequired.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Required Skills</Text>
              <View style={styles.skillsRow}>
                {job.skillsRequired.map((s: string, idx: number) => (
                  <View key={idx} style={styles.skillChip}>
                    <Text style={styles.skillText}>{s}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Submit Application</Text>
          {hasApplied ? (
            <View style={styles.appliedBox}>
              <Text style={styles.appliedText}>✓ You have already applied for this opening.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Resume / Portfolio Link</Text>
              <TextInput
                style={styles.input}
                value={resumeUrl}
                onChangeText={setResumeUrl}
                placeholder="https://drive.google.com/your-resume.pdf"
                placeholderTextColor="#64748b"
              />

              <Text style={styles.label}>Candidate Pitch / Cover Note</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                multiline
                value={pitch}
                onChangeText={setPitch}
                placeholder="Mention your relevant projects, GPA, or why you'd be a great referral..."
                placeholderTextColor="#64748b"
              />

              <Button
                title={job.canRefer ? "Apply & Request Alumni Referral" : "Apply for Opening"}
                onPress={handleApply}
                loading={applying}
                variant="success"
              />
            </>
          )}
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d' },
  company: { fontSize: 13, color: '#60a5fa', fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: '#ffffff', marginTop: 2 },
  meta: { fontSize: 13, color: '#94a3b8', marginTop: 6 },
  salary: { fontSize: 14, color: '#34d399', fontWeight: '700', marginTop: 4 },
  referralBox: {
    marginTop: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 8,
    padding: 12,
  },
  referralTitle: { fontSize: 13, fontWeight: '700', color: '#fbbf24', marginBottom: 4 },
  referralDesc: { fontSize: 12, color: '#cbd5e1', lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 8 },
  descText: { fontSize: 13, color: '#cbd5e1', lineHeight: 20 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  skillText: { fontSize: 12, color: '#60a5fa' },
  label: { fontSize: 12, fontWeight: '600', color: '#cbd5e1', marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: '#0d1527',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#ffffff',
    marginBottom: 8,
  },
  appliedBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  appliedText: { color: '#34d399', fontWeight: '700', fontSize: 14 },
});
