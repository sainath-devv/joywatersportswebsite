import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Printer, CheckCircle2, ArrowLeft, RotateCcw, PenTool, FileText, Anchor } from 'lucide-react';
import { formatSafeErrorMessage } from '../lib/errorHandler';
import SignaturePad from '../components/common/SignaturePad';

export default function DeclarationForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get('bookingId') || searchParams.get('id') || '';

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State matching original waiver layout
  const [formData, setFormData] = useState({
    guestName: searchParams.get('name') || '',
    communicationAddress: searchParams.get('address') || '',
    phone: searchParams.get('phone') || '',
    email: searchParams.get('email') || '',
    signature: '',
    agreementDate: searchParams.get('date') || new Date().toISOString().split('T')[0],

    // Guardian details
    hasGuardian: false,
    guardianName: '',
    guardianAddress: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianSignature: '',
    guardianAgreementDate: searchParams.get('date') || new Date().toISOString().split('T')[0],

    // Bottom grid details
    dateOfSailing: searchParams.get('date') || new Date().toISOString().split('T')[0],
    invoiceNo: bookingIdParam || '',
    boardingPassNo: bookingIdParam ? `BP-${bookingIdParam}` : '',
    trip1Time: searchParams.get('time') || '',
    trip2Time: '',
    trip3Time: '',
    trip4Time: '',
    boatG1_1: false,
    boatG1_2: false,
    boatG1_3: false,
    boatBlank: false
  });

  // Pre-fill booking details if bookingId is passed
  useEffect(() => {
    if (bookingIdParam) {
      fetch(`/api/ticket/${bookingIdParam}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setFormData(prev => ({
              ...prev,
              guestName: prev.guestName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
              phone: prev.phone || data.phone || '',
              email: prev.email || data.email || '',
              dateOfSailing: prev.dateOfSailing || data.date || prev.agreementDate,
              agreementDate: prev.agreementDate || data.date || prev.agreementDate,
              invoiceNo: prev.invoiceNo || data.id || bookingIdParam,
              boardingPassNo: prev.boardingPassNo || `BP-${data.id || bookingIdParam}`,
              trip1Time: prev.trip1Time || data.time || ''
            }));
          }
        })
        .catch(() => {});
    }
  }, [bookingIdParam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.guestName.trim()) {
      setErrorMessage('Please enter Guest Name.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage('Please enter Telephone / Mobile Number.');
      return;
    }
    if (!formData.signature) {
      setErrorMessage('Please provide Guest Signature before submitting.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const payload = {
        bookingId: formData.invoiceNo || bookingIdParam || `WALKIN-${Date.now()}`,
        guestName: formData.guestName,
        communicationAddress: formData.communicationAddress || 'Onsite Guest',
        phone: formData.phone,
        email: formData.email,
        signature: formData.signature,
        agreementDate: formData.agreementDate,
        hasMinor: formData.hasGuardian,
        guardianName: formData.guardianName,
        guardianAddress: formData.guardianAddress,
        guardianPhone: formData.guardianPhone,
        guardianEmail: formData.guardianEmail,
        guardianSignature: formData.guardianSignature,
        guardianAgreementDate: formData.guardianAgreementDate,
        dateOfSailing: formData.dateOfSailing,
        invoiceNo: formData.invoiceNo,
        boardingPassNo: formData.boardingPassNo,
        trip1Time: formData.trip1Time,
        trip2Time: formData.trip2Time,
        trip3Time: formData.trip3Time,
        trip4Time: formData.trip4Time,
        boatG1: formData.boatG1_1 || formData.boatG1_2 || formData.boatG1_3,
        isGeneralDeclaration: !bookingIdParam,
        source: bookingIdParam ? 'ONLINE_BOOKING_DECLARATION' : 'NAVBAR_DECLARATION',
        action: bookingIdParam ? 'ONLINE_DECLARATION' : 'GENERAL_DECLARATION'
      };

      const res = await fetch('/api/waivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to save declaration form.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(formatSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 lg:px-8 text-slate-900 font-sans print:bg-white print:p-0">
      {/* Top Controls Bar (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-sky-700 bg-white px-3.5 py-2 rounded-lg border border-slate-300 shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Form
          </button>
        </div>
      </div>

      {/* Main Printed Document Outer Border Frame */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-900 shadow-xl p-5 sm:p-8 md:p-10 print:shadow-none print:border-slate-900 print:p-6 print:max-w-none">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-slate-900 pb-5 mb-5 print:pb-3 print:mb-4">
          
          {/* Left: Company Logo */}
          <div className="flex flex-col items-center justify-center text-center shrink-0">
            <img 
              src="https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx" 
              alt="Joy Water Sports Logo" 
              className="h-16 sm:h-20 w-auto object-contain" 
            />
          </div>

          {/* Center/Right Header Title */}
          <div className="text-center sm:text-right flex-1">
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-black text-black tracking-wider uppercase">
              JOY WATER SPORTS
            </h1>
            <h2 className="font-serif text-xs sm:text-sm md:text-base font-bold text-slate-900 tracking-widest uppercase mt-1">
              WATER SPORTS LIABILITY WAIVER AGREEMENT
            </h2>
            <p className="text-[11px] text-slate-600 font-serif italic mt-0.5">
              Varkala Beach, Kerala • Digital Legal Declaration
            </p>
          </div>
        </div>

        {/* Confirmation Banner if Submitted */}
        {submitted ? (
          <div className="my-6 p-6 bg-emerald-50 border-2 border-emerald-600 rounded-lg text-center space-y-3 print:border-slate-900 print:bg-white">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 print:hidden">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-slate-900 uppercase">
              Liability Waiver &amp; Declaration Submitted Successfully!
            </h3>
            <p className="text-sm text-slate-700">
              Thank you, <strong>{formData.guestName}</strong>. Your waiver agreement has been recorded and attached to your booking pass.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Completed Copy
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-sky-700 transition-all cursor-pointer"
              >
                Return to Home Page
              </button>
            </div>
          </div>
        ) : null}

        {/* Error Message Box */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-bold rounded print:hidden">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 print:space-y-4">
          
          {/* Terms List (Bulleted with ➤ arrow-style bullets) */}
          <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-[13px] leading-relaxed text-slate-900 font-sans print:text-[11px] print:leading-tight">
            <div className="flex items-start gap-2">
              <span className="text-sky-600 font-bold shrink-0 text-sm print:text-black">➤</span>
              <span>I certify that I am fully aware of the risks involved in the activity and I have been briefed about the safety procedures.</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-sky-600 font-bold shrink-0 text-sm print:text-black">➤</span>
              <span>I'm aware about the DO's and Don'ts, medical restrictions and local govt. regulations.</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-sky-600 font-bold shrink-0 text-sm print:text-black">➤</span>
              <span>I state that I am physically fit to undertake the activity and not suffering from any heart problem, blood pressure, asthma or any other serious medical problem.</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-sky-600 font-bold shrink-0 text-sm print:text-black">➤</span>
              <span>I further state that I am lawfully age and legally competent to sign this liability release agreement or that I have obtained the written consent of my parent or guardian.</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-sky-600 font-bold shrink-0 text-sm print:text-black">➤</span>
              <span>I understand and agree that neither JOY WATER SPORTS or its affiliates or subsidiary corporations, nor the owners, employees, agent's contractors may be held liable or responsible in anyway for any injury, death or other damages to me.</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-sky-600 font-bold shrink-0 text-sm print:text-black">➤</span>
              <span>I understand that terms herein are contractual and not mere recital and that I have signed this agreement of my own free act with the knowledge that hereby I agree to waive my legal rights.</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-sky-600 font-bold shrink-0 text-sm print:text-black">➤</span>
              <span>I expressly agree and promise to accept and assume all of the risks existing in this activity. My participation in this activity is purely voluntary, and I elect to participate in spite of the risks.</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-sky-600 font-bold shrink-0 text-sm print:text-black">➤</span>
              <span>Indemnity: I (or my representative) agree to protect and compensate the company against any costs or damages resulting from my negligence or misrepresentation.</span>
            </div>
          </div>

          {/* Guest Details Section (rounded-corner bordered box) */}
          <div className="border border-slate-800 rounded-lg p-4 sm:p-5 bg-white space-y-3.5 print:p-3 print:space-y-2">
            <h3 className="font-serif font-bold text-sm text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1.5">
              GUEST DETAILS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
              {/* Guest Name */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-serif font-bold text-slate-900 uppercase">
                  Guest Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="guestName"
                  value={formData.guestName}
                  onChange={handleChange}
                  required
                  placeholder="Enter full guest name"
                  className="w-full border-b-2 border-dotted border-slate-700 bg-transparent rounded-none px-1 py-1 text-sm font-medium focus:outline-none focus:border-solid focus:border-sky-600"
                />
              </div>

              {/* Communication Address */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-serif font-bold text-slate-900 uppercase">
                  Communication Address
                </label>
                <input
                  type="text"
                  name="communicationAddress"
                  value={formData.communicationAddress}
                  onChange={handleChange}
                  placeholder="Enter full communication address"
                  className="w-full border-b-2 border-dotted border-slate-700 bg-transparent rounded-none px-1 py-1 text-sm font-medium focus:outline-none focus:border-solid focus:border-sky-600"
                />
              </div>

              {/* Telephone/mobile No */}
              <div className="space-y-1">
                <label className="text-xs font-serif font-bold text-slate-900 uppercase">
                  Telephone / Mobile No <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+91 98765 43210"
                  className="w-full border-b-2 border-dotted border-slate-700 bg-transparent rounded-none px-1 py-1 text-sm font-medium focus:outline-none focus:border-solid focus:border-sky-600"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-serif font-bold text-slate-900 uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="guest@example.com"
                  className="w-full border-b-2 border-dotted border-slate-700 bg-transparent rounded-none px-1 py-1 text-sm font-medium focus:outline-none focus:border-solid focus:border-sky-600"
                />
              </div>

              {/* Guest Signature */}
              <div className="space-y-1">
                <SignaturePad
                  label="Guest Signature"
                  required
                  onSignatureChange={(sig) => setFormData(prev => ({ ...prev, signature: sig }))}
                />
              </div>

              {/* Date */}
              <div className="space-y-1 flex flex-col justify-end">
                <label className="text-xs font-serif font-bold text-slate-900 uppercase">
                  Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  name="agreementDate"
                  value={formData.agreementDate}
                  onChange={handleChange}
                  required
                  className="w-full border-b-2 border-dotted border-slate-700 bg-transparent rounded-none px-1 py-1 text-sm font-medium focus:outline-none focus:border-solid focus:border-sky-600"
                />
              </div>
            </div>
          </div>

          {/* Guardian Details Section (separate rounded-corner box below) */}
          <div className="border border-slate-800 rounded-lg p-4 sm:p-5 bg-white space-y-3.5 print:p-3 print:space-y-2">
            
            {/* Guardian Note */}
            <p className="text-xs font-serif italic font-semibold text-slate-800 leading-snug border-b border-slate-300 pb-2">
              In case of children the age of above 16 years or below, the Guardian of the children should submit liability release and assumption of risk agreement-
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
              {/* Guardian Name */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-serif font-bold text-slate-900 uppercase">
                  Guardian Name
                </label>
                <input
                  type="text"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleChange}
                  placeholder="Guardian full name (if applicable)"
                  className="w-full border-b-2 border-dotted border-slate-700 bg-transparent rounded-none px-1 py-1 text-sm font-medium focus:outline-none focus:border-solid focus:border-sky-600"
                />
              </div>

              {/* Communication Address */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-serif font-bold text-slate-900 uppercase">
                  Communication Address
                </label>
                <input
                  type="text"
                  name="guardianAddress"
                  value={formData.guardianAddress}
                  onChange={handleChange}
                  placeholder="Guardian communication address"
                  className="w-full border-b-2 border-dotted border-slate-700 bg-transparent rounded-none px-1 py-1 text-sm font-medium focus:outline-none focus:border-solid focus:border-sky-600"
                />
              </div>

              {/* Guardian Phone */}
              <div className="space-y-1">
                <label className="text-xs font-serif font-bold text-slate-900 uppercase">
                  Telephone / Mobile No
                </label>
                <input
                  type="tel"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={handleChange}
                  placeholder="Guardian contact number"
                  className="w-full border-b-2 border-dotted border-slate-700 bg-transparent rounded-none px-1 py-1 text-sm font-medium focus:outline-none focus:border-solid focus:border-sky-600"
                />
              </div>

              {/* Guardian Email */}
              <div className="space-y-1">
                <label className="text-xs font-serif font-bold text-slate-900 uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  name="guardianEmail"
                  value={formData.guardianEmail}
                  onChange={handleChange}
                  placeholder="guardian@example.com"
                  className="w-full border-b-2 border-dotted border-slate-700 bg-transparent rounded-none px-1 py-1 text-sm font-medium focus:outline-none focus:border-solid focus:border-sky-600"
                />
              </div>

              {/* Guardian Signature */}
              <div className="space-y-1">
                <SignaturePad
                  label="Guardian Signature"
                  onSignatureChange={(sig) => setFormData(prev => ({ ...prev, guardianSignature: sig }))}
                />
              </div>

              {/* Guardian Date */}
              <div className="space-y-1 flex flex-col justify-end">
                <label className="text-xs font-serif font-bold text-slate-900 uppercase">
                  Date
                </label>
                <input
                  type="date"
                  name="guardianAgreementDate"
                  value={formData.guardianAgreementDate}
                  onChange={handleChange}
                  className="w-full border-b-2 border-dotted border-slate-700 bg-transparent rounded-none px-1 py-1 text-sm font-medium focus:outline-none focus:border-solid focus:border-sky-600"
                />
              </div>
            </div>
          </div>

          {/* Bottom Booking Details Grid Row */}
          <div className="border border-slate-800 rounded-lg p-4 sm:p-5 bg-white print:p-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-serif text-slate-900">
              
              {/* Left Column: Stacked Labels with Input Boxes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="whitespace-nowrap font-bold uppercase">Date of sailing :</label>
                  <input
                    type="text"
                    name="dateOfSailing"
                    value={formData.dateOfSailing}
                    onChange={handleChange}
                    className="w-full border-b border-slate-800 bg-transparent px-1 py-0.5 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="whitespace-nowrap font-bold uppercase">Invoice No :</label>
                  <input
                    type="text"
                    name="invoiceNo"
                    value={formData.invoiceNo}
                    onChange={handleChange}
                    className="w-full border-b border-slate-800 bg-transparent px-1 py-0.5 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="whitespace-nowrap font-bold uppercase">Boarding Pass No :</label>
                  <input
                    type="text"
                    name="boardingPassNo"
                    value={formData.boardingPassNo}
                    onChange={handleChange}
                    className="w-full border-b border-slate-800 bg-transparent px-1 py-0.5 focus:outline-none"
                  />
                </div>
              </div>

              {/* Middle Column: Trip Times */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="whitespace-nowrap font-bold uppercase">Trip 1 Time :</label>
                  <input
                    type="text"
                    name="trip1Time"
                    value={formData.trip1Time}
                    onChange={handleChange}
                    placeholder="e.g. 10:00 AM"
                    className="w-full border-b border-slate-800 bg-transparent px-1 py-0.5 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="whitespace-nowrap font-bold uppercase">Trip 2 Time :</label>
                  <input
                    type="text"
                    name="trip2Time"
                    value={formData.trip2Time}
                    onChange={handleChange}
                    placeholder="e.g. 11:30 AM"
                    className="w-full border-b border-slate-800 bg-transparent px-1 py-0.5 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="whitespace-nowrap font-bold uppercase">Trip 3 Time :</label>
                  <input
                    type="text"
                    name="trip3Time"
                    value={formData.trip3Time}
                    onChange={handleChange}
                    className="w-full border-b border-slate-800 bg-transparent px-1 py-0.5 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="whitespace-nowrap font-bold uppercase">Trip 4 Time :</label>
                  <input
                    type="text"
                    name="trip4Time"
                    value={formData.trip4Time}
                    onChange={handleChange}
                    className="w-full border-b border-slate-800 bg-transparent px-1 py-0.5 focus:outline-none"
                  />
                </div>
              </div>

              {/* Right Column: Boat selection checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold uppercase">
                  <span>Boat :</span>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        name="boatG1_1"
                        checked={formData.boatG1_1}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-slate-700 text-sky-600 focus:ring-sky-500"
                      />
                      <span>G1</span>
                    </label>

                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        name="boatG1_2"
                        checked={formData.boatG1_2}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-slate-700 text-sky-600 focus:ring-sky-500"
                      />
                      <span>G1</span>
                    </label>

                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        name="boatG1_3"
                        checked={formData.boatG1_3}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-slate-700 text-sky-600 focus:ring-sky-500"
                      />
                      <span>G1</span>
                    </label>

                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        name="boatBlank"
                        checked={formData.boatBlank}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-slate-700 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="w-3 inline-block"></span>
                    </label>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Form Submit Button (Hidden in Print) */}
          {!submitted && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
              <p className="text-xs text-slate-500 italic">
                By clicking Submit Waiver, you acknowledge that all information provided is accurate and legally binding.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-[#091F44] hover:bg-[#004E98] text-white px-8 py-3 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Submit
                  </>
                )}
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
