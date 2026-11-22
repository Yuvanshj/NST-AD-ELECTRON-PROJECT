import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { mobileApi } from '../../services/api';
import { useMobileAuth } from '../../contexts/AuthContext';
import { Campaign } from '../../types';

export const DonationsScreen: React.FC<{ navigation: any }> = () => {
  const { user } = useMobileAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCamp, setSelectedCamp] = useState<Campaign | null>(null);
  const [amount, setAmount] = useState('2500');
  const [donorPan, setDonorPan] = useState('ABCDE1234F');
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const res = await mobileApi.donations.getCampaigns();
      if (res.campaigns) {
        setCampaigns(res.campaigns);
        if (res.campaigns.length > 0) setSelectedCamp(res.campaigns[0]);
      }
    } catch (e) {
      console.log('Failed to load campaigns:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!selectedCamp || !user?._id) {
      Alert.alert('Sign In', 'Please sign in to make a donation.');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Amount Required', 'Please enter a valid donation amount.');
      return;
    }

    setDonating(true);
    try {
      // Step 1: Create Order
      const orderRes = await mobileApi.donations.createOrder({
        campaignId: selectedCamp._id,
        donorId: user._id,
        amount: numAmount,
        donorPan,
        isAnonymous: false,
      });

      // Step 2: Verify Payment
      const verifyRes = await mobileApi.donations.verifyPayment({
        donationId: orderRes.donation._id,
        razorpayPaymentId: 'pay_mobile_' + Date.now(),
        razorpaySignature: 'sig_valid_mobile_' + Date.now(),
      });

      const issuedReceipt = verifyRes.donation?.taxReceiptNumber || verifyRes.donation?.receiptNumber;
      setReceiptNumber(issuedReceipt);
      Alert.alert(
        'Donation Successful! 🎉',
        `Thank you for contributing ₹${numAmount.toLocaleString()} to ${selectedCamp.title}.\n\nReceipt Number: ${issuedReceipt}`
      );
      loadCampaigns();
    } catch (err: any) {
      Alert.alert('Donation Error', err.message);
    } finally {
      setDonating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Alumni Giving & 80G"
        subtitle="Endowment funds & tax-exempt scholarships"
      />

      {loading ? (
        <ActivityIndicator color="#3b82f6" size="large" style={{ marginTop: 32 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {receiptNumber && (
            <Card style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981' }}>
              <Text style={{ color: '#34d399', fontWeight: '700', fontSize: 14 }}>
                ✓ Official Receipt Issued: {receiptNumber}
              </Text>
              <Text style={{ color: '#cbd5e1', fontSize: 12, marginTop: 4 }}>
                50% Tax Deductible under Section 80G of Indian Income Tax Act.
              </Text>
            </Card>
          )}

          <Text style={styles.heading}>Active Endowment Campaigns</Text>
          {campaigns.map((camp) => {
            const isSelected = selectedCamp?._id === camp._id;
            const percent = Math.min(100, Math.round(((camp.raisedAmount || 0) / (camp.targetAmount || 1)) * 100));

            return (
              <TouchableOpacity
                key={camp._id}
                onPress={() => setSelectedCamp(camp)}
                activeOpacity={0.8}
              >
                <Card style={isSelected ? { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)' } : {}}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={styles.campCategory}>{camp.category}</Text>
                    <Text style={styles.campTax}>Section 80G Eligible</Text>
                  </View>
                  <Text style={styles.campTitle}>{camp.title}</Text>
                  <Text style={styles.campDesc}>{camp.description}</Text>

                  {/* Progress Bar */}
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${percent}%` }]} />
                  </View>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressText}>
                      ₹{(camp.raisedAmount || 0).toLocaleString()} raised
                    </Text>
                    <Text style={styles.progressGoal}>
                      Goal: ₹{(camp.targetAmount || 0).toLocaleString()}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}

          <Card style={{ marginTop: 8 }}>
            <Text style={styles.heading}>Contribute to Selected Endowment</Text>
            <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
              {selectedCamp?.title || 'Select a campaign above'}
            </Text>

            <Text style={styles.label}>Select Contribution Tier (INR)</Text>
            <View style={styles.tierRow}>
              {['1000', '2500', '5000', '10000', '25000'].map((tier) => (
                <TouchableOpacity
                  key={tier}
                  onPress={() => setAmount(tier)}
                  style={[styles.tierBtn, amount === tier && styles.tierBtnActive]}
                >
                  <Text style={[styles.tierText, amount === tier && styles.tierTextActive]}>
                    ₹{Number(tier).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Donor Permanent Account Number (PAN)</Text>
            <TextInput
              style={styles.input}
              placeholder="ABCDE1234F"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
              value={donorPan}
              onChangeText={(t) => setDonorPan(t.toUpperCase())}
            />

            <Button
              title={donating ? 'Processing Contribution...' : `Contribute ₹${Number(amount || 0).toLocaleString()} (80G Deductible)`}
              variant="success"
              onPress={handleDonate}
              loading={donating}
              style={{ marginTop: 8 }}
            />
          </Card>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d' },
  heading: { fontSize: 16, fontWeight: '700', color: '#ffffff', marginBottom: 10 },
  campCategory: { fontSize: 10, fontWeight: '800', color: '#60a5fa', textTransform: 'uppercase' },
  campTax: { fontSize: 10, fontWeight: '700', color: '#34d399' },
  campTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginTop: 2 },
  campDesc: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  progressBar: { height: 6, backgroundColor: '#1e293b', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10b981' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressText: { fontSize: 11, color: '#34d399', fontWeight: '700' },
  progressGoal: { fontSize: 11, color: '#64748b' },
  label: { fontSize: 12, fontWeight: '600', color: '#cbd5e1', marginBottom: 6, marginTop: 8 },
  tierRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tierBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#0d1527',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tierBtnActive: { backgroundColor: '#10b981', borderColor: '#34d399' },
  tierText: { fontSize: 12, color: '#cbd5e1', fontWeight: '600' },
  tierTextActive: { color: '#ffffff' },
  input: {
    backgroundColor: '#0d1527',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 1,
  },
});
