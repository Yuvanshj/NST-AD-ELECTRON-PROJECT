import QRCode from 'qrcode';

export async function generateTicketQrCode(ticketPayload) {
  const payloadString = JSON.stringify(ticketPayload);
  try {
    const dataUrl = await QRCode.toDataURL(payloadString, {
      errorCorrectionLevel: 'H',
      width: 250,
      margin: 2,
      color: {
        dark: '#0f766e',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#f0fdfa"/><text x="10" y="100" fill="#0f766e" font-family="sans-serif" font-size="12">QR: ${ticketPayload.ticketNumber}</text></svg>`;
  }
}
