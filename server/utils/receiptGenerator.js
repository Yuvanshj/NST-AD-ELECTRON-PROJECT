export function generateReceiptHtml(data) {
  const words = convertNumberToWords(data.amount);
  const isTaxExempt = !!data.isTaxExempt;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${data.receiptNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #1e293b; background: #fff; }
    .receipt-container { border: 2px solid ${isTaxExempt ? '#0f766e' : '#2563eb'}; border-radius: 8px; padding: 30px; max-width: 700px; margin: auto; }
    .header { text-align: center; border-bottom: 2px dashed ${isTaxExempt ? '#0f766e' : '#2563eb'}; padding-bottom: 20px; }
    .header h1 { margin: 0; color: ${isTaxExempt ? '#0f766e' : '#1e3a8a'}; font-size: 24px; }
    .header p { margin: 4px 0; color: #64748b; font-size: 13px; }
    .tax-banner { background: ${isTaxExempt ? '#f0fdfa' : '#eff6ff'}; border: 1px solid ${isTaxExempt ? '#99f6e4' : '#bfdbfe'}; color: ${isTaxExempt ? '#0f766e' : '#1d4ed8'}; padding: 10px; text-align: center; font-weight: bold; margin: 20px 0; border-radius: 4px; font-size: 13px; }
    .grid { display: flex; justify-content: space-between; margin: 15px 0; font-size: 14px; }
    .field-title { color: #64748b; font-size: 12px; text-transform: uppercase; }
    .field-value { font-weight: 600; margin-top: 2px; }
    .amount-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 20px 0; }
    .amount-large { font-size: 26px; font-weight: bold; color: ${isTaxExempt ? '#047857' : '#1d4ed8'}; }
    .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #64748b; display: flex; justify-content: space-between; align-items: flex-end; }
    .stamp { border: 2px solid ${isTaxExempt ? '#047857' : '#1d4ed8'}; color: ${isTaxExempt ? '#047857' : '#1d4ed8'}; padding: 8px 12px; border-radius: 4px; display: inline-block; font-weight: bold; text-transform: uppercase; font-size: 11px; transform: rotate(-3deg); }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <h1>${data.collegeName || 'Gujarat Technical Education'} Alumni Foundation</h1>
      <p>Department of Higher Education & GTU Gujarat Alumni Network</p>
      ${isTaxExempt && data.taxExemptionNumber ? `<p>80G Reg. No: ${data.taxExemptionNumber} | Eligible u/s 80G</p>` : `<p>Official Contribution Acknowledgement</p>`}
    </div>

    <div class="tax-banner">
      ${isTaxExempt
        ? 'SECTION 80G TAX EXEMPTION CERTIFICATE (ELIGIBLE FOR 50% TAX DEDUCTION U/S 80G)'
        : 'MAHASETU DONATION ACKNOWLEDGEMENT (GENERAL INSTITUTIONAL CONTRIBUTION)'}
    </div>

    <div class="grid">
      <div>
        <div class="field-title">Receipt Number</div>
        <div class="field-value">${data.receiptNumber}</div>
      </div>
      <div>
        <div class="field-title">Date</div>
        <div class="field-value">${new Date(data.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="field-title">Donor Name</div>
        <div class="field-value">${data.donorName}</div>
      </div>
      <div>
        <div class="field-title">Donor PAN</div>
        <div class="field-value">${data.donorPan || 'NOT PROVIDED'}</div>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="field-title">Purpose / Campaign</div>
        <div class="field-value">${data.campaignTitle || 'General College Development Fund'}</div>
      </div>
      <div>
        <div class="field-title">Payment Reference ID</div>
        <div class="field-value">${data.paymentReference || data.paymentId || 'N/A'}</div>
      </div>
    </div>

    <div class="amount-box">
      <div class="field-title">Total Amount Received</div>
      <div class="amount-large">₹ ${Number(data.amount).toLocaleString('en-IN')}</div>
      <div style="font-size: 13px; color: #475569; margin-top: 5px;">In Words: <em>Rupees ${words} Only</em></div>
    </div>

    <div class="footer">
      <div>
        <p>This is a computer-generated receipt requiring no physical signature.</p>
        <p>Gujarat Education Department Alumni Endowment Initiative</p>
        ${!isTaxExempt ? '<p style="color: #94a3b8; font-size: 11px;">*Note: This acknowledgement is issued for institutional records and does not claim Section 80G tax deductibility.</p>' : ''}
      </div>
      <div class="stamp">
        ${isTaxExempt ? 'VERIFIED 80G COMPLIANT' : 'OFFICIAL RECEIPT VERIFIED'}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export function generate80GReceiptHtml(data) {
  return generateReceiptHtml({ ...data, isTaxExempt: true });
}

function convertNumberToWords(amount) {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (!amount || amount === 0) return 'Zero';

  function numToWords(n) {
    if (n < 20) return units[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
    if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + numToWords(n % 10000000) : '');
  }

  return numToWords(amount);
}
