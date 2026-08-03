import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Plane, ArrowRight, ArrowLeft, Check, Camera, Video, 
  Aperture, LogOut, User, Menu, X, ShieldCheck, Award, Heart, Search, FileText, ExternalLink,
  Ticket, Clock, CheckCircle, AlertCircle, Calendar, Users, Send, Phone, Mail, MessageSquare, CheckSquare, PhoneCall, ChevronDown
} from 'lucide-react';
import { parsePhoneNumber } from 'libphonenumber-js';
import { ACTIVITY_PRICES, EXPERIENCES, formatTime } from '../utils/constants';
import Footer from '../components/common/Footer';
import VideoGallerySection from '../components/common/VideoGallerySection';
import LazySection from '../components/common/LazySection';
import HeroVectorVideo from '../components/common/HeroVectorVideo';
import { formatSafeErrorMessage } from '../lib/errorHandler';
import SignaturePad from '../components/common/SignaturePad';
import SEOHead, { joyWaterSportsBusinessSchema } from '../components/common/SEOHead';

export default function LandingPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isReviewsPaused, setIsReviewsPaused] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: "1",
    activities: [] as string[],
    specialRequest: ""
  });
  const [declarationData, setDeclarationData] = useState({
    guestName: "",
    communicationAddress: "",
    agreementDate: new Date().toISOString().split('T')[0],
    signature: "",
    declarationAgreed: false,
    hasGuardian: false,
    guardianName: "",
    guardianAddress: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianSignature: "",
    guardianAgreementDate: new Date().toISOString().split('T')[0]
  });
  const [bookingStep, setBookingStep] = useState<1 | 2>(1);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const isStep1Valid = useMemo(() => {
    const hasFirstName = formData.firstName.trim().length > 0;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasValidEmail = emailRegex.test(formData.email.trim());
    const digitsOnly = (formData.phone || '').replace(/\D/g, '');
    const hasValidPhone = digitsOnly.length >= 10 && digitsOnly.length <= 15;
    const hasDate = Boolean(formData.date);
    const hasTime = Boolean(formData.time);
    const hasActivities = formData.activities.length > 0;
    return hasFirstName && hasValidEmail && hasValidPhone && hasDate && hasTime && hasActivities;
  }, [formData]);

  const isStep2Valid = useMemo(() => {
    const effectiveGuestName = declarationData.guestName.trim() || `${formData.firstName} ${formData.lastName}`.trim();
    const hasGuestName = effectiveGuestName.length > 0;
    const hasSignature = Boolean(declarationData.signature);
    const hasAgreed = declarationData.declarationAgreed === true;

    let guardianValid = true;
    if (declarationData.hasGuardian) {
      guardianValid = declarationData.guardianName.trim().length > 0 && Boolean(declarationData.guardianSignature);
    }

    return hasGuestName && hasSignature && hasAgreed && guardianValid;
  }, [formData, declarationData]);

  const isFormValid = useMemo(() => {
    return isStep1Valid && isStep2Valid;
  }, [isStep1Valid, isStep2Valid]);

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastConfirmedBooking, setLastConfirmedBooking] = useState<any>(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [agreedToWaiver, setAgreedToWaiver] = useState(false);

  // Direct Booking & Enquiry Form State
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryEmail, setEnquiryEmail] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryActivities, setEnquiryActivities] = useState<string[]>(['Overall Watersports Package']);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [isEnquirySubmitting, setIsEnquirySubmitting] = useState(false);
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<any>(null);

  // Activity list with pricing
  const ACTIVITY_OPTIONS = [
    { id: 'OVERALL', name: 'Overall Watersports Package', price: 4500, tag: 'Best Value' },
    { id: 'PARASAILING', name: 'Parasailing', price: 2500, tag: 'High Thrill' },
    { id: 'JET SKI', name: 'Jet Ski', price: 700, tag: 'Speed' },
    { id: 'BANANA BOAT', name: 'Banana Boat', price: 500, tag: 'Group Fun' },
    { id: 'SPEED BOAT', name: 'Speed Boat', price: 500, tag: 'Family Favorite' },
    { id: 'FLYING FISH', name: 'Flying Fish', price: 600, tag: 'High Thrill' },
    { id: 'CRAZY SOFA', name: 'Crazy Sofa', price: 500, tag: 'Bouncy Ride' },
    { id: 'DOUGHNUT BOAT', name: 'Doughnut Boat', price: 500, tag: 'Spin & Splash' },
    { id: 'ATV', name: 'ATV Beach Ride', price: 300, tag: 'Land Ride' },
  ];

  const toggleActivity = (actName: string) => {
    setEnquiryActivities(prev => {
      if (actName === 'Overall Watersports Package') {
        return ['Overall Watersports Package'];
      }
      // If choosing individual activities, remove 'Overall Watersports Package'
      const withoutOverall = prev.filter(a => a !== 'Overall Watersports Package');
      if (withoutOverall.includes(actName)) {
        const remaining = withoutOverall.filter(a => a !== actName);
        return remaining.length === 0 ? ['Overall Watersports Package'] : remaining;
      } else {
        return [...withoutOverall, actName];
      }
    });
  };

  // Centralized State


  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryName.trim() || !enquiryPhone.trim()) {
      alert('Please enter your Name and Mobile Number.');
      return;
    }
    setIsEnquirySubmitting(true);

    const guestsNum = parseInt(formData.guests) || 1;
    const totalCalculatedAmt = enquiryActivities.reduce((sum, act) => {
      const found = ACTIVITY_OPTIONS.find(a => a.name === act || a.id === act);
      return sum + (found ? found.price : 500);
    }, 0) * guestsNum;

    const chosenDate = formData.date || new Date().toISOString().split('T')[0];
    const chosenTime = formData.time ? formatTime(formData.time) : '09:00 AM';

    const payload = {
      firstName: enquiryName.trim(),
      lastName: '',
      email: enquiryEmail.trim() || 'notprovided@joywatersports.com',
      phone: enquiryPhone.trim(),
      activities: enquiryActivities.length > 0 ? enquiryActivities : ['Overall Watersports Package'],
      specialRequest: enquiryMessage.trim(),
      totalAmount: totalCalculatedAmt,
      date: chosenDate,
      time: chosenTime,
      guests: guestsNum
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const bookingId = data?.booking?.id || 'JWS-ENQ-' + Math.floor(1000 + Math.random() * 9000);

      const message = `🌊 *NEW BOOKING RESERVATION* 🌊\n\n` +
                      `🆔 *Booking ID:* ${bookingId}\n` +
                      `👤 *Name:* ${enquiryName.trim()}\n` +
                      `📞 *Phone:* ${enquiryPhone.trim()}\n` +
                      `📧 *Email:* ${enquiryEmail.trim() || 'N/A'}\n` +
                      `📅 *Date:* ${chosenDate}\n` +
                      `⏰ *Time Slot:* ${chosenTime}\n` +
                      `👥 *Guests:* ${guestsNum}\n` +
                      `🏄 *Activities:* ${payload.activities.join(", ")}\n` +
                      `💰 *Total Amount:* ₹${totalCalculatedAmt.toLocaleString('en-IN')}\n` +
                      `📝 *Special Request:* ${enquiryMessage.trim() || "None"}\n`;

      const whatsappUrl = `https://wa.me/919025286044?text=${encodeURIComponent(message)}`;

      setSubmittedEnquiry({
        ...payload,
        bookingId,
        whatsappUrl
      });
    } catch (err) {
      const bookingId = 'JWS-ENQ-' + Math.floor(1000 + Math.random() * 9000);
      const message = `🌊 *NEW BOOKING RESERVATION* 🌊\n\n` +
                      `🆔 *Booking ID:* ${bookingId}\n` +
                      `👤 *Name:* ${enquiryName.trim()}\n` +
                      `📞 *Phone:* ${enquiryPhone.trim()}\n` +
                      `📅 *Date:* ${chosenDate}\n` +
                      `🏄 *Activities:* ${payload.activities.join(", ")}\n` +
                      `💰 *Total Amount:* ₹${totalCalculatedAmt.toLocaleString('en-IN')}\n`;
      const whatsappUrl = `https://wa.me/919025286044?text=${encodeURIComponent(message)}`;
      setSubmittedEnquiry({
        ...payload,
        bookingId,
        whatsappUrl
      });
    } finally {
      setIsEnquirySubmitting(false);
      setShowContactPopup(true);
    }
  };

  // Customer Booking Lookup State
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [lookupInput, setLookupInput] = useState('');
  const [lookupResults, setLookupResults] = useState<any[] | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const executeLookupSearch = async (queryStr: string) => {
    if (!queryStr || !queryStr.trim()) return;
    setLookupError('');
    setLookupLoading(true);
    setLookupResults(null);

    try {
      const res = await fetch('/api/customer/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrId: queryStr.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No active bookings found matching your details.');
      }
      setLookupResults(data.bookings || []);
    } catch (err: any) {
      setLookupError(formatSafeErrorMessage(err));
    } finally {
      setLookupLoading(false);
    }
  };

  const handleLookupSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!lookupInput || !lookupInput.trim()) {
      setLookupError('Please enter your Phone Number or Booking ID.');
      return;
    }
    executeLookupSearch(lookupInput.trim());
  };

  const handleOpenAccountModal = (queryOverride?: string) => {
    setMobileMenuOpen(false);
    setIsLookupOpen(true);

    const savedPhone = localStorage.getItem('userPhone') || formData.phone || '';
    const initialQuery = queryOverride || savedPhone || lookupInput || '';

    if (initialQuery && initialQuery.trim()) {
      setLookupInput(initialQuery.trim());
      executeLookupSearch(initialQuery.trim());
    } else {
      setLookupResults(null);
      setLookupError('');
    }
  };

  useEffect(() => {
    document.title = "Joy Water Sports | Premium Adventures in Varkala";
  }, []);

  useEffect(() => {
    const rawBook = searchParams.get('book');
    if (!rawBook) return;

    const bookUpper = decodeURIComponent(rawBook).toUpperCase();
    if (ACTIVITY_PRICES[bookUpper]) {
      setFormData(prev => {
        if (prev.activities.includes(bookUpper) && prev.activities.length === 1) return prev;
        return { ...prev, activities: [bookUpper] };
      });

      // Allow DOM layout to complete before scrolling smoothly to the booking section
      const scrollTimer = setTimeout(() => {
        const el = document.getElementById("booking-section");
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      // Clean up search param after smooth scroll finishes
      const cleanupTimer = setTimeout(() => {
        setSearchParams(prev => {
          if (!prev.has('book')) return prev;
          const next = new URLSearchParams(prev);
          next.delete('book');
          return next;
        }, { replace: true });
      }, 900);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(cleanupTimer);
      };
    }
  }, [searchParams.get('book')]);

  const totalAmount = useMemo(() => {
    const guests = parseInt(formData.guests) || 0;
    const perPersonPrice = formData.activities.reduce((sum, activity) => sum + (ACTIVITY_PRICES[activity] || 0), 0);
    return guests * perPersonPrice;
  }, [formData.guests, formData.activities]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isPackageOption = (act: string) => {
    if (!act) return false;
    return act === 'PACKAGE 2500' || act === 'OVERALL';
  };

  const handleActivityToggle = (activity: string) => {
    setFormData(prev => {
      const active = prev.activities.includes(activity);
      const isPkg = isPackageOption(activity);
      
      if (active) {
        return {
          ...prev,
          activities: prev.activities.filter(a => a !== activity)
        };
      } else {
        if (isPkg) {
          // Selecting a package replaces any current selection with just this package
          return {
            ...prev,
            activities: [activity]
          };
        } else {
          // Selecting an individual activity removes any package and adds this activity
          return {
            ...prev,
            activities: [...prev.activities.filter(a => !isPackageOption(a)), activity]
          };
        }
      }
    });
  };

  const validateStep1 = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First Name is required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    const digitsOnly = (formData.phone || '').replace(/\D/g, '');
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      errors.phone = "Please enter a valid 10-digit phone number.";
    }

    if (!formData.date) {
      errors.date = "Sailing date is required.";
    }

    if (!formData.time) {
      errors.time = "Time slot is required.";
    }

    if (formData.activities.length === 0) {
      errors.activities = "Please select at least one activity or package.";
    }

    return errors;
  };

  const handleNextStep = () => {
    const errors = validateStep1();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.getElementById(`field-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = element.querySelector('input, select, textarea') as HTMLElement;
        if (input) input.focus();
      }
      return;
    }

    setFieldErrors({});
    setDeclarationData(prev => ({
      ...prev,
      guestName: prev.guestName || `${formData.firstName} ${formData.lastName}`.trim()
    }));
    setBookingStep(2);
    document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const validateAndGetErrors = () => {
    const errors = validateStep1();

    const effectiveGuestName = declarationData.guestName.trim() || `${formData.firstName} ${formData.lastName}`.trim();
    if (!effectiveGuestName) {
      errors.guestName = "Guest name is required for declaration.";
    }

    if (!declarationData.signature) {
      errors.signature = "Guest signature is required.";
    }

    if (!declarationData.declarationAgreed) {
      errors.declarationAgreed = "You must accept the liability release agreement.";
    }

    if (declarationData.hasGuardian) {
      if (!declarationData.guardianName.trim()) {
        errors.guardianName = "Guardian name is required.";
      }
      if (!declarationData.guardianSignature) {
        errors.guardianSignature = "Guardian signature is required.";
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check Step 1 errors first
    const step1Errors = validateStep1();
    if (Object.keys(step1Errors).length > 0) {
      setFieldErrors(step1Errors);
      setBookingStep(1);
      const firstErrorKey = Object.keys(step1Errors)[0];
      const element = document.getElementById(`field-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = element.querySelector('input, select, textarea') as HTMLElement;
        if (input) input.focus();
      }
      return;
    }

    // Check full errors
    const errors = validateAndGetErrors();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setBookingStep(2);
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.getElementById(`field-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = element.querySelector('input, select, textarea') as HTMLElement;
        if (input) input.focus();
      }
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    let parsedPhone = formData.phone;
    try {
      const phoneNumber = parsePhoneNumber(formData.phone, 'IN');
      if (phoneNumber && phoneNumber.isValid()) {
        parsedPhone = phoneNumber.format('E.164');
      }
    } catch (error) {}

    const effectiveGuestName = declarationData.guestName.trim() || `${formData.firstName} ${formData.lastName}`.trim();

    const payload = {
      ...formData,
      phone: parsedPhone,
      totalAmount,
      guestName: effectiveGuestName,
      communicationAddress: declarationData.communicationAddress.trim() || 'Online Guest, Varkala',
      signature: declarationData.signature,
      agreementDate: declarationData.agreementDate || formData.date || new Date().toISOString().split('T')[0],
      declarationAgreed: declarationData.declarationAgreed,
      hasGuardian: declarationData.hasGuardian,
      guardianName: declarationData.guardianName,
      guardianAddress: declarationData.guardianAddress,
      guardianPhone: declarationData.guardianPhone,
      guardianEmail: declarationData.guardianEmail,
      guardianSignature: declarationData.guardianSignature,
      guardianAgreementDate: declarationData.guardianAgreementDate
    };

    try {
      // 1. Submit the main booking
      const bResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!bResponse.ok) {
        const errorData = await bResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to make reservation");
      }

      const bResult = await bResponse.json();
      const bookingId = bResult.booking.id;



      const message = `🌊 *NEW BOOKING ENQUIRY* 🌊\n\n` +
                      `🆔 *Booking ID:* ${bookingId}\n` +
                      `👤 *Name:* ${formData.firstName} ${formData.lastName}\n` +
                      `📧 *Email:* ${formData.email}\n` +
                      `📞 *Phone:* ${parsedPhone}\n` +
                      `📅 *Date:* ${formData.date}\n` +
                      `⏰ *Time:* ${formatTime(formData.time)}\n` +
                      `👥 *Members:* ${formData.guests}\n` +
                      `🏄 *Activities:* ${formData.activities.join(", ")}\n` +
                      `💰 *Total Amount:* ₹${totalAmount}\n` +
                      `💬 *Message:* ${formData.specialRequest || "None"}\n`;

      const whatsappUrl = `https://wa.me/919025286044?text=${encodeURIComponent(message)}`;
      
      const confirmedData = {
        bookingId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: parsedPhone,
        date: formData.date,
        time: formData.time,
        guests: formData.guests,
        activities: [...formData.activities],
        totalAmount,
        whatsappUrl
      };

      setLastConfirmedBooking(confirmedData);
      setSubmittedEnquiry(confirmedData);
      setShowContactPopup(true);
      setStatus("success");
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        date: "",
        time: "",
        guests: "1",
        activities: [],
        specialRequest: ""
      });

      setDeclarationData({
        guestName: "",
        communicationAddress: "",
        agreementDate: new Date().toISOString().split('T')[0],
        signature: "",
        declarationAgreed: false,
        hasGuardian: false,
        guardianName: "",
        guardianAddress: "",
        guardianPhone: "",
        guardianEmail: "",
        guardianSignature: "",
        guardianAgreementDate: new Date().toISOString().split('T')[0]
      });
      setFieldErrors({});

    } catch (err: any) {
      setStatus("error");
      setErrorMessage(formatSafeErrorMessage(err));
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -380, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 380, behavior: 'smooth' });
    }
  };

  const packages = [
    { name: "Package 2500", price: "₹2500", period: "/person", description: "Special offer this month! Includes 3 amazing activities.", features: ["Parasailing", "Jet Ski", "1 Complementary Activity"], isPopular: true },
    { name: "Overall Package", price: "₹4500", period: "/person", description: "The ultimate experience including all water sports activities.", features: ["Parasailing", "Jet Ski", "Flying Fish", "Speed Boat", "Banana Boat", "Crazy Sofa", "Doughnut Boat", "ATV"], isPopular: false }
  ];

  const testimonials = [
    { quote: "We had been here to experience the speed boat ride. The cost was rupees five hundred each. Life jacket was provided. The experience was amazing and definitely worth it. You can spot dolphins if you are lucky. There is an option to dive in middle of the sea for two hundred rupees per person. The water was blue. Overall would recommend this to others.", name: "Verified Explorer" },
    { quote: "Wonderful experience with Joy water sports. Our family tried their Parasailing, doughnut ride, crazy sofa and it was really worth it and completely safe. They ensured we had the maximum fun and also suggested the right rides. Would highly recommend them !!", name: "HARRISH SREEDHAR" },
    { quote: "I recently visited Varkala and met Joy water sports. JWS provides great service in water activities.If anyone wants great experience you should contact JWS. Thank you Joy water sports for helping me to accomplish one of my bucket list....☺️", name: "Keerthana K" },
    { quote: "Amazing experience with Joy Water Sports! Very professional team and safety was well maintained. The ride was thrilling and unforgettable. Highly recommended! 🥳", name: "Rameshwaran Saravanan" },
    { quote: "Had a fantastic time with Joy Water Sports in Varkala. The staff explained everything clearly and made sure safety was the top priority. The parasailing view was breathtaking, and the overall experience was smooth and enjoyable. Definitely worth trying!", name: "Swathi Amutha" },
    { quote: "I have no words to explain our experiences.... We had all the adventure rides with them.... Like paragliding, banana ride, jetski, speed boat so bcoz of combo pack they gave us donut ride for free...thank u so much...I would recommend who r visiting varkala must try these adventures there with them...the boys working there are too good and polite nd friendly...thank u guys...", name: "Divya Mohan" }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-deep-blue overflow-x-hidden relative bg-foam-white">
      <SEOHead
        title="Joy Water Sports Varkala | #1 Water Sports & Papanasam Beach Booking"
        description="Experience the top water sports in Varkala, Kerala! Book Parasailing, Jet Ski, Flying Fish, Speedboat & Banana rides at Papanasam Beach. Certified safety & instant digital ticket."
        canonicalUrl="https://joywatersports.com"
        keywords="water sports Varkala, water sports Papanasam beach, Varkala water sports booking, Parasailing Varkala, Jet ski Varkala, Flying fish Varkala, things to do in Varkala, Kerala holidays water sports"
        schema={[
          joyWaterSportsBusinessSchema,
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Where is Joy Water Sports located in Varkala?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Joy Water Sports is located directly on Papanasam Beach shoreline below North Cliff, Varkala, Kerala 695141.'
                }
              },
              {
                '@type': 'Question',
                name: 'What activities are available at Joy Water Sports Varkala?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'We offer Parasailing, Jet Skiing, Flying Fish, Speed Boat rides, Banana Boat, Crazy Sofa, Doughnut Boat, and Beach ATV quad rides.'
                }
              },
              {
                '@type': 'Question',
                name: 'Is swimming required for water sports in Varkala?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'No, swimming is NOT required! We provide certified high-buoyancy life jackets and double-certified safety mariners for all activities.'
                }
              }
            ]
          }
        ]}
      />
      {/* Hero Vector Animated Video Background */}
      <div className="absolute top-0 left-0 w-full h-[85vh] sm:h-[65vh] lg:h-[65vh] z-0 overflow-hidden rounded-b-[40px] shadow-sm bg-[#f8f9fc]">
        <HeroVectorVideo />
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 pt-4 px-4 text-deep-blue mx-auto w-full max-w-3xl transition-all duration-300">
        <div className="rounded-full px-5 sm:px-6 py-2.5 flex items-center justify-between relative bg-white/95 backdrop-blur-md border border-slate-200/60 shadow-lg shadow-black/5">
          {/* Logo */}
          <div className="flex items-center cursor-pointer group shrink-0" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }}>
            <img src="https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx" alt="Logo" className="h-7 sm:h-8 w-auto object-contain" />
          </div>
          
          {/* Desktop Navigation Links & Book Now Button (Centered with proper gap) */}
          <div className="hidden md:flex items-center justify-center gap-6 lg:gap-8 mx-auto">
            <button onClick={() => document.getElementById('activities-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-[14px] font-bold text-deep-blue hover:text-sky-blue transition-colors cursor-pointer whitespace-nowrap">Activities</button>
            <button onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-[14px] font-bold text-deep-blue hover:text-sky-blue transition-colors cursor-pointer whitespace-nowrap">Pricing &amp; Offers</button>
            <button onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-[14px] font-bold text-deep-blue hover:text-sky-blue transition-colors cursor-pointer whitespace-nowrap">Reviews</button>
            <Link to="/declaration" className="text-[14px] font-bold text-deep-blue hover:text-sky-blue transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1">
              <FileText size={15} className="text-sky-600" />
              Declaration
            </Link>
            <button onClick={() => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' })} className="bg-gradient-to-r from-sky-blue to-deep-blue hover:from-sky-blue hover:to-ocean-blue text-white px-5 py-2 rounded-full text-xs sm:text-sm font-bold shadow-md shadow-sky-blue/20 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer whitespace-nowrap">Book Now</button>
          </div>

          {/* Mobile Navigation controls */}
          <div className="flex md:hidden items-center gap-2">
            <button 
              onClick={() => {
                document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                setMobileMenuOpen(false);
              }} 
              className="bg-gradient-to-r from-sky-blue to-deep-blue text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md shadow-sky-blue/10 transition-all active:scale-95 cursor-pointer"
            >
              Book Now
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-deep-blue hover:text-sky-blue focus:outline-none transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={22} className="transition-transform duration-200 rotate-90" /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile Menu Dropdown Panel */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-3 bg-white rounded-[24px] p-5 shadow-2xl border border-gray-100 flex flex-col gap-4 z-40 text-left md:hidden"
            >
              <div className="flex flex-col gap-1 border-b border-gray-100 pb-3">
                <button 
                  onClick={() => {
                    document.getElementById('activities-section')?.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2.5 px-3 text-sm font-bold text-deep-blue hover:text-sky-blue hover:bg-gray-50 rounded-xl transition-all"
                >
                  Catalog Activities
                </button>
                <button 
                  onClick={() => {
                    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2.5 px-3 text-sm font-bold text-deep-blue hover:text-sky-blue hover:bg-gray-50 rounded-xl transition-all"
                >
                  Pricing &amp; Special Offers
                </button>
                <button 
                  onClick={() => {
                    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2.5 px-3 text-sm font-bold text-deep-blue hover:text-sky-blue hover:bg-gray-50 rounded-xl transition-all"
                >
                  Customer Reviews
                </button>
                <Link
                  to="/declaration"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-left py-2.5 px-3 text-sm font-bold text-deep-blue hover:text-sky-blue hover:bg-gray-50 rounded-xl transition-all flex items-center gap-2"
                >
                  <FileText size={16} className="text-sky-600" />
                  Liability Waiver Declaration
                </Link>
              </div>

              {/* Mobile Ticket Status Check Container */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenAccountModal()}
                  className="w-full bg-sky-50 border border-sky-200 text-[#004E98] font-bold py-2.5 px-4 rounded-xl text-center text-xs transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Ticket size={15} /> Check Ticket Status by Phone / ID
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 relative flex flex-col items-center justify-center min-h-[85vh] sm:min-h-[65vh] lg:min-h-[65vh] pt-32 pb-16 w-full overflow-hidden">
        <div className="relative z-20 flex flex-col items-center justify-center max-w-4xl mx-auto px-4 md:px-12 w-full text-center">
          <h1 style={{ color: '#004E98' }} className="text-[10vw] sm:text-[8vw] md:text-6xl lg:text-7xl font-display font-extrabold leading-[1.1] tracking-tight drop-shadow-xs">Life's an adventure,<br className="sm:hidden" /> live it!</h1>
          <p className="text-sm sm:text-lg md:text-xl text-slate-800 font-bold leading-relaxed max-w-2xl mt-4 sm:mt-6 px-4">Premium water sports and coastal adventures in Varkala. Experience jet skiing, parasailing, and more with Joy Water Sports.</p>
        </div>
      </main>

      {/* About Section */}
      <section className="relative w-full flex flex-col items-center py-12 md:py-16 bg-surf-4 z-20">
        <div className="w-full max-w-4xl px-4 sm:px-6 flex flex-col items-center text-center pb-8 sm:pb-12">
          <span className="text-sky-blue text-xs font-bold uppercase tracking-widest mb-4 underline underline-offset-4 decoration-deep-blue decoration-2">
            About Us
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-display text-deep-blue leading-tight mb-6 font-semibold">A wonderful place <br/>for a <span className="text-sky-blue">family vacation</span></h2>
          <p className="text-deep-blue/70 max-w-[650px] text-sm md:text-base leading-relaxed font-semibold">Feel the harmony, enjoy the comfort, admire the beautiful views and interiors. Our resort is one of the most suitable places for relaxation and unforgettable memories.</p>
        </div>
        <div className="w-full max-w-7xl mx-auto flex h-[300px] sm:h-[340px] md:h-[420px] lg:h-[520px] gap-1 px-2 sm:px-6 justify-center">
          <div className="w-[25%] sm:w-[20%] md:w-[22%] h-full overflow-hidden border border-gray-100 shadow-sm rounded-l-2xl"><img loading="lazy" decoding="async" src="https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/jws1.png" alt="Resort" className="w-full h-full object-cover" /></div>
          <div className="w-[50%] sm:w-[56%] md:w-[54%] h-full overflow-hidden border border-gray-100 shadow-sm"><img loading="lazy" decoding="async" src="https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/parasailingmain.png" alt="Adventure" className="w-full h-full object-cover" /></div>
          <div className="w-[25%] sm:w-[20%] md:w-[22%] h-full overflow-hidden border border-gray-100 shadow-sm rounded-r-2xl"><img loading="lazy" decoding="async" src="https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/jws3.png" alt="Pool" className="w-full h-full object-cover" /></div>
        </div>
      </section>

      {/* Activities Section */}
      <section id="activities-section" className="relative w-full flex flex-col px-6 sm:px-12 lg:pl-20 xl:pl-32 lg:pr-12 xl:pr-20 py-16 lg:py-24 bg-surf-1">
        <div className="flex flex-col mb-12 w-full max-w-[1550px]">
          <span className="self-start text-sky-blue text-xs font-bold uppercase tracking-widest mb-6 underline underline-offset-4 decoration-deep-blue decoration-2">
            Activities
          </span>
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 w-full">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-display text-deep-blue leading-tight font-semibold">Our catalog of <br />best <span className="text-sky-blue">activities</span> for 2026</h2>
            <p className="text-deep-blue/60 text-base font-medium max-w-[320px] leading-[1.6] text-left">Premium coastal experiences <br/>and water sport activities <br/>at the peak of popularity</p>
          </div>
        </div>
        <div ref={scrollContainerRef} className="flex overflow-x-auto overflow-y-hidden gap-4 sm:gap-6 w-full max-w-[1550px] pb-4 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {EXPERIENCES.map((exp, index) => (
            <Link to={`/activity/${exp.id}`} key={index} className="relative w-[320px] sm:w-[350px] lg:w-[380px] shrink-0 aspect-[4/5] overflow-hidden group cursor-pointer shadow-sm snap-start block rounded-2xl" style={{ contentVisibility: 'auto', containIntrinsicSize: '320px 400px' }}>
              <img src={exp.image} alt={exp.title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none animate-fade-in" />
              <div className="absolute bottom-0 left-0 w-full p-5 flex justify-between items-end gap-2">
                <div className="flex flex-col items-start">
                  <h3 className="text-white font-medium text-lg mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{exp.title}</h3>
                  <div className="bg-sky-blue text-white text-[15px] font-bold px-3 py-1 inline-block shadow-md shadow-black/30 rounded-md">
                    Price: ₹{exp.price}/-
                  </div>
                </div>
                <button type="button" className="text-sm font-semibold text-white transition-all duration-300 flex items-center gap-1 hover:text-sky-blue whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  <span>View Details</span> <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </Link>
          ))}
        </div>
        <div className="flex justify-center items-center mt-8 sm:mt-12 w-full max-w-[1550px]">
          <div className="flex gap-4">
            <button type="button" aria-label="Scroll left" onClick={scrollLeft} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-deep-blue flex items-center justify-center text-white hover:bg-sky-blue transition-transform active:scale-95 shadow-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            <button type="button" aria-label="Scroll right" onClick={scrollRight} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-deep-blue flex items-center justify-center text-white hover:bg-sky-blue transition-transform active:scale-95 shadow-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Media Partner Section */}
      <section className="relative w-full py-24 bg-white overflow-hidden border-t border-b border-gray-100">
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-12 flex flex-col lg:flex-row items-center gap-16">
           {/* Text Content */}
           <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sky-blue mb-8 underline underline-offset-4 decoration-deep-blue decoration-2">
                <Camera size={14} className="text-sky-blue" />
                <span>Onsite Media Partner</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-display text-deep-blue leading-tight mb-6 font-semibold">
                Capture the <br className="hidden lg:block" />
                <span className="text-sky-blue">adrenaline.</span>
              </h2>

              <p className="text-gray-600 text-base sm:text-lg mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Immortalize your water sports adventure in breathtaking detail with our onsite action cameras. Professional-grade memories captured effortlessly.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto lg:mx-0 text-left">
                 <div className="flex flex-col gap-3">
                    <div className="w-10 h-10 bg-sky-blue/10 rounded-full flex items-center justify-center text-sky-blue border border-sky-blue/20">
                       <Video size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-deep-blue text-base mb-1">Cinematic Action Video</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">Unmatched clarity and fluid stabilization for every moment.</p>
                    </div>
                 </div>
                 <div className="flex flex-col gap-3">
                    <div className="w-10 h-10 bg-sky-blue/10 rounded-full flex items-center justify-center text-sky-blue border border-sky-blue/20">
                       <Aperture size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-deep-blue text-base mb-1">Ultra HD Photos</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">Perfectly timed shots to capture the exact moment of splash.</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Minimalist Image Layout */}
           <div className="w-full lg:w-[45%] relative mx-auto h-[400px] sm:h-[500px]">
               {/* Main image */}
               <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm bg-gray-100">
                  <img 
                    src="https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/360cam.png" 
                    alt="Action Camera" 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover" 
                  />
               </div>

               {/* Simple Floating Badge */}
               <div className="hidden">
                  <p className="text-gray-900 font-semibold text-lg tracking-tight mb-1">GoPro Pro</p>
                  <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-green-500"></span>
                     <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Official Gear</span>
                  </div>
               </div>
           </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-section" className="relative w-full flex flex-col items-center px-4 sm:px-12 py-16 lg:py-24 bg-surf-2">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=2000')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-surf-2 via-surf-2/85 to-surf-2 z-0"></div>
        <div className="relative z-10 flex flex-col items-center w-full">
          <span className="text-sky-blue text-xs font-bold uppercase tracking-widest mb-4 underline underline-offset-4 decoration-deep-blue decoration-2">Exclusive Packages</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-deep-blue leading-tight text-center mb-5 font-semibold">Unbeatable <span className="text-sky-blue">Adventures</span></h2>
          <p className="text-deep-blue/60 text-center max-w-[500px] text-sm md:text-base leading-relaxed mb-12 sm:mb-16 px-2 font-medium">Choose an adventure package that suits you best. Get more activities for a better price.</p>
          
          <div className="flex flex-col lg:flex-row items-stretch justify-center gap-6 sm:gap-8 w-full max-w-[850px] px-4 lg:px-0">
            {packages.map((pkg, index) => (
              <div key={index} className={`w-full lg:w-1/2 flex flex-col p-8 sm:p-10 rounded-[32px] transition-all duration-300 hover:-translate-y-2 ${pkg.isPopular ? 'bg-deep-blue text-white shadow-2xl relative lg:-mt-4 lg:-mb-4 z-10 border border-white/10' : 'bg-white text-deep-blue shadow-xl border border-gray-100 hover:shadow-2xl z-0'}`}>
                {pkg.isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-sky-blue text-white text-[11px] font-bold tracking-wider uppercase px-4 py-1.5 rounded-full shadow-lg">
                    Best Value
                  </div>
                )}
                <h3 className={`font-serif mb-2 ${pkg.isPopular ? 'text-[28px] sm:text-[32px]' : 'text-[24px] sm:text-[28px]'}`}>{pkg.name}</h3>
                <p className={`leading-relaxed mb-6 font-medium ${pkg.isPopular ? 'text-white/80' : 'text-deep-blue/70'}`}>{pkg.description}</p>
                
                <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-opacity-20 border-current">
                  <span className={`font-medium tracking-tight leading-none ${pkg.isPopular ? 'text-[52px] sm:text-[64px] text-sky-blue' : 'text-[44px] sm:text-[52px] text-deep-blue'}`}>{pkg.price}</span>
                  <span className={`text-[14px] sm:text-[15px] ${pkg.isPopular ? 'text-white/70' : 'text-deep-blue/60'}`}>{pkg.period}</span>
                </div>
                
                <div className="mb-8 flex-1">
                  <p className={`font-bold tracking-wider uppercase mb-5 ${pkg.isPopular ? 'text-[14px] text-white/90' : 'text-[13px] text-deep-blue/90'}`}>What's Included:</p>
                  <ul className={`flex flex-col ${pkg.isPopular ? 'gap-4' : 'gap-3.5'}`}>
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check size={pkg.isPopular ? 20 : 18} strokeWidth={3} className={`shrink-0 ${pkg.isPopular ? 'mt-1 text-sky-blue' : 'mt-0.5 text-sky-blue'}`} />
                        <span className={`leading-snug font-medium ${pkg.isPopular ? 'text-[16px] sm:text-[18px] text-white' : 'text-[15px] text-deep-blue/80'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const activityName = pkg.name === "Overall Package" ? "OVERALL" : "PACKAGE 2500";
                    setFormData(prev => ({ ...prev, activities: [activityName] }));
                    const el = document.getElementById("booking-section");
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full py-4 rounded-2xl text-sm font-bold tracking-wide transition-all duration-300 shadow-md hover:shadow-xl ${pkg.isPopular ? 'bg-gradient-to-r from-sky-blue to-ocean-blue hover:from-sky-blue hover:to-deep-blue text-white' : 'bg-gradient-to-r from-deep-blue to-ocean-blue hover:from-ocean-blue hover:to-sky-blue text-white'}`}>
                  Book This Package
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Gallery Section */}
      <LazySection>
        <VideoGallerySection />
      </LazySection>

      {/* Testimonials Section */}
      <section id="reviews-section" className="relative w-full flex flex-col items-center px-6 sm:px-12 py-16 lg:py-24 bg-surf-3">
        <div className="w-full max-w-4xl flex flex-col items-center text-center pb-8">
          <h2 className="text-3xl md:text-4xl lg:text-[56px] font-display text-deep-blue leading-tight mb-4 font-semibold">What Our Clients Are Saying</h2>
          <p className="text-deep-blue/70 max-w-[650px] text-sm md:text-base leading-relaxed font-semibold">Our users love how our platform simplifies their adventures</p>
        </div>
        <div 
          className="w-full relative overflow-hidden flex max-w-[1400px] [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)] touch-pan-x select-none"
          onMouseEnter={() => setIsReviewsPaused(true)}
          onMouseLeave={() => setIsReviewsPaused(false)}
          onTouchStart={() => setIsReviewsPaused(true)}
          onTouchEnd={() => setIsReviewsPaused(false)}
          onTouchCancel={() => setIsReviewsPaused(false)}
          onClick={() => setIsReviewsPaused(prev => !prev)}
        >
          <div 
            className="flex w-max animate-marquee hover:[animation-play-state:paused] active:[animation-play-state:paused] focus:[animation-play-state:paused] will-change-transform"
            style={{ animationPlayState: isReviewsPaused ? 'paused' : 'running' }}
          >
            <div className="flex gap-4 sm:gap-6 pr-4 sm:pr-6 w-max">
              {testimonials.map((testi, index) => (
                <div key={`orig-${index}`} className="w-[300px] sm:w-[320px] lg:w-[370px] shrink-0 bg-white p-5 rounded-[20px] border border-gray-100 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex gap-1 mb-2 text-amber-400">
                      <span className="text-sm">★</span>
                      <span className="text-sm">★</span>
                      <span className="text-sm">★</span>
                      <span className="text-sm">★</span>
                      <span className="text-sm">★</span>
                    </div>
                    <p className="text-[14px] leading-[1.6] font-medium text-deep-blue/80 mb-2 underline underline-offset-4 decoration-gray-300">"{testi.quote}"</p>
                  </div>
                  <p className="text-[13px] font-bold text-deep-blue/60 mt-1">- {testi.name}</p>
                </div>
              ))}
              {testimonials.map((testi, index) => (
                <div key={`dup-${index}`} className="w-[300px] sm:w-[320px] lg:w-[370px] shrink-0 bg-white p-5 rounded-[20px] border border-gray-100 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex gap-1 mb-2 text-amber-400">
                      <span className="text-sm">★</span>
                      <span className="text-sm">★</span>
                      <span className="text-sm">★</span>
                      <span className="text-sm">★</span>
                      <span className="text-sm">★</span>
                    </div>
                    <p className="text-[14px] leading-[1.6] font-medium text-deep-blue/80 mb-2 underline underline-offset-4 decoration-gray-300">"{testi.quote}"</p>
                  </div>
                  <p className="text-[13px] font-bold text-deep-blue/60 mt-1">- {testi.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Staff Section */}
      <section className="relative w-full py-16 lg:py-24 bg-white border-t border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto mb-16">
            <span className="text-sky-blue text-xs font-bold uppercase tracking-widest mb-4 inline-flex items-center gap-2 underline underline-offset-4 decoration-deep-blue decoration-2">
              <ShieldCheck size={14} className="text-sky-blue" />
              <span>Uncompromised Safety Standards</span>
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display text-deep-blue leading-tight mb-6 font-semibold sm:whitespace-nowrap">
              Our Safety commitment & <span className="text-sky-blue">Licensed Team</span>
            </h2>
            <p className="text-gray-500 font-medium text-sm md:text-base leading-relaxed">
              At Joy Water Sports Varkala, your adventure is backed by top-tier physical security guidelines, industry-inspected equipment, and highly skilled master trainers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative overflow-hidden bg-white p-8 sm:p-10 rounded-[32px] border border-gray-100 flex flex-col items-start shadow-sm hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 border border-gray-200 mb-6">
                <Award size={22} strokeWidth={2.5} />
              </div>
              <h3 className="font-serif text-deep-blue text-xl font-bold mb-3 subheader-styled">Licensed & Certified Staff</h3>
              <p className="text-gray-600 text-sm leading-relaxed font-semibold">
                Our entire operations crew holds verified life-saving licenses and international water sports credentials. Every coach is fully trained in marine navigation, sea safety protocols, and emergency first response rescue.
              </p>
            </div>

            <div className="relative overflow-hidden bg-white p-8 sm:p-10 rounded-[32px] border border-gray-100 flex flex-col items-start shadow-sm hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 border border-gray-200 mb-6">
                <ShieldCheck size={22} strokeWidth={2.5} />
              </div>
              <h3 className="font-serif text-deep-blue text-xl font-bold mb-3 subheader-styled">Certified & Audited Gear</h3>
              <p className="text-gray-600 text-sm leading-relaxed font-semibold">
                We utilize only premium brand, high-buoyancy life vests, helmets, secure safety harnesses, and marine impact shields. All boats, jet skis, and equipment undergo safety audits twice daily to ensure zero failure risks.
              </p>
            </div>

            <div className="relative overflow-hidden bg-white p-8 sm:p-10 rounded-[32px] border border-gray-100 flex flex-col items-start shadow-sm hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 border border-gray-200 mb-6">
                <Heart size={22} strokeWidth={2.5} />
              </div>
              <h3 className="font-serif text-deep-blue text-xl font-bold mb-3 subheader-styled">Compulsory Briefing & Guidance</h3>
              <p className="text-gray-600 text-sm leading-relaxed font-semibold">
                No participant goes raw. Every single activity starts with a compulsory, high-clarity safety orientation, sea-current signals briefing, and hands-on control instruction from a dedicated individual coach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking & Direct Enquiry Section */}
      <section id="booking-section" className="relative w-full flex justify-center px-4 sm:px-6 py-8 sm:py-10 bg-slate-50">
        <div className="w-full max-w-xl">
          {/* Section Header */}
          <div className="text-center mb-6">
            <span className="text-sky-blue text-xs font-bold uppercase tracking-widest mb-3 inline-block underline underline-offset-4 decoration-deep-blue decoration-2">
              BOOK YOUR ADVENTURE
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display text-deep-blue leading-tight font-semibold">
              Ready for the <span className="text-sky-blue">Experience?</span>
            </h2>
            <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed mt-2 max-w-md mx-auto">
              Fill in your details and we will secure your slot within 24 hours
            </p>
          </div>

          {/* Booking Card */}
          <div className="bg-white rounded-none shadow-lg border border-slate-200/80 overflow-hidden p-5 sm:p-6 transition-all">
            {/* Step Navigation Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5 gap-2">
              <button
                type="button"
                onClick={() => setBookingStep(1)}
                className={`flex-1 py-2.5 px-2 sm:px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  bookingStep === 1
                    ? 'border-[#004E98] text-[#004E98] bg-sky-50/60'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-black ${
                  bookingStep === 1 ? 'bg-[#004E98] text-white' : 'bg-slate-200 text-slate-600'
                }`}>1</span>
                <span>Booking Details</span>
              </button>

              <div className="w-6 sm:w-10 h-[2px] bg-slate-200 shrink-0"></div>

              <button
                type="button"
                onClick={() => {
                  if (isStep1Valid) {
                    setBookingStep(2);
                  } else {
                    handleNextStep();
                  }
                }}
                className={`flex-1 py-2.5 px-2 sm:px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  bookingStep === 2
                    ? 'border-[#004E98] text-[#004E98] bg-sky-50/60'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-black ${
                  bookingStep === 2 ? 'bg-[#004E98] text-white' : 'bg-slate-200 text-slate-600'
                }`}>2</span>
                <span>Declaration & Waiver</span>
              </button>
            </div>

            {/* RESERVATION FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* STEP 1: BOOKING DETAILS */}
              {bookingStep === 1 && (
                <div className="space-y-3.5 animate-fade-in">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 mb-2">
                    <h3 className="text-base font-bold text-[#0B1E3C] flex items-center gap-2">
                      <Ticket className="text-[#004E98]" size={18} />
                      Step 1: Reservation Details
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      STEP 1 OF 2
                    </span>
                  </div>

                  {/* Row 1: First Name & Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div id="field-firstName" className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">First Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Enter first name"
                        className={`w-full bg-slate-50/70 border ${fieldErrors.firstName ? 'border-red-500' : 'border-slate-200/90'} rounded-none px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004E98] focus:bg-white transition-all`}
                      />
                      {fieldErrors.firstName && <p className="text-[11px] text-red-500 font-medium">{fieldErrors.firstName}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Enter last name"
                        className="w-full bg-slate-50/70 border border-slate-200/90 rounded-none px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004E98] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 2: Email Address & Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div id="field-email" className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">Email Address <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                        className={`w-full bg-slate-50/70 border ${fieldErrors.email ? 'border-red-500' : 'border-slate-200/90'} rounded-none px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004E98] focus:bg-white transition-all`}
                      />
                      {fieldErrors.email && <p className="text-[11px] text-red-500 font-medium">{fieldErrors.email}</p>}
                    </div>
                    <div id="field-phone" className="space-y-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-xs font-semibold text-slate-600">Phone Number (WhatsApp) <span className="text-red-500">*</span></label>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">REQUIRED</span>
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        className={`w-full bg-slate-50/70 border ${fieldErrors.phone ? 'border-red-500' : 'border-slate-200/90'} rounded-none px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004E98] focus:bg-white transition-all`}
                      />
                      {fieldErrors.phone && <p className="text-[11px] text-red-500 font-medium">{fieldErrors.phone}</p>}
                    </div>
                  </div>

                  {/* Row 3: Date, Time Slot, Guests */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div id="field-date" className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        name="date"
                        required
                        value={formData.date}
                        onChange={handleChange}
                        className={`w-full bg-slate-50/70 border ${fieldErrors.date ? 'border-red-500' : 'border-slate-200/90'} rounded-none px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004E98] focus:bg-white transition-all cursor-pointer`}
                      />
                      {fieldErrors.date && <p className="text-[11px] text-red-500 font-medium">{fieldErrors.date}</p>}
                    </div>
                    <div id="field-time" className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">Time Slot <span className="text-red-500">*</span></label>
                      <select
                        name="time"
                        required
                        value={formData.time}
                        onChange={handleChange}
                        className={`w-full bg-slate-50/70 border ${fieldErrors.time ? 'border-red-500' : 'border-slate-200/90'} rounded-none px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004E98] focus:bg-white transition-all cursor-pointer`}
                      >
                        <option value="">Select Time</option>
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="13:00">01:00 PM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="15:00">03:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                        <option value="17:00">05:00 PM</option>
                      </select>
                      {fieldErrors.time && <p className="text-[11px] text-red-500 font-medium">{fieldErrors.time}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">Guests</label>
                      <select
                        name="guests"
                        value={formData.guests}
                        onChange={handleChange}
                        className="w-full bg-slate-50/70 border border-slate-200/90 rounded-none px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004E98] focus:bg-white transition-all cursor-pointer"
                      >
                        {[1,2,3,4,5,6,7,8,9,10,12,15,20].map(n => (
                          <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 4: Select Activities or Packages */}
                  <div id="field-activities" className="space-y-1 relative">
                    <label className="text-xs font-semibold text-slate-600 block">Select Activities or Packages <span className="text-red-500">*</span></label>
                    <button
                      type="button"
                      onClick={() => setIsActivityOpen(!isActivityOpen)}
                      className={`w-full bg-slate-50/70 border ${fieldErrors.activities ? 'border-red-500' : 'border-slate-200/90'} rounded-none px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#004E98]`}
                    >
                      <span className={formData.activities.length === 0 ? "text-slate-400 font-normal" : "text-slate-900 font-semibold truncate max-w-[90%]"}>
                        {formData.activities.length === 0 ? "Click to choose items..." : formData.activities.map(a => a === 'OVERALL' ? 'Overall Watersports Package' : a).join(", ")}
                      </span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${isActivityOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {fieldErrors.activities && <p className="text-[11px] text-red-500 font-medium">{fieldErrors.activities}</p>}

                    {/* Opened Dropdown Panel */}
                    {isActivityOpen && (
                      <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-none shadow-2xl p-2.5 pb-8 max-h-[300px] overflow-y-auto">
                        {(() => {
                          const allKeys = Object.keys(ACTIVITY_PRICES);
                          const packages = allKeys.filter(k => k === 'OVERALL' || k === 'PACKAGE 2500');
                          const individual = allKeys.filter(k => k !== 'OVERALL' && k !== 'PACKAGE 2500');
                          const sortedList = [...packages, ...individual];

                          return (
                            <>
                              {sortedList.map((activity, idx) => {
                                const price = ACTIVITY_PRICES[activity];
                                const isChecked = formData.activities.includes(activity);
                                const isPackage = activity === 'OVERALL' || activity === 'PACKAGE 2500';
                                const labelText = activity === 'OVERALL' ? 'OVERALL WATERSPORTS PACKAGE' : activity;
                                const isLastPackage = isPackage && (idx === packages.length - 1);
                                const isLastItem = idx === sortedList.length - 1;

                                return (
                                  <React.Fragment key={activity}>
                                    <label
                                      className={`flex items-center justify-between py-1.5 px-2 rounded-none hover:bg-slate-50 cursor-pointer transition-colors ${
                                        isPackage ? 'bg-sky-50/60 font-semibold' : ''
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => handleActivityToggle(activity)}
                                          className="w-4 h-4 rounded-none border-slate-300 text-[#004E98] focus:ring-[#004E98]"
                                        />
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                          {labelText}
                                          {activity === 'PACKAGE 2500' && (
                                            <span className="text-[10px] bg-[#004E98] text-white px-1.5 py-0.5 rounded-none font-sans font-semibold">
                                              BEST VALUE
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                      <span className="text-sm sm:text-base font-black text-[#004E98] font-mono">
                                        ₹{price}
                                      </span>
                                    </label>

                                    {/* Divider line below activity item */}
                                    {!isLastItem && (
                                      <div className={`border-b ${isLastPackage ? 'border-slate-300 border-b-2 my-1.5' : 'border-slate-200 my-1'}`}></div>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                              {/* Bottom spacer for clean scroll clearance */}
                              <div className="h-6"></div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Row 5: Total Calculated Amount */}
                  <div className="space-y-1 pt-0.5">
                    <label className="text-xs font-semibold text-slate-600 block">Total Calculated Amount</label>
                    <div className="bg-[#F0F5FA] border border-sky-100 rounded-none px-4 py-2.5 flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-slate-600">
                        Total Bill for {formData.guests || 1} guest(s)
                      </span>
                      <span className="text-lg sm:text-xl font-black text-[#004E98] font-mono">
                        ₹{totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Row 6: Message (Optional) */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 block">Message</label>
                    <input
                      type="text"
                      name="specialRequest"
                      value={formData.specialRequest}
                      onChange={handleChange}
                      placeholder="Type your message here..."
                      className="w-full bg-slate-50/70 border border-slate-200/90 rounded-none px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004E98] focus:bg-white transition-all"
                    />
                  </div>

                  {/* STEP 1 NEXT CTA BUTTON */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full py-3.5 bg-[#0B1E3C] hover:bg-[#002855] text-white font-bold text-sm rounded-none shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Next: Declaration & Liability Release</span>
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DECLARATION & LIABILITY RELEASE */}
              {bookingStep === 2 && (
                <div className="space-y-3.5 animate-fade-in">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 mb-2">
                    <h3 className="text-base font-bold text-[#0B1E3C] flex items-center gap-2">
                      <ShieldCheck className="text-[#004E98]" size={20} />
                      Step 2: Participant Declaration & Waiver
                    </h3>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 uppercase tracking-wider">
                      STEP 2 OF 2
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Please fill in participant contact details and provide your digital signature below to complete your booking.
                  </p>

                  {/* Declaration Input Fields */}
                  <div className="space-y-3.5 bg-slate-50/80 p-4 border border-slate-200 rounded-none">
                    {/* Guest Name in Declaration */}
                    <div id="field-guestName" className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Participant Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={declarationData.guestName}
                        onChange={(e) => setDeclarationData(prev => ({ ...prev, guestName: e.target.value }))}
                        placeholder={`${formData.firstName} ${formData.lastName}`.trim() || "Enter participant full name"}
                        className={`w-full bg-white border ${fieldErrors.guestName ? 'border-red-500' : 'border-slate-300'} rounded-none px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004E98] transition-all`}
                      />
                      {fieldErrors.guestName && <p className="text-[11px] text-red-500 font-medium">{fieldErrors.guestName}</p>}
                    </div>

                    {/* Communication Address */}
                    <div id="field-communicationAddress" className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Communication Address <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={declarationData.communicationAddress}
                        onChange={(e) => setDeclarationData(prev => ({ ...prev, communicationAddress: e.target.value }))}
                        placeholder="Enter residential address (optional)"
                        className={`w-full bg-white border ${fieldErrors.communicationAddress ? 'border-red-500' : 'border-slate-300'} rounded-none px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004E98] transition-all`}
                      />
                      {fieldErrors.communicationAddress && <p className="text-[11px] text-red-500 font-medium">{fieldErrors.communicationAddress}</p>}
                    </div>

                    {/* Minor Checkbox */}
                    <div className="pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={declarationData.hasGuardian}
                          onChange={(e) => setDeclarationData(prev => ({ ...prev, hasGuardian: e.target.checked }))}
                          className="w-4 h-4 rounded-none text-[#004E98] focus:ring-[#004E98]"
                        />
                        <span className="text-xs font-medium text-slate-700">
                          Participant is a minor (under 18 years) — Parent/Guardian details required
                        </span>
                      </label>
                    </div>

                    {/* Guardian Section if Minor */}
                    {declarationData.hasGuardian && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 space-y-3 mt-2">
                        <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Parent / Guardian Information</p>
                        
                        <div id="field-guardianName" className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 block">Guardian Full Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={declarationData.guardianName}
                            onChange={(e) => setDeclarationData(prev => ({ ...prev, guardianName: e.target.value }))}
                            placeholder="Parent or legal guardian name"
                            className="w-full bg-white border border-slate-300 rounded-none px-3 py-1.5 text-xs text-slate-900"
                          />
                          {fieldErrors.guardianName && <p className="text-[11px] text-red-500 font-medium">{fieldErrors.guardianName}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 block">Guardian Phone</label>
                            <input
                              type="tel"
                              value={declarationData.guardianPhone}
                              onChange={(e) => setDeclarationData(prev => ({ ...prev, guardianPhone: e.target.value }))}
                              placeholder="Phone number"
                              className="w-full bg-white border border-slate-300 rounded-none px-3 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 block">Guardian Email</label>
                            <input
                              type="email"
                              value={declarationData.guardianEmail}
                              onChange={(e) => setDeclarationData(prev => ({ ...prev, guardianEmail: e.target.value }))}
                              placeholder="Email address"
                              className="w-full bg-white border border-slate-300 rounded-none px-3 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                        </div>

                        <div id="field-guardianSignature" className="space-y-1 pt-1">
                          <label className="text-xs font-semibold text-slate-700 block">Guardian Digital Signature <span className="text-red-500">*</span></label>
                          <SignaturePad
                            value={declarationData.guardianSignature}
                            onChange={(sig) => setDeclarationData(prev => ({ ...prev, guardianSignature: sig }))}
                            label="Guardian Signature"
                          />
                          {fieldErrors.guardianSignature && <p className="text-[11px] text-red-500 font-medium">{fieldErrors.guardianSignature}</p>}
                        </div>
                      </div>
                    )}

                    {/* Guest Signature Pad */}
                    <div id="field-signature" className="space-y-1 pt-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Participant Digital Signature <span className="text-red-500">*</span>
                      </label>
                      <SignaturePad
                        value={declarationData.signature}
                        onChange={(sig) => setDeclarationData(prev => ({ ...prev, signature: sig }))}
                        label="Participant Signature"
                      />
                      {fieldErrors.signature && <p className="text-[11px] text-red-500 font-medium">{fieldErrors.signature}</p>}
                    </div>

                    {/* Legal Terms Text Scroll Box */}
                    <div className="mt-3 p-3 bg-white border border-slate-200 text-[11px] text-slate-600 leading-relaxed max-h-36 overflow-y-auto space-y-2">
                      <p className="font-bold text-slate-800 uppercase">Participant Declaration & Assumption of Risk</p>
                      <p>
                        I hereby acknowledge and agree that participation in water sports and aquatic activities involves inherent risks, including but not limited to changing weather conditions, equipment operation, water currents, and physical exertion.
                      </p>
                      <p>
                        I confirm that I am physically fit and capable of participating in the chosen activities, and I agree to strictly abide by all safety instructions, wear life safety equipment at all times, and follow the guidance of certified instructors and crew members.
                      </p>
                      <p>
                        I voluntarily assume all risks associated with participation and hereby release Chennai Watersports, its employees, instructors, and affiliates from liability for personal injury, property loss, or damage occurring during or arising out of the activity, except where caused by gross negligence.
                      </p>
                    </div>

                    {/* Agreement Checkbox */}
                    <div id="field-declarationAgreed" className="pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={declarationData.declarationAgreed}
                          onChange={(e) => setDeclarationData(prev => ({ ...prev, declarationAgreed: e.target.checked }))}
                          className="w-4 h-4 mt-0.5 rounded-none text-[#004E98] focus:ring-[#004E98] shrink-0"
                        />
                        <span className="text-xs text-slate-700 font-semibold leading-tight">
                          I have read, understood, and agree to the participant declaration, safety regulations, and liability release terms. <span className="text-red-500">*</span>
                        </span>
                      </label>
                      {fieldErrors.declarationAgreed && <p className="text-[11px] text-red-500 font-medium mt-1">{fieldErrors.declarationAgreed}</p>}
                    </div>
                  </div>

                  {/* Navigation Buttons: Back & Submit */}
                  <div className="pt-3 flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-none transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
                    >
                      <ArrowLeft size={16} /> Back to Details
                    </button>

                    <button
                      type="submit"
                      disabled={!isFormValid || status === "loading"}
                      className="flex-1 py-3.5 bg-[#0B1E3C] hover:bg-[#002855] text-white font-bold text-xs sm:text-sm rounded-none shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {status === "loading" ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Submitting Booking & Declaration...
                        </span>
                      ) : (
                        <>
                          <Send size={16} /> Submit Booking & Declaration
                        </>
                      )}
                    </button>
                  </div>
                  {!isFormValid && (
                    <p className="text-[11px] text-slate-400 text-center mt-1 font-medium">
                      * Please complete all required declaration details and digital signature to submit.
                    </p>
                  )}
                </div>
              )}

              {errorMessage && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-none text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Popup Confirmation Modal on Form Submit - Minimalist Design */}
      {showContactPopup && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            setShowContactPopup(false);
            setEnquiryMessage('');
          }}
        >
          <div 
            className="w-full max-w-[400px] bg-white rounded-[18px] shadow-[0_30px_60px_-20px_rgba(16,34,31,0.25)] overflow-hidden relative border border-slate-100 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              type="button"
              className="absolute top-[18px] right-[18px] w-7 h-7 rounded-full border-none bg-transparent text-[#6b7280] hover:bg-[#e5e7eb] text-base cursor-pointer flex items-center justify-center transition-colors z-10" 
              aria-label="Close"
              onClick={() => {
                setShowContactPopup(false);
                setEnquiryMessage('');
              }}
            >
              ✕
            </button>

            {/* Header Section */}
            <div className="p-[28px_32px_18px] text-center">
              <div className="w-9 h-9 mx-auto mb-3.5 relative">
                <svg viewBox="0 0 42 42" className="w-full h-full block">
                  <circle cx="21" cy="21" r="19" className="fill-none stroke-[#16a34a] stroke-[1.4]" />
                  <path d="M13 21.5 L18.5 27 L29 15" className="fill-none stroke-[#16a34a] stroke-[2.4] stroke-round stroke-linejoin-round" />
                </svg>
              </div>
              <p className="text-[11px] tracking-[0.14em] uppercase text-[#0ea5e9] font-semibold m-0 mb-1.5">Reservation</p>
              <h1 className="text-[22px] font-semibold text-[#111111] m-0 mb-2 tracking-[-0.01em]">Booking confirmed</h1>
              <p className="text-[13.5px] text-[#6b7280] leading-[1.5] m-0">We&apos;ll be in touch shortly to confirm your slot.</p>
            </div>

            {/* Banner Call Out */}
            <div className="mx-8 mb-5 p-[9px_12px] rounded-[10px] bg-[#e6f6fd] border border-[#bde8f8] flex items-center gap-2.5 text-left">
              <div className="shrink-0 w-[26px] h-[26px] rounded-full bg-white flex items-center justify-center shadow-xs">
                <svg viewBox="0 0 24 24" className="w-[13px] h-[13px]">
                  <path d="M6.6 10.8c1.2 2.4 3.2 4.4 5.6 5.6l1.9-1.9c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1v3.1c0 .6-.4 1-1 1C10.9 20 4 13.1 4 4.6c0-.6.4-1 1-1h3.1c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.3 0 .7-.2 1L6.6 10.8Z" className="fill-none stroke-[#0ea5e9] stroke-2 stroke-round stroke-linejoin-round" />
                </svg>
              </div>
              <div className="banner-text text-[11.5px] leading-[1.35] text-[#111111]">
                <p className="m-0"><strong className="font-semibold text-[#111111]">Our team will call you shortly</strong><br />to confirm your slot and answer any questions.</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-[#e5e7eb] mx-8"></div>

            {/* Booking Details Table */}
            {submittedEnquiry && (
              <dl className="m-0 p-[16px_32px_4px]">
                <div className="flex justify-between items-baseline py-[7px] border-b border-[#e5e7eb] gap-4">
                  <dt className="text-[12.5px] text-[#6b7280] whitespace-nowrap">Booking reference</dt>
                  <dd className="m-0 text-[13.5px] font-semibold text-[#0ea5e9] text-right font-mono">{submittedEnquiry.bookingId}</dd>
                </div>
                <div className="flex justify-between items-baseline py-[7px] border-b border-[#e5e7eb] gap-4">
                  <dt className="text-[12.5px] text-[#6b7280] whitespace-nowrap">Guest name</dt>
                  <dd className="m-0 text-[13.5px] font-semibold text-[#111111] text-right">{submittedEnquiry.firstName} {submittedEnquiry.lastName}</dd>
                </div>
                <div className="flex justify-between items-baseline py-[7px] border-b border-[#e5e7eb] gap-4">
                  <dt className="text-[12.5px] text-[#6b7280] whitespace-nowrap">Mobile number</dt>
                  <dd className="m-0 text-[13.5px] font-semibold text-[#111111] text-right">{submittedEnquiry.phone}</dd>
                </div>
                <div className="flex justify-between items-baseline py-[7px] border-b border-[#e5e7eb] gap-4">
                  <dt className="text-[12.5px] text-[#6b7280] whitespace-nowrap">Date &amp; time</dt>
                  <dd className="m-0 text-[13.5px] font-semibold text-[#111111] text-right">{submittedEnquiry.date}, {submittedEnquiry.time}</dd>
                </div>
                <div className="flex justify-between items-baseline py-[7px] border-b border-[#e5e7eb] gap-4">
                  <dt className="text-[12.5px] text-[#6b7280] whitespace-nowrap">Activities ({submittedEnquiry.guests} guest{submittedEnquiry.guests > 1 ? 's' : ''})</dt>
                  <dd className="m-0 text-[13.5px] font-semibold text-[#0ea5e9] text-right max-w-[180px] truncate">{submittedEnquiry.activities?.join(', ')}</dd>
                </div>
                <div className="flex justify-between items-baseline py-[7px] border-b-0 gap-4">
                  <dt className="text-[12.5px] text-[#6b7280] whitespace-nowrap">Total bill</dt>
                  <dd className="m-0 text-[15px] font-bold text-[#111111] text-right">₹{submittedEnquiry.totalAmount?.toLocaleString('en-IN')}</dd>
                </div>
              </dl>
            )}

            {/* Footer Section */}
            <div className="p-[16px_32px_24px] space-y-2.5">
              <button 
                type="button"
                className="w-full p-[11px] rounded-[10px] border border-[#e5e7eb] bg-white text-[#111111] text-[13.5px] font-semibold cursor-pointer transition-all hover:bg-[#e6f6fd] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"
                onClick={() => {
                  setShowContactPopup(false);
                  setEnquiryMessage('');
                }}
              >
                Done
              </button>
              <p className="text-center text-[11px] text-[#6b7280] m-0 pt-0.5">A confirmation will follow on your registered number.</p>
            </div>
          </div>
        </div>
      )}





      {/* Customer Account & Ticket Status Modal */}
      {isLookupOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in-backdrop">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative p-6 sm:p-8 space-y-5 max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => setIsLookupOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer z-10"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-3 bg-sky-100 text-[#004E98] rounded-2xl shadow-xs">
                <Ticket size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">My Account &amp; Ticket Status</h3>
                <p className="text-xs text-slate-500 font-medium">View active tickets, check payment status &amp; boarding passes</p>
              </div>
            </div>



            {/* Search Input Bar */}
            <form onSubmit={handleLookupSubmit} className="space-y-2 shrink-0">
              <label className="text-xs font-bold text-slate-700 block">Search Ticket by Phone Number or Ticket ID</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    value={lookupInput}
                    onChange={(e) => setLookupInput(e.target.value)}
                    placeholder="Enter Phone e.g. 9876543210 or Ticket ID (JWS-1002)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-[#004E98] focus:ring-4 focus:ring-[#004E98]/10 transition-all font-medium text-slate-900"
                  />
                  <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                </div>
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="bg-[#004E98] hover:bg-[#003B73] text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                >
                  {lookupLoading ? 'Searching...' : <>Search</>}
                </button>
              </div>
            </form>

            {/* Error Message */}
            {lookupError && (
              <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-2xl text-rose-700 text-xs font-semibold shrink-0">
                {lookupError}
              </div>
            )}

            {/* Lookup Results */}
            {lookupResults && (
              <div className="space-y-3.5 pt-1 overflow-y-auto pr-1 flex-1">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Found {lookupResults.length} Ticket(s)
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Updated live
                  </span>
                </div>

                {lookupResults.map((b: any) => {
                  const isVerified = b.ticketStatus === 'VERIFIED' || b.ticketStatus === 'CONFIRMED';
                  const isCancelled = b.ticketStatus === 'CANCELLED';

                  return (
                    <div key={b.id} className="p-4 bg-slate-50/90 border border-slate-200/90 rounded-2xl space-y-3 hover:border-slate-300 transition-all shadow-2xs">
                      {/* Top Bar: ID + Status Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black font-mono bg-[#004E98]/10 text-[#004E98] px-2.5 py-1 rounded-lg">
                            #{b.id}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                            b.remainingDue === 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {b.remainingDue === 0 ? 'PAID IN FULL' : `DUE ₹${b.remainingDue}`}
                          </span>
                        </div>

                        {/* Ticket Check-in Status */}
                        <div>
                          {isVerified ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                              <CheckCircle size={12} /> CONFIRMED &amp; READY
                            </span>
                          ) : isCancelled ? (
                            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                              <AlertCircle size={12} /> CANCELLED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                              <Clock size={12} /> PENDING CHECK-IN
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Customer Info & Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase">Customer</p>
                          <p className="font-bold text-slate-900">{b.firstName} {b.lastName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase">Date &amp; Slot</p>
                          <p className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                            <Calendar size={12} className="text-[#004E98]" /> {b.date} @ {formatTime(b.time)}
                          </p>
                        </div>
                      </div>

                      {/* Activities & Guests */}
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Booked Activities</span>
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <Users size={12} className="text-[#004E98]" /> {b.guests} Person(s)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.isArray(b.activities) && b.activities.length > 0 ? (
                            b.activities.map((act: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-sky-50 text-[#004E98] border border-sky-100 rounded-md text-[11px] font-bold">
                                {act}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-600 font-medium">Standard Water Sports Package</span>
                          )}
                        </div>
                      </div>

                      {/* Payment Breakdown & Action Button */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-xs">
                          <span className="text-[10px] text-slate-400 block font-semibold">Total Price</span>
                          <span className="font-extrabold text-slate-900">₹{b.totalAmount}</span>
                          <span className="text-[10px] text-slate-500 ml-1.5">(Adv: ₹{b.advancePaid})</span>
                        </div>

                        <Link
                          to={`/ticket/${b.id}`}
                          onClick={() => setIsLookupOpen(false)}
                          className="bg-[#004E98] hover:bg-[#003B73] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                          View Ticket Pass <ExternalLink size={13} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
