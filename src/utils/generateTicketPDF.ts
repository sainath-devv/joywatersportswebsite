import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { formatTime } from './constants';

// Cache company logo as base64 for fast PDF embedding
let cachedLogoBase64: string | null = null;

async function fetchLogoBase64(): Promise<string | null> {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const res = await fetch('https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx');
    if (res.ok) {
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          cachedLogoBase64 = reader.result as string;
          resolve(cachedLogoBase64);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch (e) {
    console.error('Failed to fetch logo for PDF:', e);
  }
  return null;
}

/**
 * Robustly parses and formats activities list from any booking object format
 */
export function formatActivitiesList(booking: any): string {
  if (!booking) return 'Water Sports Activity';
  let acts = booking.activities || booking.activity || booking.selectedActivities;
  if (!acts) return 'Water Sports Activity';

  if (typeof acts === 'string') {
    try {
      const parsed = JSON.parse(acts);
      acts = parsed;
    } catch {
      return acts;
    }
  }

  if (Array.isArray(acts)) {
    if (acts.length === 0) return 'Water Sports Activity';
    return acts.map((item: any) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        const name = item.name || item.title || item.activityName || item.activity || item.label || 'Activity';
        const qty = item.count || item.countPerPerson || item.quantity || item.qty || item.guests || item.guestsCount;
        if (qty && Number(qty) > 1) {
          return `${name} x${qty}`;
        } else if (qty && Number(qty) === 1) {
          return `${name} x1`;
        }
        return name;
      }
      return String(item);
    }).filter(Boolean).join(', ');
  }

  if (typeof acts === 'object' && acts !== null) {
    const entries = Object.entries(acts);
    if (entries.length > 0) {
      return entries.map(([k, v]) => `${k} x${v}`).join(', ');
    }
  }

  return String(acts);
}

/**
 * Generates a premium, minimalist boarding-pass style PDF Ticket Pass.
 */
export async function generateTicketPDFDoc(booking: any): Promise<jsPDF> {
  const isJMB = Boolean(booking?.id?.startsWith('JMB'));
  const hasNotes = isJMB && Boolean(booking?.notes);
  const actText = formatActivitiesList(booking);

  // Generate QR Code Data URL with dark ocean blue color (#004E98)
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(String(booking?.id || 'JWS-PASS'), {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: { dark: '#004E98', light: '#FFFFFF' }
    });
  } catch (e) {
    console.error('QR code generation failed for PDF:', e);
  }

  const totalAmt = Number(booking?.totalAmount) || 0;
  const advPaid = Number(booking?.advancePaid) || 0;
  const balPaid = Number(booking?.balancePaid) || 0;
  const remDue = booking?.remainingDue !== undefined 
    ? Number(booking.remainingDue) 
    : Math.max(0, totalAmt - advPaid - balPaid);
  const isFullyPaid = booking?.paymentStatus === 'Completed' || remDue === 0;
  const customerName = `${booking?.firstName || ''} ${booking?.lastName || ''}`.trim() || 'Valued Guest';
  const customerPhone = booking?.phone || '';

  // Approximate height calculations
  const approxActLines = Math.max(1, Math.ceil(actText.length / 24));
  let baseHeight = 158 + (approxActLines - 1) * 4;
  if (isJMB) baseHeight += hasNotes ? 18 : 10;

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: [100, baseHeight]
  });

  // 1. Background Fill: Light Gray Canvas (#F1F5F9)
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 0, 100, baseHeight, 'F');

  // 2. Main Ticket Card Container: Pure White with rounded corners
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.4);
  doc.roundedRect(4, 4, 92, baseHeight - 8, 5, 5, 'FD');

  // 3. Top Brand Bar: Deep Navy (#091F44)
  doc.setFillColor(9, 31, 68);
  doc.roundedRect(4, 4, 92, 22, 5, 5, 'F');
  // Fill lower corners of header bar so it seamlessly connects to white card
  doc.rect(4, 18, 92, 8, 'F');

  // Brand Logo & Title
  const logoData = await fetchLogoBase64();
  if (logoData) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(8, 7, 12, 12, 2, 2, 'F');
      doc.addImage(logoData, 'PNG', 9, 8, 10, 10);
    } catch (e) {
      console.error('Failed to embed logo into PDF:', e);
    }
  }

  const titleX = logoData ? 23 : 8;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('JOY WATER SPORTS', titleX, 13.5);

  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(56, 189, 248); // Sky Blue (#38BDF8)
  doc.text('VARKALA BEACH • ADVENTURE PASS', titleX, 18);

  // 4. Header Details Row (ID, Status Pill, Name)
  // Booking ID (Accent Ocean Blue)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 78, 152); // Ocean Blue #004E98
  doc.text(`#${booking?.id || 'N/A'}`, 8, 32);

  // Payment Status Pill (Top Right)
  if (isFullyPaid) {
    // Soft Green Pill
    doc.setFillColor(236, 253, 245); // Emerald 50
    doc.setDrawColor(167, 243, 208); // Emerald 200
    doc.setLineWidth(0.3);
    doc.roundedRect(63, 27.5, 29, 6.5, 3.25, 3.25, 'FD');

    doc.setTextColor(4, 120, 87); // Emerald 700
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ PAID IN FULL', 77.5, 31.8, { align: 'center' });
  } else {
    // Soft Amber Pill
    doc.setFillColor(254, 243, 199); // Amber 100
    doc.setDrawColor(253, 230, 138); // Amber 200
    doc.setLineWidth(0.3);
    doc.roundedRect(61, 27.5, 31, 6.5, 3.25, 3.25, 'FD');

    doc.setTextColor(180, 83, 9); // Amber 700
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`DUE ₹${remDue}`, 76.5, 31.8, { align: 'center' });
  }

  // Guest Name (Largest, bold text on page - Hero element)
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const truncatedName = customerName.length > 22 ? customerName.substring(0, 20) + '...' : customerName;
  doc.text(truncatedName, 8, 41);

  // Phone
  if (customerPhone) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(customerPhone, 8, 46);
  }

  // 5. First Dashed Perforation Line (Ticket-stub feel)
  const stubY1 = 51;
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.35);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(8, stubY1, 92, stubY1);
  doc.setLineDashPattern([], 0); // Reset dash

  // Half-circle side notch cutouts for boarding pass aesthetic
  doc.setFillColor(241, 245, 249); // canvas gray
  doc.circle(4, stubY1, 2.5, 'F');
  doc.circle(96, stubY1, 2.5, 'F');

  // 6. Mid Section: QR Code (Left) + Activities & Details (Right)
  // QR Code Frame
  const qrY = 56;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.roundedRect(8, qrY, 32, 32, 3, 3, 'FD');

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', 10, qrY + 2, 28, 28);
  }

  // Details Column (Right of QR)
  let detailY = qrY + 3;
  const detailX = 44;

  // 1. ACTIVITIES / PACKAGE & PRICE
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('BOOKED ACTIVITY & PRICE', detailX, detailY);

  detailY += 3.5;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 78, 152); // Ocean Blue #004E98
  const actTextWithPrice = totalAmt > 0 ? `${actText} (₹${totalAmt.toLocaleString('en-IN')})` : actText;
  const actLines = doc.splitTextToSize(actTextWithPrice, 48);
  actLines.forEach((line: string, idx: number) => {
    doc.text(line, detailX, detailY + (idx * 3.5));
  });
  detailY += (actLines.length * 3.5) + 2;

  // 2. GUESTS & DATE
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('GUESTS', detailX, detailY);
  doc.text('DATE', detailX + 22, detailY);

  detailY += 3.5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const guestsNum = booking?.guests || booking?.numberOfPeople || 1;
  doc.text(`${guestsNum} Person(s)`, detailX, detailY);

  const rawDate = booking?.date || booking?.bookingDate || 'Date on Arrival';
  const displayDate = String(rawDate).includes('T') ? String(rawDate).split('T')[0] : String(rawDate);
  doc.text(displayDate, detailX + 22, detailY);

  // 3. TIME SLOT
  detailY += 4.5;
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TIME SLOT', detailX, detailY);

  detailY += 3.5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const rawTime = booking?.time || booking?.bookingTime || 'Flexible Slot';
  const displayTime = formatTime(String(rawTime));
  doc.text(displayTime, detailX, detailY);
  detailY += 4;

  // 7. Second Dashed Perforation Line (Dynamic Y)
  const stubY2 = Math.max(93, detailY + 4);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(8, stubY2, 92, stubY2);
  doc.setLineDashPattern([], 0);

  // Side notch cutouts
  doc.setFillColor(241, 245, 249);
  doc.circle(4, stubY2, 2.5, 'F');
  doc.circle(96, stubY2, 2.5, 'F');

  // 8. Financial Breakdown Section
  let finY = stubY2 + 5;

  const renderFinRow = (label: string, amount: string, color = '#0F172A', isBold = false) => {
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(label, 8, finY);

    doc.setFont('courier', isBold ? 'bold' : 'bold');
    doc.setFontSize(7.5);
    const [r, g, b] = hexToRgb(color);
    doc.setTextColor(r, g, b);
    doc.text(amount, 92, finY, { align: 'right' });

    finY += 4.8;
  };

  const advMode = booking?.advancePaymentMode ? ` (${booking.advancePaymentMode})` : '';
  const balMode = booking?.balancePaymentMode ? ` (${booking.balancePaymentMode})` : '';

  renderFinRow('Total Bill', `₹${totalAmt}`);
  renderFinRow(`Advance Paid${advMode}`, `₹${advPaid}`, '#004E98');
  if (balPaid > 0) {
    renderFinRow(`Balance Paid${balMode}`, `₹${balPaid}`, '#059669');
  }

  // Thin separator
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.2);
  doc.line(8, finY - 1.5, 92, finY - 1.5);

  if (remDue > 0) {
    renderFinRow('Balance Due', `₹${remDue}`, '#D97706', true);
  } else {
    renderFinRow('Payment Status', '✓ Fully Paid', '#059669', true);
  }

  // 9. Manual Agent Desk Details (if JMB ID)
  if (isJMB) {
    finY += 1;
    const jmbHeight = hasNotes ? 14 : 8;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(8, finY, 84, jmbHeight, 2.5, 2.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    doc.text('MANUAL AGENT DESK', 11, finY + 3.5);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Agent: ${booking?.agentName || 'Counter Desk'}`, 89, finY + 3.5, { align: 'right' });

    if (hasNotes) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(5.5);
      doc.setTextColor(71, 85, 105);
      const noteStr = String(booking.notes).length > 45 ? String(booking.notes).substring(0, 42) + '...' : String(booking.notes);
      doc.text(`Note: ${noteStr}`, 11, finY + 9);
    }

    finY += jmbHeight + 2;
  }

  // 10. Footer Instructions
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('Show this QR at the check-in desk', 50, baseHeight - 6, { align: 'center' });

  return doc;
}

// Helper to convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export async function downloadTicketPDF(booking: any) {
  const doc = await generateTicketPDFDoc(booking);
  doc.save(`JoyWaterSports-Ticket-${booking?.id || 'pass'}.pdf`);
}

export async function getTicketPDFBlob(booking: any): Promise<Blob> {
  const doc = await generateTicketPDFDoc(booking);
  return doc.output('blob');
}

