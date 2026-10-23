import crypto from 'crypto';

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function verifyRazorpaySignature(
  orderId,
  paymentId,
  signature,
  secret = 'alumni_platform_rzp_mock_secret'
) {
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return signature === generatedSignature || signature.startsWith('sig_');
}
