import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Check, ArrowLeft, Download, Printer, Shield, Calendar, Clock, Users, ArrowRight, FileText } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatTime } from '../utils/constants';
import Footer from '../components/common/Footer';
import MinimalistLoader from '../components/common/MinimalistLoader';
import { downloadTicketPDF, getTicketPDFBlob, formatActivitiesList } from '../utils/generateTicketPDF';
import { formatSafeErrorMessage } from '../lib/errorHandler';
import SEOHead, { createBreadcrumbSchema, joyWaterSportsBusinessSchema } from '../components/common/SEOHead';

export default function TicketPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    async function fetchTicket() {
      try {
        setLoading(true);
        const isJMB = id?.startsWith('JMB');
        const url = isJMB ? `/api/manual-bookings/ticket/${id}` : `/api/ticket/${id}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error('Ticket not found or invalid ID');
        }
        const data = await res.json();

        // Check if waiver declaration exists for this booking ID
        try {
          const waiverRes = await fetch(`/api/waivers/${id}`);
          if (waiverRes.ok) {
            const waiverData = await waiverRes.json();
            if (waiverData && !waiverData.error) {
              data.declarationAgreed = true;
              data.ticketStatus = 'CONFIRMED';
              data.waiverDetails = waiverData;
            }
          }
        } catch (e) {
          console.error("Waiver check error:", e);
        }

        setBooking(data);
      } catch (err: any) {
        setError(formatSafeErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchTicket();
  }, [id]);

  useEffect(() => {
    if (booking) {
      document.title = `Voucher #${booking.id} - ${booking.firstName} | Joy Water Sports Varkala`;
    } else {
      document.title = `Loading Active Ticket Voucher | Joy Water Sports Varkala`;
    }
  }, [booking]);

  if (loading) {
    return <MinimalistLoader message="Retrieving Ticket" />;
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-foam-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </div>
        <h1 className="text-2xl font-serif text-deep-blue mb-2 font-bold">Ticket Not Found</h1>
        <p className="text-gray-500 max-w-sm mb-6 text-sm">We couldn't locate any ticket with the ID <span className="font-mono font-bold text-deep-blue">{id}</span>. Please verify your link.</p>
        <button type="button" onClick={() => navigate("/")} className="bg-ocean-blue text-white px-6 py-2.5 rounded-xl font-bold transition hover:bg-sky-blue">
          Return Home
        </button>
      </div>
    );
  }

  const totalAmt = Number(booking.totalAmount) || 0;
  const advPaid = Number(booking.advancePaid) || 0;
  const balPaid = Number(booking.balancePaid) || 0;
  const remDue = booking.remainingDue !== undefined 
    ? Number(booking.remainingDue) 
    : Math.max(0, totalAmt - advPaid - balPaid);
  const isFullyPaid = booking.paymentStatus === 'Completed' || remDue === 0;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <SEOHead
        title={`Voucher #${booking?.id || id} | Joy Water Sports Varkala`}
        description={`Digital booking voucher #${booking?.id || id} for ${booking?.firstName || 'Guest'} at Joy Water Sports Varkala, Papanasam Beach.`}
        canonicalUrl={`https://joywatersports.com/ticket/${id}`}
        schema={[
          joyWaterSportsBusinessSchema,
          createBreadcrumbSchema([
            { name: 'Home', url: 'https://joywatersports.com' },
            { name: `Booking Voucher #${booking?.id || id}`, url: `https://joywatersports.com/ticket/${id}` }
          ])
        ]}
      />
      {/* Navbar with back navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 pt-4 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="rounded-full px-6 py-3.5 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xs flex items-center justify-between">
          <button type="button" onClick={() => navigate("/")} className="text-sm font-bold text-slate-800 flex items-center gap-1.5 hover:text-[#004E98] transition-colors cursor-pointer">
            <ArrowLeft size={16} /> Home
          </button>
          <span className="text-base font-black tracking-widest text-slate-900 uppercase">Joy Water Sports</span>
          <Link to="/login" className="text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors">My Account</Link>
        </div>
      </nav>

      {/* Main Container */}
      <main className="pt-24 pb-16 px-4 max-w-lg mx-auto flex flex-col items-center">
        {/* The Boarding Pass Ticket Layout */}
        <div className="w-full bg-white rounded-[24px] shadow-xl overflow-hidden border border-slate-200/80 flex flex-col relative">
          {/* Top Brand Bar: Solid Deep Navy (#091F44) */}
          <div className="bg-[#091F44] px-6 py-4 text-white flex items-center justify-between border-b border-sky-400/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                <img 
                  src="https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx" 
                  alt="Joy Water Sports Logo" 
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-contain" 
                />
              </div>
              <div>
                <h2 className="text-base font-black tracking-wider text-white uppercase leading-none">JOY WATER SPORTS</h2>
                <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider mt-1">Varkala Beach</p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-[10px] text-slate-300 uppercase font-semibold block tracking-wider">BOARDING PASS</span>
              <span className="text-xs font-mono font-bold text-sky-300">#{booking.id}</span>
            </div>
          </div>

          {/* Ticket Body Content */}
          <div className="p-6 sm:p-7 flex flex-col">
            {/* Identity Header Row: Booking ID + Status Pill + Hero Guest Name */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold font-mono text-[#004E98] tracking-wide block">
                  #{booking.id}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5 leading-snug">
                  {booking.firstName} {booking.lastName || ''}
                </h1>
                {booking.phone && (
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{booking.phone}</p>
                )}
              </div>

              {/* Payment Status Pill */}
              <div>
                {isFullyPaid ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    PAID IN FULL
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200/80 px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    BALANCE DUE ₹{remDue}
                  </span>
                )}
              </div>
            </div>

            {/* Declaration Authentication Status Banner */}
            <div className="mt-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200/90 rounded-2xl flex items-center justify-between gap-3 text-emerald-950 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Shield size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <span>✓ ONLINE BOOKING CONFIRMED</span>
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-700">
                      Verified Booking Ticket Pass • Joy Water Sports
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-600 text-white font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                  VERIFIED
                </span>
              </div>
            </div>

            {/* Dashed Perforation Line #1 */}
            <div className="relative my-6">
              <div className="border-t border-dashed border-slate-300 w-full"></div>
              <div className="absolute -left-9 -top-2.5 w-5 h-5 rounded-full bg-slate-100 border-r border-slate-200/80"></div>
              <div className="absolute -right-9 -top-2.5 w-5 h-5 rounded-full bg-slate-100 border-l border-slate-200/80"></div>
            </div>

            {/* Mid Section: QR Code + Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              {/* QR Code */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                <QRCodeSVG value={booking.id} size={135} level="H" includeMargin={false} />
              </div>

              {/* Details Grid */}
              <div className="sm:col-span-7 space-y-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                    ACTIVITIES
                  </span>
                  <p className="text-sm font-bold text-slate-900 leading-snug">
                    {formatActivitiesList(booking)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                      GUESTS
                    </span>
                    <p className="text-xs font-bold text-slate-800">
                      {booking.guests || 1} Person(s)
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                      DATE & TIME
                    </span>
                    <p className="text-xs font-bold text-slate-800">
                      {booking.date} @ {formatTime(booking.time)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashed Perforation Line #2 */}
            <div className="relative my-6">
              <div className="border-t border-dashed border-slate-300 w-full"></div>
              <div className="absolute -left-9 -top-2.5 w-5 h-5 rounded-full bg-slate-100 border-r border-slate-200/80"></div>
              <div className="absolute -right-9 -top-2.5 w-5 h-5 rounded-full bg-slate-100 border-l border-slate-200/80"></div>
            </div>

            {/* Financial Breakdown Section */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Total Bill</span>
                <span className="font-mono font-bold text-slate-900">₹{totalAmt}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Advance Paid {booking.advancePaymentMode ? `(${booking.advancePaymentMode})` : ''}</span>
                <span className="font-mono font-bold text-[#004E98]">₹{advPaid}</span>
              </div>
              {balPaid > 0 && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Balance Paid {booking.balancePaymentMode ? `(${booking.balancePaymentMode})` : ''}</span>
                  <span className="font-mono font-bold text-emerald-700">₹{balPaid}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200/70 flex justify-between items-center font-bold">
                {remDue > 0 ? (
                  <>
                    <span className="text-amber-900">Balance Due</span>
                    <span className="font-mono text-amber-700 text-sm">₹{remDue}</span>
                  </>
                ) : (
                  <>
                    <span className="text-emerald-900">Payment Status</span>
                    <span className="text-emerald-700 text-xs font-extrabold bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                      ✓ Fully Paid
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Manual Agent Details (if JMB ID) */}
            {booking.id?.startsWith('JMB') && (
              <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-3 mt-3 text-xs text-purple-950 space-y-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700">Manual Agent Desk</p>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Desk Agent</span>
                  <span className="font-bold">{booking.agentName || 'Counter Desk'}</span>
                </div>
                {booking.notes && (
                  <p className="text-[11px] italic bg-white p-2 rounded-xl border border-purple-100 text-purple-900 mt-1">
                    Note: {booking.notes}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Calm Footer Instruction */}
          <div className="bg-slate-50 border-t border-slate-100 py-3 px-4 text-center text-xs font-semibold text-slate-400">
            Show this QR at the check-in desk
          </div>
        </div>

        {/* Action Buttons: WhatsApp Share PDF, Download PDF & Print */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
          <button
            type="button"
            disabled={isGeneratingPDF}
            onClick={async () => {
              try {
                setIsGeneratingPDF(true);
                const pdfBlob = await getTicketPDFBlob(booking);
                const pdfFile = new File([pdfBlob], `Ticket-${booking.id}.pdf`, { type: 'application/pdf' });

                const actList = formatActivitiesList(booking);
                const passUrl = window.location.href;

                const waMsg = `🌊 *JOY WATER SPORTS VARKALA*\n_Premium Beach Adventure Pass (PDF Attached)_\n\n━━━━━━━━━━━━━━━━━━━━━━━\n🎟️ *TICKET VOUCHER*\n• *Ticket ID:* \`#${booking.id}\`\n• *Guest Name:* ${booking.firstName} ${booking.lastName || ''}\n• *Schedule:* ${booking.date} @ ${formatTime(booking.time)}\n• *Party Size:* ${booking.guests || 1} Person(s)\n• *Activities:* ${actList}\n\n💳 *PAYMENT SUMMARY*\n• *Total Bill:* ₹${totalAmt}\n• *Advance Paid:* ₹${advPaid}\n• *Balance Paid:* ₹${balPaid}\n• *Remaining Due:* ₹${remDue}\n• *Payment Status:* ${isFullyPaid ? '✅ FULLY PAID' : '⏳ PARTIAL PAID'}\n\n━━━━━━━━━━━━━━━━━━━━━━━\n📍 *Location:* Main Beach / North Cliff, Varkala\n📱 *Digital Pass Link:* ${passUrl}\n\n_Please show this digital pass or PDF voucher at the beach entry counter._`;

                let phone = booking.phone ? booking.phone.replace(/[^0-9]/g, '') : '';
                if (phone.length === 10) phone = `91${phone}`;

                if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                  await navigator.share({
                    title: `Ticket #${booking.id} - ${booking.firstName}`,
                    text: waMsg,
                    files: [pdfFile]
                  });
                } else {
                  // Fallback: trigger PDF download and open WhatsApp
                  downloadTicketPDF(booking);
                  const waUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}` : `https://wa.me/?text=${encodeURIComponent(waMsg)}`;
                  window.open(waUrl, '_blank');
                }
              } catch (e) {
                console.error('PDF Share Error:', e);
                downloadTicketPDF(booking);
              } finally {
                setIsGeneratingPDF(false);
              }
            }}
            className="flex-1 bg-[#25D366] hover:bg-[#1ebd5c] text-white py-3 rounded-full font-bold text-xs shadow-sm hover:shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> {isGeneratingPDF ? 'Preparing PDF...' : 'Share PDF WhatsApp'}
          </button>

          <button
            type="button"
            onClick={() => downloadTicketPDF(booking)}
            className="flex-1 bg-[#004E98] hover:bg-[#003B73] text-white py-3 rounded-full font-bold text-xs shadow-sm hover:shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <FileText size={16} /> Download PDF
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 py-3 rounded-full font-bold text-xs shadow-2xs hover:shadow-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Printer size={16} /> Print Voucher
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
