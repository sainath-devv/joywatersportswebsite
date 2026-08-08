import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, RotateCcw, FileText, Check, Download, Loader2, MessageSquare, AlertCircle, ShieldCheck, UserCheck, Users, Calendar, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatSafeErrorMessage } from '../lib/errorHandler';
import SEOHead, { createBreadcrumbSchema, joyWaterSportsBusinessSchema } from '../components/common/SEOHead';

const GoogleTranslateIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
  </svg>
);

type LanguageKey = 'en' | 'ml' | 'te' | 'ta' | 'hi' | 'bn';

interface Translations {
  title: string;
  subtitle: string;
  location: string;
  selectLanguage: string;
  printForm: string;
  backToHome: string;
  submittedSuccessTitle: string;
  submittedSuccessMsg: (name: string) => string;
  printCompleted: string;
  returnHome: string;
  errName: string;
  errPhone: string;
  errSig: string;
  errConfirmation: string;
  terms: string[];
  guestDetailsHeader: string;
  totalGuestsLabel: string;
  totalGuestsSubtitle: string;
  guestListHeader: string;
  guestNumberLabel: (n: number) => string;
  ageLabel: string;
  agePlaceholder: string;
  guestNameLabel: string;
  guestNamePlaceholder: string;
  primaryContactHeader: string;
  primaryContactSubtitle: string;
  commAddressLabel: string;
  commAddressPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  activitiesHeader: string;
  applyToAllGuestsLabel: string;
  customizePerGuestLabel: string;
  finalDeclarationHeader: string;
  finalDeclarationText: string;
  finalDeclarationCheckboxLabel: string;
  guestSigLabel: string;
  signForGroupLabel: string;
  individualSignaturesLabel: string;
  dateLabel: string;
  summaryHeader: string;
  guardianHeader: string;
  guardianNote: string;
  guardianNameLabel: string;
  guardianNamePlaceholder: string;
  guardianAddressPlaceholder: string;
  guardianPhonePlaceholder: string;
  guardianSigLabel: string;
  dateOfSailingLabel: string;
  invoiceNoLabel: string;
  boardingPassNoLabel: string;
  tripTimeLabel: (n: number) => string;
  trip1Placeholder: string;
  trip2Placeholder: string;
  boatLabel: string;
  submitBtn: string;
  submittingBtn: string;
  footerNotice: string;
  sendWhatsappBtn: string;
  startNewBtn: string;
}

const languages: { key: LanguageKey; label: string; nativeName: string }[] = [
  { key: 'en', label: 'English', nativeName: 'English' },
  { key: 'ml', label: 'Malayalam', nativeName: 'മലയാളം' },
  { key: 'te', label: 'Telugu', nativeName: 'తెలుగు' },
  { key: 'ta', label: 'Tamil', nativeName: 'தமிழ்' },
  { key: 'hi', label: 'Hindi', nativeName: 'हिंदी' },
  { key: 'bn', label: 'Bengali', nativeName: 'বাংলা' },
];

const DECLARATION_ACTIVITIES = [
  'Parasailing',
  'Speed Boat',
  'Banana Boat',
  'Crazy Sofa',
  'ATV',
  'Flying Fish',
  'Jet Ski'
];

const translations: Record<LanguageKey, Translations> = {
  en: {
    title: "JOY WATER SPORTS",
    subtitle: "WATER SPORTS LIABILITY WAIVER AGREEMENT",
    location: "Varkala Beach, Kerala • Digital Legal Declaration",
    selectLanguage: "Preferred Language",
    printForm: "Print Form",
    backToHome: "Back to Home",
    submittedSuccessTitle: "Liability Waiver & Declaration Submitted Successfully!",
    submittedSuccessMsg: (name) => `Thank you, ${name}. Your liability waiver and declaration agreement has been recorded successfully.`,
    printCompleted: "Print Completed Copy",
    returnHome: "Return to Home Page",
    errName: "Please enter Full Name for Guest 1.",
    errPhone: "Please enter Primary Contact Telephone / Mobile Number.",
    errSig: "Please provide Guest Signature before submitting.",
    errConfirmation: "Please check the confirmation checkbox agreeing to the declaration terms.",
    terms: [
      "I certify that I am fully aware of the risks involved in the activity and I have been briefed about the safety procedures.",
      "I'm aware about the DO's and Don'ts, medical restrictions and local govt. regulations.",
      "I state that I am physically fit to undertake the activity and not suffering from any heart problem, blood pressure, asthma or any other serious medical problem.",
      "I further state that I am lawfully age and legally competent to sign this liability release agreement or that I have obtained the written consent of my parent or guardian.",
      "I understand and agree that neither JOY WATER SPORTS or its affiliates or subsidiary corporations, nor the owners, employees, agent's contractors may be held liable or responsible in anyway for any injury, death or other damages to me.",
      "I understand that terms herein are contractual and not mere recital and that I have signed this agreement of my own free act with the knowledge that hereby I agree to waive my legal rights.",
      "I expressly agree and promise to accept and assume all of the risks existing in this activity. My participation in this activity is purely voluntary, and I elect to participate in spite of the risks.",
      "Indemnity: I (or my representative) agree to protect and compensate the company against any costs or damages resulting from my negligence or misrepresentation."
    ],
    guestDetailsHeader: "GUEST / PARTICIPANT DETAILS",
    totalGuestsLabel: "TOTAL NUMBER OF GUESTS",
    totalGuestsSubtitle: "Select how many guests are participating in this trip.",
    guestListHeader: "Participant Name & Age List",
    guestNumberLabel: (n) => `Guest ${n}`,
    ageLabel: "Age",
    agePlaceholder: "Age",
    guestNameLabel: "Full Name",
    guestNamePlaceholder: "Enter full participant name",
    primaryContactHeader: "PRIMARY CONTACT DETAILS",
    primaryContactSubtitle: "This person will be the primary contact for this booking.",
    commAddressLabel: "Full Communication Address",
    commAddressPlaceholder: "Enter full communication address",
    phoneLabel: "Mobile Number",
    phonePlaceholder: "+91 98765 43210",
    emailLabel: "Email Address",
    emailPlaceholder: "guest@example.com",
    activitiesHeader: "PARTICIPATING WATER SPORTS ACTIVITIES",
    applyToAllGuestsLabel: "Apply selected activities to all guests",
    customizePerGuestLabel: "Customize activities per participant",
    finalDeclarationHeader: "FINAL DECLARATION",
    finalDeclarationText: "I confirm that the information provided above is accurate and that I have read, understood, and agreed to the safety and liability terms stated in this declaration.",
    finalDeclarationCheckboxLabel: "I confirm and agree to the above declaration.",
    guestSigLabel: "GUEST SIGNATURE",
    signForGroupLabel: "Primary guest signs on behalf of all participants",
    individualSignaturesLabel: "Collect individual participant signatures",
    dateLabel: "Date",
    summaryHeader: "DECLARATION SUMMARY",
    guardianHeader: "GUARDIAN DETAILS (FOR MINORS UNDER 18)",
    guardianNote: "In case of children or minors under 18 years, the Guardian must provide consent and details below:",
    guardianNameLabel: "Guardian Full Name",
    guardianNamePlaceholder: "Guardian full name",
    guardianAddressPlaceholder: "Guardian communication address",
    guardianPhonePlaceholder: "Guardian contact number",
    guardianSigLabel: "Guardian Signature",
    dateOfSailingLabel: "Date of sailing :",
    invoiceNoLabel: "Invoice No :",
    boardingPassNoLabel: "Boarding Pass No :",
    tripTimeLabel: (n) => `Trip ${n} Time :`,
    trip1Placeholder: "e.g. 10:00 AM",
    trip2Placeholder: "e.g. 11:30 AM",
    boatLabel: "Boat :",
    submitBtn: "Submit Waiver",
    submittingBtn: "Submitting...",
    footerNotice: "By clicking Submit Waiver, you acknowledge that all information provided is accurate and legally binding.",
    sendWhatsappBtn: "Send Confirmation via WhatsApp",
    startNewBtn: "Start New Declaration"
  },
  ml: {
    title: "ജോയ് വാട്ടർ സ്പോർട്സ്",
    subtitle: "വാട്ടർ സ്പോർട്സ് ബാധ്യത ഒഴിവാക്കൽ കരാർ",
    location: "വർക്കല ബീച്ച്, കേരളം • ഡിജിറ്റൽ ലീഗൽ ഡിക്ലറേഷൻ",
    selectLanguage: "താല്പര്യമുള്ള ഭാഷ",
    printForm: "ഫോം പ്രിൻ്റ് ചെയ്യുക",
    backToHome: "ഹോമിലേക്ക് മടങ്ങുക",
    submittedSuccessTitle: "ബാധ്യതാ നിരാകരണ ഫോം വിജയകരമായി സമർപ്പിച്ചു!",
    submittedSuccessMsg: (name) => `നന്ദി, ${name}. നിങ്ങളുടെ ബാധ്യതാ കരാർ വിജയകരമായി രേഖപ്പെടുത്തിയിട്ടുണ്ട്.`,
    printCompleted: "പൂർത്തിയാക്കിയ കോപ്പി പ്രിൻ്റ് ചെയ്യുക",
    returnHome: "ഹോം പേജിലേക്ക് മടങ്ങുക",
    errName: "ദയവായി ഗസ്റ്റ് 1-ൻ്റെ പേര് നൽകുക.",
    errPhone: "ദയവായി പ്രൈമറി കോൺടാക്റ്റ് ഫോൺ നമ്പർ നൽകുക.",
    errSig: "സമർപ്പിക്കുന്നതിന് മുൻപ് ഒപ്പ് നൽകുക.",
    errConfirmation: "ഡിക്ലറേഷൻ വ്യവസ്ഥകൾ അംഗീകരിക്കുന്ന ചെക്ക്ബോക്സ് തിരഞ്ഞെടുക്കുക.",
    terms: [
      "ഈ പ്രവർത്തനത്തിൽ ഉൾപ്പെട്ടിരിക്കുന്ന അപകടസാധ്യതകളെക്കുറിച്ച് എനിക്ക് പൂർണ്ണ ബോധ്യമുണ്ടെന്നും സുരക്ഷാ നടപടികളെക്കുറിച്ച് എന്നെ വിശദീകരിച്ചിട്ടുണ്ടെന്നും ഞാൻ സാക്ഷ്യപ്പെടുത്തുന്നു.",
      "ചെയ്യേണ്ടതും ചെയ്യരുതാത്തതുമായ കാര്യങ്ങൾ, മെഡിക്കൽ നിയന്ത്രണങ്ങൾ, പ്രാദേശിക സർക്കാർ നിയമങ്ങൾ എന്നിവയെക്കുറിച്ച് ഞാൻ ബോധവാനാണ്.",
      "ഈ പ്രവർത്തനത്തിൽ ഏർപ്പെടാൻ ഞാൻ ശാരീരികമായി പ്രാപ്തനാണെന്നും ഹൃദയസംബന്ധമായ പ്രശ്നങ്ങൾ, രക്തസമ്മർദ്ദം, ആസ്ത്മ അല്ലെങ്കിൽ മറ്റ് ഗുരുതരമായ ആരോഗ്യപ്രശ്നങ്ങൾ എന്നിവയൊന്നുമില്ലെന്നും ഞാൻ വ്യക്തമാക്കുന്നു.",
      "ഈ ബാധ്യതാ നിരാകരണ കരാറിൽ ഒപ്പിടാൻ എനിക്ക് നിയമപരമായ പ്രായമുണ്ടെന്നും യോഗ്യതയുണ്ടെന്നും അല്ലെങ്കിൽ എൻ്റെ മാതാപിതാക്കളുടെയോ രക്ഷിതാവിൻ്റെയോ എഴുതി തയ്യാറാക്കിയ സമ്മതം എനിക്ക് ലഭിച്ചിട്ടുണ്ടെന്നും ഞാൻ വ്യക്തമാക്കുന്നു.",
      "എനിക്കുണ്ടാകുന്ന ഏതെങ്കിലും തരത്തിലുള്ള പരിക്കുകൾ, മരണം അല്ലെങ്കിൽ മറ്റ് നാശനഷ്ടങ്ങൾക്ക് ജോയ് വാട്ടർ സ്പോർട്സോ അതിൻ്റെ ജീവനക്കാരോ ഉടമസ്ഥരോ ഉത്തരവാദികളായിരിക്കില്ല എന്ന് ഞാൻ മനസ്സിലാക്കുകയും അംഗീകരിക്കുകയും ചെയ്യുന്നു.",
      "ഇതിലെ വ്യവസ്ഥകൾ കരാറടിസ്ഥാനത്തിലുള്ളതാണെന്നും എൻ്റെ സ്വന്തം ഇഷ്ടപ്രകാരമാണ് ഞാൻ ഇതിൽ ഒപ്പിടുന്നതെന്നും ഞാൻ എൻ്റെ നിയമപരമായ അവകാശങ്ങൾ ഉപേക്ഷിക്കാൻ തയാറാണെന്നും ഞാൻ മനസ്സിലാക്കുന്നു.",
      "ഈ പ്രവർത്തനത്തിൽ നിലനിൽക്കുന്ന എല്ലാ അപകടസാധ്യതകളും സ്വീകരിക്കാനും ഏറ്റെടുക്കാനും ഞാൻ വ്യക്തമായി സമ്മതിക്കുന്നു. എൻ്റെ പങ്കാളിത്തം തികച്ചും സ്വമേധയാ ഉള്ളതാണ്.",
      "നഷ്ടപരിഹാരം: എൻ്റെ അശ്രദ്ധയോ തെറ്റായ വിവരങ്ങളോ മൂലം ഉണ്ടാകുന്ന ചെലവുകളിൽ നിന്നോ നാശനഷ്ടങ്ങളിൽ നിന്നോ കമ്പനിയെ സംരക്ഷിക്കാനും നഷ്ടപരിഹാരം നൽകാനും ഞാൻ സമ്മതിക്കുന്നു."
    ],
    guestDetailsHeader: "പങ്കെടുക്കുന്നവരുടെ വിവരങ്ങൾ",
    totalGuestsLabel: "ആകെ അതിഥികളുടെ എണ്ണം",
    totalGuestsSubtitle: "ഈ യാത്രയിൽ പങ്കെടുക്കുന്ന അതിഥികളുടെ എണ്ണം തിരഞ്ഞെടുക്കുക.",
    guestListHeader: "പങ്കെടുക്കുന്നവരുടെ പേരും വയസ്സും",
    guestNumberLabel: (n) => `അതിഥി ${n}`,
    ageLabel: "വയസ്സ്",
    agePlaceholder: "വയസ്സ്",
    guestNameLabel: "മുഴുവൻ പേര്",
    guestNamePlaceholder: "അതിഥിയുടെ മുഴുവൻ പേര് നൽകുക",
    primaryContactHeader: "പ്രൈമറി കോൺടാക്റ്റ് വിവരങ്ങൾ",
    primaryContactSubtitle: "ഈ ബുക്കിംഗിന്റെ പ്രധാന ബന്ധപ്പെടേണ്ട വ്യക്തിയായിരിക്കും ഇത്.",
    commAddressLabel: "മുഴുവൻ വിലാസം",
    commAddressPlaceholder: "വിലാസം നൽകുക",
    phoneLabel: "മൊബൈൽ നമ്പർ",
    phonePlaceholder: "+91 98765 43210",
    emailLabel: "ഇമെയിൽ വിലാസം",
    emailPlaceholder: "guest@example.com",
    activitiesHeader: "പങ്കെടുക്കുന്ന വാട്ടർ സ്പോർട്സ് ഇനങ്ങൾ",
    applyToAllGuestsLabel: "തിരഞ്ഞെടുത്ത ഇനങ്ങൾ എല്ലാ അതിഥികൾക്കും ബാധകമാക്കുക",
    customizePerGuestLabel: "ഓരോ വ്യക്തിക്കും പ്രത്യേകം തിരഞ്ഞെടുക്കുക",
    finalDeclarationHeader: "അന്തിമ ഉറപ്പ്",
    finalDeclarationText: "മുകളിൽ നൽകിയിട്ടുള്ള വിവരങ്ങൾ കൃത്യമാണെന്നും സുരക്ഷാ, ബാധ്യതാ നിബന്ധനകൾ ഞാൻ വായിച്ചു മനസ്സിലാക്കി അംഗീകരിക്കുന്നുവെന്നും ഉറപ്പുനൽകുന്നു.",
    finalDeclarationCheckboxLabel: "ഞാൻ മുകളിലുള്ള ഡിക്ലറേഷൻ ഉറപ്പാക്കുകയും അംഗീകരിക്കുകയും ചെയ്യുന്നു.",
    guestSigLabel: "അതിഥിയുടെ ഒപ്പ്",
    signForGroupLabel: "പ്രധാന അതിഥി ഗ്രൂപ്പിന് വേണ്ടി ഒപ്പിടുന്നു",
    individualSignaturesLabel: "ഓരോരുത്തരും വെവ്വേറെ ഒപ്പിടുക",
    dateLabel: "തീയതി",
    summaryHeader: "ഡിക്ലറേഷൻ സംഗ്രഹം",
    guardianHeader: "രക്ഷിതാവിൻ്റെ വിവരങ്ങൾ (18 വയസ്സിന് താഴെയുള്ളവർക്ക്)",
    guardianNote: "18 വയസ്സിൽ താഴെയുള്ള കുട്ടികൾക്ക് രക്ഷിതാവിൻ്റെ വിവരങ്ങൾ നൽകണം-",
    guardianNameLabel: "രക്ഷിതാവിൻ്റെ പേര്",
    guardianNamePlaceholder: "രക്ഷിതാവിൻ്റെ മുഴുവൻ പേര്",
    guardianAddressPlaceholder: "രക്ഷിതാവിൻ്റെ വിലാസം",
    guardianPhonePlaceholder: "രക്ഷിതാവിൻ്റെ ഫോൺ നമ്പർ",
    guardianSigLabel: "രക്ഷിതാവിൻ്റെ ഒപ്പ്",
    dateOfSailingLabel: "യാത്രാ തീയതി :",
    invoiceNoLabel: "ഇൻവോയ്സ് നമ്പർ :",
    boardingPassNoLabel: "ബോർഡിംഗ് പാസ് നമ്പർ :",
    tripTimeLabel: (n) => `ട്രിപ്പ് ${n} സമയം :`,
    trip1Placeholder: "ഉദാ: 10:00 AM",
    trip2Placeholder: "ഉദാ: 11:30 AM",
    boatLabel: "ബോട്ട് :",
    submitBtn: "ഡെക്ലറേഷൻ സമർപ്പിക്കുക",
    submittingBtn: "സമർപ്പിക്കുന്നു...",
    footerNotice: "സമർപ്പിക്കുക ബട്ടൺ ക്ലിക്കുചെയ്യുന്നതിലൂടെ വിവരങ്ങൾ കൃത്യവും നിയമപരവുമാണെന്ന് നിങ്ങൾ അംഗീകരിക്കുന്നു.",
    sendWhatsappBtn: "വാട്സ്ആപ്പിൽ കൺഫർമേഷൻ അയക്കുക",
    startNewBtn: "പുതിയ ഡിക്ലറേഷൻ ഫോം"
  },
  ta: {
    title: "ஜாய் வாட்டர் ஸ்போர்ட்ஸ்",
    subtitle: "வாட்டர் ஸ்போர்ட்ஸ் பொறுப்புத் துறப்பு ஒப்பந்தம்",
    location: "வர்க்கலா பீச், கேரளா • டிஜிட்டல் சட்ட அறிவிப்பு",
    selectLanguage: "விரும்பும் மொழி",
    printForm: "படிவத்தை அச்சிடுக",
    backToHome: "முகப்பிற்குத் திரும்பு",
    submittedSuccessTitle: "பொறுப்புத் துறப்பு படிவம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!",
    submittedSuccessMsg: (name) => `நன்றி, ${name}. உங்கள் ஒப்பந்தம் வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளது.`,
    printCompleted: "பூர்த்தி செய்யப்பட்ட நகலை அச்சிடுக",
    returnHome: "முகப்புப் பக்கத்திற்குத் திரும்பு",
    errName: "தயவுசெய்து விருந்தினர் 1 இன் பெயரை உள்ளிடவும்.",
    errPhone: "தயவுசெய்து தொடர்பு மொபைல் எண்ணை உள்ளிடவும்.",
    errSig: "சமர்ப்பிப்பதற்கு முன் கையொப்பத்தை வழங்கவும்.",
    errConfirmation: "உறுதிப்படுத்தல் பெட்டியைத் தேர்ந்தெடுக்கவும்.",
    terms: [
      "இந்தச் செயல்பாட்டில் உள்ள ஆபத்துகள் குறித்து எனக்கு முழுமையாகத் தெரியும் என்றும், பாதுகாப்பு நடைமுறைகள் குறித்து எனக்கு விளக்கமளிக்கப்பட்டுள்ளது என்றும் சான்றளிக்கிறேன்.",
      "செய்ய வேண்டியவை மற்றும் செய்யக்கூடாதவை, மருத்துவக் கட்டுப்பாடுகள் மற்றும் உள்ளூர் அரசு விதிமுறைகள் பற்றி எனக்குத் தெரியும்.",
      "இந்தச் செயல்பாட்டை மேற்கொள்வதற்கு நான் உடலளவில் தகுதியுடன் இருக்கிறேன் என்றும், தீவிர மருத்துவப் பிரச்சினைகள் இல்லை என்றும் கூறுகிறேன்.",
      "இந்த ஒப்பந்தத்தில் கையெழுத்திட எனக்கு சட்டப்பூர்வ வயதும் தகுதியும் உள்ளது அல்லது காப்பாளரின் ஒப்புதலைப் பெற்றுள்ளேன்.",
      "எனக்கு ஏற்படும் எந்தவொரு காயம், இறப்பு அல்லது பிற சேதங்களுக்கு ஜாய் வாட்டர் ஸ்போர்ட்ஸ் பொறுப்பல்ல என்பதை ஒப்புக்கொள்கிறேன்.",
      "எனது சொந்த விருப்பத்தின் பேரில் கையெழுத்திடுகிறேன் என்று புரிந்து கொள்கிறேன்.",
      "இந்தச் செயல்பாட்டில் உள்ள அனைத்து ஆபத்துகளையும் ஏற்க ஒப்புக்கொள்கிறேன்.",
      "இழப்பீடு: எனது அலட்சியத்தால் ஏற்படும் செலவுகள் அல்லது சேதங்களிலிருந்து நிறுவனத்திற்கு இழப்பீடு வழங்க ஒப்புக்கொள்கிறேன்."
    ],
    guestDetailsHeader: "பங்கேற்பாளர்களின் விவரங்கள்",
    totalGuestsLabel: "மொத்த விருந்தினர்களின் எண்ணிக்கை",
    totalGuestsSubtitle: "இந்தப் பயணத்தில் பங்கேற்கும் விருந்தினர்களின் எண்ணிக்கையைத் தேர்ந்தெடுக்கவும்.",
    guestListHeader: "பங்கேற்பாளர்களின் பெயர் & வயது பட்டியல்",
    guestNumberLabel: (n) => `விருந்தினர் ${n}`,
    ageLabel: "வயது",
    agePlaceholder: "வயது",
    guestNameLabel: "முழு பெயர்",
    guestNamePlaceholder: "முழு பெயரை உள்ளிடவும்",
    primaryContactHeader: "முதன்மை தொடர்பு விவரங்கள்",
    primaryContactSubtitle: "இந்த நபர் இந்த புக்கிங்கிற்கான முதன்மை தொடர்பாளராக இருப்பார்.",
    commAddressLabel: "முழு முகவரி",
    commAddressPlaceholder: "முகவரியை உள்ளிடவும்",
    phoneLabel: "மொபைல் எண்",
    phonePlaceholder: "+91 98765 43210",
    emailLabel: "மின்னஞ்சல் முகவரி",
    emailPlaceholder: "guest@example.com",
    activitiesHeader: "பங்கேற்கும் வாட்டர் ஸ்போர்ட்ஸ் விளையாட்டுகள்",
    applyToAllGuestsLabel: "தேர்ந்தெடுக்கப்பட்ட விளையாட்டுகளை அனைத்து விருந்தினர்களுக்கும் பொருத்துக",
    customizePerGuestLabel: "ஒவ்வொரு விருந்தினருக்கும் தனித்தனியாக தேர்ந்தெடுக்கவும்",
    finalDeclarationHeader: "இறுதி உறுதிமொழி",
    finalDeclarationText: "மேலே வழங்கப்பட்ட தகவல்கள் துல்லியமானவை என்றும் பாதுகாப்பு விதிமுறைகளை படித்து ஒப்புக்கொள்கிறேன் என்றும் உறுதிப்படுத்துகிறேன்.",
    finalDeclarationCheckboxLabel: "மேற்கண்ட அறிவிப்பை நான் உறுதிசெய்து ஒப்புக்கொள்கிறேன்.",
    guestSigLabel: "விருந்தினரின் கையொப்பம்",
    signForGroupLabel: "முதன்மை விருந்தினர் குழு சார்பாக கையொப்பமிடுகிறார்",
    individualSignaturesLabel: "ஒவ்வொருவரும் தனித்தனியாக கையொப்பமிடுகின்றனர்",
    dateLabel: "தேதி",
    summaryHeader: "அறிவிப்பு சுருக்கம்",
    guardianHeader: "காப்பாளர் விவரங்கள் (18 வயதுக்குட்பட்டோருக்கு)",
    guardianNote: "18 வயதுக்குட்பட்ட சிறார்களுக்கு காப்பாளர் விவரங்கள் தேவை-",
    guardianNameLabel: "காப்பாளர் முழு பெயர்",
    guardianNamePlaceholder: "காப்பாளர் பெயர்",
    guardianAddressPlaceholder: "காப்பாளர் முகவரி",
    guardianPhonePlaceholder: "காப்பாளர் மொபைல் எண்",
    guardianSigLabel: "காப்பாளர் கையொப்பம்",
    dateOfSailingLabel: "பயண தேதி :",
    invoiceNoLabel: "இன்வாய்ஸ் எண் :",
    boardingPassNoLabel: "போர்டிங் பாஸ் எண் :",
    tripTimeLabel: (n) => `ட்ரிப் ${n} நேரம் :`,
    trip1Placeholder: "எ.கா: 10:00 AM",
    trip2Placeholder: "எ.கா: 11:30 AM",
    boatLabel: "படகு :",
    submitBtn: "படிவத்தை சமர்ப்பி",
    submittingBtn: "சமர்ப்பிக்கப்படுகிறது...",
    footerNotice: "சமர்ப்பி என்பதைக் கிளிக் செய்வதன் மூலம் அனைத்து தகவல்களும் சட்டப்பூர்வமானவை என்பதை ஒப்புக்கொள்கிறீர்கள்.",
    sendWhatsappBtn: "WhatsApp மூலம் உறுதிப்படுத்தலை அனுப்புக",
    startNewBtn: "புதிய படிவத்தைத் தொடங்கு"
  },
  te: {
    title: "జాయ్ వాటర్ స్పోర్ట్స్",
    subtitle: "వాటర్ స్పోర్ట్స్ లైబిలిటీ వేవర్ ఒప్పందం",
    location: "వర్కల బీచ్, కేరళ • డిజిటల్ లీగల్ డిక్లరేషన్",
    selectLanguage: "ఎంచుకున్న భాష",
    printForm: "ఫారమ్‌ను ప్రింట్ చేయండి",
    backToHome: "హోమ్‌కి తిరిగి వెళ్ళండి",
    submittedSuccessTitle: "బాధ్యత మినహాయింపు మరియు ప్రకటన విజయవంతంగా సమర్పించబడింది!",
    submittedSuccessMsg: (name) => `ధన్యవాదాలు, ${name}. మీ వేవర్ ఒప్పందం నమోదు చేయబడింది.`,
    printCompleted: "పూర్తి కాపీని ప్రింట్ చేయండి",
    returnHome: "హోమ్ పేజీకి తిరిగి వెళ్లండి",
    errName: "దయచేసి గెస్ట్ 1 పేరును నమోదు చేయండి.",
    errPhone: "దయచేసి ప్రైమరీ మొబైల్ నంబర్‌ను నమోదు చేయండి.",
    errSig: "సమర్పించే ముందు సంతకం చేయండి.",
    errConfirmation: "దయచేసి కన్ఫర్మేషన్ చెక్‌బాక్స్‌ను ఎంచుకోండి.",
    terms: [
      "ఈ కార్యకలాపంలో ఉన్న ప్రమాదాల గురించి నాకు పూర్తిగా తెలుసని మరియు రక్షణ విధానాల గురించి వివరించబడిందని ధృవీకరిస్తున్నాను.",
      "చేయవలసినవి మరియు చేయకూడనివి, వైద్య పరిమితుల గురించి నాకు అవగాహన ఉంది.",
      "నేను శారీరకంగా ఫిట్‌గా ఉన్నానని మరియు ఎటువంటి తీవ్రమైన అనారోగ్యాలతో బాధపడటం లేదని తెలుపుతున్నాను.",
      "నేను ఈ ఒప్పందంపై సంతకం చేయడానికి అర్హుడనని లేదా సంరక్షకుల సమ్మతిని పొందుతున్నానని ప్రకటిస్తున్నాను.",
      "నాకు కలిగే నష్టాలకు జాయ్ వాటర్ స్పోర్ట్స్ బాధ్యత వహించరని నేను అంగీకరిస్తున్నాను.",
      "నా సొంత నిర్ణయంతో సంతకం చేస్తున్నానని అర్థం చేసుకున్నాను.",
      "అన్ని ప్రమాదాలను స్వీకరించడానికి నేను సమ్మతిస్తున్నాను.",
      "నష్టపరిహారం: నా నిర్లక్ష్యం వలన కలిగే నష్టాల నుండి కంపెనీని రక్షించడానికి అంగీకరిస్తున్నాను."
    ],
    guestDetailsHeader: "పాల్గొనేవారి వివరాలు",
    totalGuestsLabel: "మొత్తం అతిథుల సంఖ్య",
    totalGuestsSubtitle: "ఈ యాత్రలో పాల్గొనే అతిథుల సంఖ్యను ఎంచుకోండి.",
    guestListHeader: "పాల్గొనేవారి పేరు & వయస్సు జాబితా",
    guestNumberLabel: (n) => `అతిథి ${n}`,
    ageLabel: "వయస్సు",
    agePlaceholder: "వయస్సు",
    guestNameLabel: "పూర్తి పేరు",
    guestNamePlaceholder: "పూర్తి పేరు నమోదు చేయండి",
    primaryContactHeader: "ప్రైమరీ కాంటాక్ట్ వివరాలు",
    primaryContactSubtitle: "ఈ బుకింగ్‌కు సంబంధించి వీరే ప్రధాన కాంటాక్ట్ అవుతారు.",
    commAddressLabel: "చిరునామా",
    commAddressPlaceholder: "చిరునామా నమోదు చేయండి",
    phoneLabel: "మొబైల్ నంబర్",
    phonePlaceholder: "+91 98765 43210",
    emailLabel: "ఈమెయిల్ చిరునామా",
    emailPlaceholder: "guest@example.com",
    activitiesHeader: "పాల్గొనే వాటర్ స్పోర్ట్స్ రకాలు",
    applyToAllGuestsLabel: "ఎంచుకున్న క్రీడలను అందరు అతిథులకు వర్తింపజేయండి",
    customizePerGuestLabel: "ఒక్కొక్కరికి వేర్వేరుగా ఎంచుకోండి",
    finalDeclarationHeader: "అంతిమ డిక్లరేషన్",
    finalDeclarationText: "పైన తెలిపిన సమాచారం ఖచ్చితమైనదని మరియు నిబంధనలను చదివి అంగీకరిస్తున్నానని ధృవీకరిస్తున్నాను.",
    finalDeclarationCheckboxLabel: "నేను పై డిక్లరేషన్‌ను అంగీకరిస్తున్నాను.",
    guestSigLabel: "అతిథి సంతకం",
    signForGroupLabel: "ప్రైమరీ అతిథి గ్రూప్ తరఫున సంతకం చేస్తారు",
    individualSignaturesLabel: "ప్రతి ఒక్కరూ విడిగా సంతకం చేయండి",
    dateLabel: "తేదీ",
    summaryHeader: "డిక్లరేషన్ సారాంశం",
    guardianHeader: "సంరక్షకుని వివరాలు (18 ఏళ్ల లోపు వారికి)",
    guardianNote: "18 ఏళ్ల లోపు పిల్లలకు సంరక్షకుని వివరాలు అవసరం-",
    guardianNameLabel: "సంరక్షకుని పూర్తి పేరు",
    guardianNamePlaceholder: "సంరక్షకుని పేరు",
    guardianAddressPlaceholder: "చిరునామా",
    guardianPhonePlaceholder: "ఫోన్ నంబర్",
    guardianSigLabel: "సంరక్షకుని సంతకం",
    dateOfSailingLabel: "ప్రయాణ తేదీ :",
    invoiceNoLabel: "ఇన్‌వాయిస్ నంబర్ :",
    boardingPassNoLabel: "బోర్డింగ్ పాస్ నంబర్ :",
    tripTimeLabel: (n) => `ట్రిప్ ${n} సమయం :`,
    trip1Placeholder: "ఉదా: 10:00 AM",
    trip2Placeholder: "ఉదా: 11:30 AM",
    boatLabel: "బోట్ :",
    submitBtn: "డిక్లరేషన్‌ను సమర్పించండి",
    submittingBtn: "సమర్పిస్తోంది...",
    footerNotice: "సమర్పించు క్లిక్ చేయడం ద్వారా సమాచారం చట్టబద్ధమైనదని అంగీకరిస్తున్నారు.",
    sendWhatsappBtn: "WhatsApp ద్వారా కన్ఫర్మేషన్ పంపండి",
    startNewBtn: "కొత్త డిక్లరేషన్ ఫారమ్"
  },
  hi: {
    title: "जॉय वाटर स्पोर्ट्स",
    subtitle: "वाटर स्पोर्ट्स देयता छूट समझौता",
    location: "वरकला बीच, केरल • डिजिटल कानूनी घोषणा",
    selectLanguage: "पसंदीदा भाषा",
    printForm: "फॉर्म प्रिंट करें",
    backToHome: "होम पर वापस जाएं",
    submittedSuccessTitle: "देयता छूट और घोषणा सफलतापूर्वक जमा की गई!",
    submittedSuccessMsg: (name) => `धन्यवाद, ${name}। आपका घोषणा पत्र सफलतापूर्वक दर्ज कर लिया गया है।`,
    printCompleted: "पूर्ण प्रति प्रिंट करें",
    returnHome: "मुख्य पृष्ठ पर लौटें",
    errName: "कृपया गेस्ट 1 का पूरा नाम दर्ज करें।",
    errPhone: "कृपया प्राथमिक मोबाइल नंबर दर्ज करें।",
    errSig: "कृपया जमा करने से पहले हस्ताक्षर करें।",
    errConfirmation: "कृपया घोषणा स्वीकार करने वाले चेकबॉक्स पर टिक करें।",
    terms: [
      "मैं प्रमाणित करता हूं कि मुझे इस गतिविधि में शामिल जोखिमों के बारे में पूरी जानकारी है और मुझे सुरक्षा प्रक्रियाओं के बारे में बताया गया है।",
      "मुझे क्या करना है और क्या नहीं, चिकित्सा प्रतिबंधों और स्थानीय नियमों के बारे में जानकारी है।",
      "मैं घोषित करता हूं कि मैं गतिविधि करने के लिए शारीरिक रूप से स्वस्थ हूं और किसी गंभीर बीमारी से पीड़ित नहीं हूं।",
      "मैं आगे घोषित करता हूं कि मैं समझौते पर हस्ताक्षर करने के लिए वयस्क हूं या अभिभावक की सहमति प्राप्त है।",
      "मैं समझता हूं कि मुझे होने वाले किसी नुकसान के लिए जॉय वाटर स्पोर्ट्स जिम्मेदार नहीं होगा।",
      "मैं अपनी स्वेच्छा से इस समझौते पर हस्ताक्षर कर रहा हूं।",
      "मैं इस गतिविधि में मौजूद सभी जोखिमों को स्वीकार करने के लिए सहमत हूं।",
      "क्षतिपूर्ति: मैं अपनी लापरवाही से होने वाले नुकसान से कंपनी की रक्षा करने के लिए सहमत हूं।"
    ],
    guestDetailsHeader: "प्रतिभागियों का विवरण",
    totalGuestsLabel: "कुल मेहमानों की संख्या",
    totalGuestsSubtitle: "इस ट्रिप में भाग लेने वाले मेहमानों की संख्या चुनें।",
    guestListHeader: "प्रतिभागियों का नाम और आयु सूची",
    guestNumberLabel: (n) => `गेस्ट ${n}`,
    ageLabel: "आयु",
    agePlaceholder: "आयु",
    guestNameLabel: "पूरा नाम",
    guestNamePlaceholder: "प्रतिभागी का पूरा नाम दर्ज करें",
    primaryContactHeader: "प्राथमिक संपर्क विवरण",
    primaryContactSubtitle: "यह व्यक्ति इस बुकिंग का मुख्य संपर्क होगा।",
    commAddressLabel: "पूरा पता",
    commAddressPlaceholder: "संचार पता दर्ज करें",
    phoneLabel: "मोबाइल नंबर",
    phonePlaceholder: "+91 98765 43210",
    emailLabel: "ईमेल पता",
    emailPlaceholder: "guest@example.com",
    activitiesHeader: "भाग लेने वाली वाटर स्पोर्ट्स गतिविधियां",
    applyToAllGuestsLabel: "चुनी गई गतिविधियां सभी मेहमानों पर लागू करें",
    customizePerGuestLabel: "प्रत्येक प्रतिभागी के लिए अलग से चुनें",
    finalDeclarationHeader: "अंतिम घोषणा",
    finalDeclarationText: "मैं पुष्टि करता हूं कि ऊपर दी गई जानकारी सटीक है और मैंने सुरक्षा एवं देयता शर्तों को पढ़कर स्वीकार किया है।",
    finalDeclarationCheckboxLabel: "मैं उपरोक्त घोषणा की पुष्टि और सहमति देता हूं।",
    guestSigLabel: "अतिथि के हस्ताक्षर",
    signForGroupLabel: "प्राथमिक अतिथि पूरे समूह की ओर से हस्ताक्षर करता है",
    individualSignaturesLabel: "सभी प्रतिभागी अलग-अलग हस्ताक्षर करें",
    dateLabel: "दिनांक",
    summaryHeader: "घोषणा का सारांश",
    guardianHeader: "अभिभावक विवरण (18 वर्ष से कम आयु के लिए)",
    guardianNote: "18 वर्ष से कम उम्र के नाबालिगों के लिए अभिभावक का विवरण आवश्यक है-",
    guardianNameLabel: "अभिभावक का पूरा नाम",
    guardianNamePlaceholder: "अभिभावक का नाम",
    guardianAddressPlaceholder: "अभिभावक का पता",
    guardianPhonePlaceholder: "अभिभावक का फोन नंबर",
    guardianSigLabel: "अभिभावक के हस्ताक्षर",
    dateOfSailingLabel: "यात्रा की तारीख :",
    invoiceNoLabel: "चालान संख्या :",
    boardingPassNoLabel: "बोर्डिंग पास संख्या :",
    tripTimeLabel: (n) => `ट्रिप ${n} समय :`,
    trip1Placeholder: "उदा: 10:00 AM",
    trip2Placeholder: "उदा: 11:30 AM",
    boatLabel: "नाव :",
    submitBtn: "घोषणा पत्र जमा करें",
    submittingBtn: "जमा किया जा रहा है...",
    footerNotice: "जमा करें पर क्लिक करके, आप स्वीकार करते हैं कि सभी जानकारी कानूनी रूप से बाध्यकारी है।",
    sendWhatsappBtn: "WhatsApp के जरिए पुष्टि भेजें",
    startNewBtn: "नया घोषणा पत्र शुरू करें"
  },
  bn: {
    title: "জয় ওয়াটার স্পোর্টস",
    subtitle: "ওয়াটার স্পোর্টস দায়মুক্তি চুক্তিপত্র",
    location: "ভারকালা বিচ, কেরালা • ডিজিটাল আইনি ঘোষণা",
    selectLanguage: "পছন্দের ভাষা",
    printForm: "ফর্ম প্রিন্ট করুন",
    backToHome: "হোমে ফিরে যান",
    submittedSuccessTitle: "দায়মুক্তি ফর্ম সফলভাবে জমা দেওয়া হয়েছে!",
    submittedSuccessMsg: (name) => `ধন্যবাদ, ${name}। আপনার দায়মুক্তি চুক্তি রেকর্ড করা হয়েছে।`,
    printCompleted: "সম্পূর্ণ কপি প্রিন্ট করুন",
    returnHome: "হোম পেজে ফিরে যান",
    errName: "অনুগ্রহ করে অতিথি ১-এর পুরো নাম লিখুন।",
    errPhone: "অনুগ্রহ করে প্রাইমারি মোবাইল নম্বর লিখুন।",
    errSig: "জমা দেওয়ার আগে স্বাক্ষর করুন।",
    errConfirmation: "অনুগ্রহ করে ঘোষণা নিশ্চিতকরণ বক্সে টিক দিন।",
    terms: [
      "আমি প্রত্যয়ন করছি যে আমি ঝুঁকিসমূহ সম্পর্কে সচেতন এবং আমাকে সুরক্ষা পদ্ধতি সম্পর্কে অবহিত করা হয়েছে।",
      "আমি কি করা উচিত এবং কি নয়, চিকিৎসা সংক্রান্ত বিধিনিষেধ সম্পর্কে অবগত।",
      "আমি উল্লেখ করছি যে আমি শারীরিকভাবে সক্ষম এবং কোনো মারাত্মক রোগে ভুগছি না।",
      "আমি প্রাপ্তবয়স্ক অথবা অভিভাবকের লিখিত সম্মতি পেয়েছি।",
      "জয় ওয়াটার স্পোর্টস আমার কোনো ক্ষতির জন্য দায়ী থাকবে না।",
      "আমি স্বেচ্ছায় আমার আইনি অধিকার ত্যাগ করে চুক্তিতে স্বাক্ষর করছি।",
      "আমি সমস্ত ঝুঁকি গ্রহণ করতে সম্মত।",
      "ক্ষতিপূরণ: আমার অবহেলার কারণে সৃষ্ট ক্ষতির জন্য ক্ষতিপূরণ দিতে সম্মত।"
    ],
    guestDetailsHeader: "অংশগ্রহণকারীদের বিবরণ",
    totalGuestsLabel: "মোট অতিথির সংখ্যা",
    totalGuestsSubtitle: "এই ট্রিপে অংশগ্রহণকারী অতিথির সংখ্যা নির্বাচন করুন।",
    guestListHeader: "অংশগ্রহণকারীদের নাম ও বয়সের তালিকা",
    guestNumberLabel: (n) => `অতিথি ${n}`,
    ageLabel: "বয়স",
    agePlaceholder: "বয়স",
    guestNameLabel: "পুরো নাম",
    guestNamePlaceholder: "অংশগ্রহণকারীর পুরো নাম লিখুন",
    primaryContactHeader: "প্রাইমারি যোগাযোগের বিবরণ",
    primaryContactSubtitle: "এই ব্যক্তি এই বুকিংয়ের মূল পরিচিতি হবেন।",
    commAddressLabel: "সম্পূর্ণ ঠিকানা",
    commAddressPlaceholder: "যোগাযোগের ঠিকানা লিখুন",
    phoneLabel: "মোবাইল নম্বর",
    phonePlaceholder: "+91 98765 43210",
    emailLabel: "ইমেল ঠিকানা",
    emailPlaceholder: "guest@example.com",
    activitiesHeader: "অংশগ্রহণকারী ওয়াটার স্পোর্টস রাইডসমূহ",
    applyToAllGuestsLabel: "নির্বাচিত রাইডসমূহ সকল অতিথির জন্য প্রযোজ্য করুন",
    customizePerGuestLabel: "প্রত্যেক অতিথির জন্য আলাদা নির্বাচন করুন",
    finalDeclarationHeader: "চূড়ান্ত ঘোষণা",
    finalDeclarationText: "আমি নিশ্চিত করছি যে প্রদান করা তথ্য সঠিক এবং শর্তাবলী পড়ে সম্মত হয়েছি।",
    finalDeclarationCheckboxLabel: "আমি উপরোক্ত ঘোষণা নিশ্চিত ও সম্মত হচ্ছি।",
    guestSigLabel: "অতিথির স্বাক্ষর",
    signForGroupLabel: "মূল অতিথি পুরো গ্রুপের পক্ষে স্বাক্ষর করছেন",
    individualSignaturesLabel: "প্রত্যেকে আলাদাভাবে স্বাক্ষর করুন",
    dateLabel: "তারিখ",
    summaryHeader: "ঘোষণার সারসংক্ষেপ",
    guardianHeader: "অভিভাবকের বিবরণ (১৮ বছরের কম বয়সীদের জন্য)",
    guardianNote: "১৮ বছরের কম বয়সী নাবালকদের জন্য অভিভাবকের বিবরণ প্রয়োজন-",
    guardianNameLabel: "অভিভাবকের পুরো নাম",
    guardianNamePlaceholder: "অভিভাবকের নাম",
    guardianAddressPlaceholder: "অভিভাবকের ঠিকানা",
    guardianPhonePlaceholder: "অভিভাবকের ফোন নম্বর",
    guardianSigLabel: "অভিভাবকের স্বাক্ষর",
    dateOfSailingLabel: "যাত্রার তারিখ :",
    invoiceNoLabel: "ইনভয়েস নম্বর :",
    boardingPassNoLabel: "বোর্ডিং পাস নম্বর :",
    tripTimeLabel: (n) => `ট্রিপ ${n} সময় :`,
    trip1Placeholder: "যেমন: 10:00 AM",
    trip2Placeholder: "যেমন: 11:30 AM",
    boatLabel: "বোট :",
    submitBtn: "ঘোষণা জমা দিন",
    submittingBtn: "জমা হচ্ছে...",
    footerNotice: "জমা দিন ক্লিক করে আপনি আইনি বাধ্যবাধকতা স্বীকার করছেন।",
    sendWhatsappBtn: "WhatsApp-এ নিশ্চিতকরণ পাঠান",
    startNewBtn: "নতুন ঘোষণা ফর্ম শুরু করুন"
  }
};

export default function DeclarationForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get('bookingId') || searchParams.get('id') || '';

  const [selectedLang, setSelectedLang] = useState<LanguageKey>('en');
  const t = translations[selectedLang];

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Suffix for Declaration ID: JWS + DDMMYY + Counter Ticket No.
  const generateDefaultSuffix = () => {
    const passedSuffix = searchParams.get('idSuffix') || searchParams.get('seq');
    return passedSuffix || '';
  };

  // Helper for Declaration ID Prefix (JWS + DDMMYY)
  const getIdPrefix = (dateStr: string) => {
    if (!dateStr) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yy = String(today.getFullYear()).slice(-2);
      return `JWS${dd}${mm}${yy}`;
    }
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const yyyy = parts[0];
      const mm = parts[1];
      const dd = parts[2];
      const yy = yyyy.slice(-2);
      return `JWS${dd}${mm}${yy}`;
    }
    return 'JWS080826';
  };

  // 1. Dynamic Guest Count State (1 to 20 Guests)
  const initialGuestCount = Math.min(20, Math.max(1, parseInt(searchParams.get('guests') || '1')));
  const [guestCount, setGuestCount] = useState<number>(initialGuestCount);

  // 2. Participant details list ({ name, age, gender })
  const [guestList, setGuestList] = useState<{ name: string; age: string; gender: string }[]>(() => {
    const list: { name: string; age: string; gender: string }[] = [];
    for (let i = 0; i < initialGuestCount; i++) {
      list.push({
        name: i === 0 ? (searchParams.get('name') || '') : '',
        age: '',
        gender: ''
      });
    }
    return list;
  });

  // 3. Primary Contact / Communication Details
  const [formData, setFormData] = useState({
    idSuffix: generateDefaultSuffix(),
    guestName: searchParams.get('name') || '',
    communicationAddress: searchParams.get('address') || '',
    phone: searchParams.get('phone') || '',
    email: searchParams.get('email') || '',
    signature: '',
    agreementDate: searchParams.get('date') || new Date().toISOString().split('T')[0],
    declarationTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit' }),

    // Guardian details for minors
    hasMinor: false,
    guardianName: '',
    guardianAddress: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianSignature: '',
    guardianAgreementDate: searchParams.get('date') || new Date().toISOString().split('T')[0],

    // Confirmation & Metadata
    finalConfirmationAgreed: false,
    invoiceNo: bookingIdParam || '',
    boardingPassNo: bookingIdParam ? `BP-${bookingIdParam}` : '',
    trip1Time: searchParams.get('time') || '',
    dateOfSailing: searchParams.get('date') || new Date().toISOString().split('T')[0]
  });

  // 4. Activities State
  const [applyToAllGuests, setApplyToAllGuests] = useState(true);
  const [selectedActivities, setSelectedActivities] = useState<string[]>(() => {
    const actParam = searchParams.get('activities') || searchParams.get('activity');
    if (actParam) {
      const parsed = actParam.split(',').map(s => s.trim()).filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
    return ['Parasailing'];
  });

  // Per-guest activity map (guest index -> activities)
  const [perGuestActivities, setPerGuestActivities] = useState<Record<number, string[]>>({
    0: ['Parasailing']
  });

  // 5. Signature Mode & Per-Guest Signatures
  const [isGroupSignature, setIsGroupSignature] = useState(true);
  const [perGuestSignatures, setPerGuestSignatures] = useState<Record<number, string>>({});
  const [activeSigningGuest, setActiveSigningGuest] = useState<number>(0);

  // Check if any guest is under 18
  useEffect(() => {
    const hasAnyMinor = guestList.some(g => {
      const parsedAge = parseInt(g.age, 10);
      return !isNaN(parsedAge) && parsedAge < 18;
    });
    setFormData(prev => ({ ...prev, hasMinor: hasAnyMinor }));
  }, [guestList]);

  // Sync Guest 1 name with Primary Contact guestName if not explicitly customized
  const handleGuestItemChange = (index: number, field: 'name' | 'age' | 'gender', value: string) => {
    setGuestList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    if (index === 0 && field === 'name') {
      setFormData(prev => ({ ...prev, guestName: value }));
    }
  };

  // Dynamic guest count handler (1-20)
  const handleGuestCountChange = (count: number) => {
    const newCount = Math.min(20, Math.max(1, count));
    setGuestCount(newCount);

    setGuestList(prev => {
      const updated = [...prev];
      if (updated.length < newCount) {
        for (let i = updated.length; i < newCount; i++) {
          updated.push({ name: '', age: '', gender: '' });
        }
      } else if (updated.length > newCount) {
        return updated.slice(0, newCount);
      }
      return updated;
    });

    // Initialize per-guest activities
    setPerGuestActivities(prev => {
      const updated = { ...prev };
      for (let i = 0; i < newCount; i++) {
        if (!updated[i]) updated[i] = [...selectedActivities];
      }
      return updated;
    });
  };

  const handleActivityToggleGroup = (actName: string) => {
    setSelectedActivities(prev => {
      let updated: string[];
      if (prev.includes(actName)) {
        if (prev.length === 1) return prev; // keep at least 1
        updated = prev.filter(a => a !== actName);
      } else {
        updated = [...prev, actName];
      }

      // Sync to all guests
      setPerGuestActivities(guestMap => {
        const nextMap: Record<number, string[]> = {};
        for (let i = 0; i < guestCount; i++) {
          nextMap[i] = [...updated];
        }
        return nextMap;
      });

      return updated;
    });
  };

  const handleActivityTogglePerGuest = (guestIdx: number, actName: string) => {
    setPerGuestActivities(prev => {
      const current = prev[guestIdx] || [];
      let updated: string[];
      if (current.includes(actName)) {
        if (current.length === 1) return prev;
        updated = current.filter(a => a !== actName);
      } else {
        updated = [...current, actName];
      }
      return { ...prev, [guestIdx]: updated };
    });
  };

  // Lookup Online Booking helper for receptionists
  const [lookupInput, setLookupInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const handleLookupBooking = async () => {
    if (!lookupInput.trim()) {
      setLookupError('Please enter a valid Phone Number or Booking ID');
      return;
    }
    setLookupLoading(true);
    setLookupError('');
    try {
      const res = await fetch('/api/customer/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrId: lookupInput.trim() })
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.bookings || data.bookings.length === 0) {
        throw new Error(data.error || 'No matching online booking found.');
      }
      const b = data.bookings[0];
      const fetchedName = `${b.firstName || ''} ${b.lastName || ''}`.trim();
      setFormData(prev => ({
        ...prev,
        guestName: fetchedName || prev.guestName,
        phone: b.phone || prev.phone,
        email: b.email || prev.email,
        dateOfSailing: b.date || prev.dateOfSailing,
        agreementDate: b.date || prev.agreementDate,
        invoiceNo: b.id,
        boardingPassNo: `BP-${b.id}`,
        trip1Time: b.time || prev.trip1Time
      }));
      if (b.guests) {
        handleGuestCountChange(Number(b.guests));
      }
      if (fetchedName) {
        setGuestList(prev => {
          const list = [...prev];
          if (list[0]) list[0] = { ...list[0], name: fetchedName };
          return list;
        });
      }
    } catch (err: any) {
      setLookupError(formatSafeErrorMessage(err));
    } finally {
      setLookupLoading(false);
    }
  };

  // Pre-fill booking details if bookingId is passed
  useEffect(() => {
    if (bookingIdParam) {
      fetch(`/api/ticket/${bookingIdParam}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            const fetchedName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
            setFormData(prev => ({
              ...prev,
              guestName: prev.guestName || fetchedName,
              phone: prev.phone || data.phone || '',
              email: prev.email || data.email || '',
              dateOfSailing: prev.dateOfSailing || data.date || prev.agreementDate,
              agreementDate: prev.agreementDate || data.date || prev.agreementDate,
              invoiceNo: prev.invoiceNo || data.id || bookingIdParam,
              boardingPassNo: prev.boardingPassNo || `BP-${data.id || bookingIdParam}`,
              trip1Time: prev.trip1Time || data.time || ''
            }));
            if (fetchedName) {
              setGuestList(prev => {
                const list = [...prev];
                if (list[0] && !list[0].name) {
                  list[0] = { ...list[0], name: fetchedName };
                }
                return list;
              });
            }
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
      if (name === 'guestName') {
        setGuestList(prev => {
          const list = [...prev];
          if (list[0]) list[0] = { ...list[0], name: value };
          return list;
        });
      }
    }
  };

  const scrollToFirstError = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = el.querySelector('input, select, textarea') as HTMLElement;
      if (input) input.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 0. Counter ticket number / ID Suffix check
    if (!formData.idSuffix || formData.idSuffix.trim().length < 2) {
      setErrorMessage("Please enter the Counter Ticket Number (at least 2 to 4 digits) for Declaration ID.");
      scrollToFirstError('step-declaration-id');
      return;
    }

    // 1. Participant name check
    if (!guestList[0]?.name.trim()) {
      setErrorMessage(t.errName);
      scrollToFirstError('field-guest-name-0');
      return;
    }

    // 2. Primary Contact phone check
    if (!formData.phone.trim()) {
      setErrorMessage(t.errPhone);
      scrollToFirstError('field-phone');
      return;
    }

    // 3. Final declaration checkbox confirmation
    if (!formData.finalConfirmationAgreed) {
      setErrorMessage(t.errConfirmation);
      scrollToFirstError('field-confirmation');
      return;
    }

    // 4. Primary signature check
    const primarySig = isGroupSignature ? formData.signature : (perGuestSignatures[0] || formData.signature);
    if (!primarySig) {
      setErrorMessage(t.errSig);
      scrollToFirstError('field-signature');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const idPrefix = getIdPrefix(formData.agreementDate);
      const fullDeclarationId = `${idPrefix}${formData.idSuffix.trim()}`;
      const activitiesStr = applyToAllGuests
        ? selectedActivities.join(', ')
        : Object.entries(perGuestActivities)
            .map(([idx, acts]) => `Guest ${Number(idx) + 1}: ${(acts as string[]).join(', ')}`)
            .join(' | ');

      const payload = {
        declarationId: fullDeclarationId,
        idNumber: fullDeclarationId,
        idPrefix: idPrefix,
        idSuffix: formData.idSuffix.trim(),
        bookingId: formData.invoiceNo || bookingIdParam || `WALKIN-${Date.now()}`,
        guestName: formData.guestName || guestList[0]?.name,
        totalGuests: guestCount,
        guestList: guestList,
        activities: selectedActivities,
        selectedActivities: activitiesStr,
        perGuestActivities: perGuestActivities,
        communicationAddress: formData.communicationAddress || 'Onsite Guest',
        phone: formData.phone,
        email: formData.email,
        signature: primarySig,
        finalConfirmationAgreed: formData.finalConfirmationAgreed,
        declarationAgreed: formData.finalConfirmationAgreed,
        finalDeclarationChecked: formData.finalConfirmationAgreed ? 'YES (Agreed)' : 'NO',
        perGuestSignatures: isGroupSignature ? { 0: primarySig } : perGuestSignatures,
        agreementDate: formData.agreementDate,
        declarationDate: formData.agreementDate,
        declarationTime: formData.declarationTime,
        declarationFillingTime: formData.declarationTime,
        hasMinor: formData.hasMinor,
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
        isGeneralDeclaration: !bookingIdParam,
        language: selectedLang,
        source: bookingIdParam ? 'ONLINE_BOOKING_DECLARATION' : 'NAVBAR_DECLARATION',
        action: bookingIdParam ? 'ONLINE_DECLARATION' : 'GENERAL_DECLARATION'
      };

      const res = await fetch('/api/waivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok || !resData.success || resData.syncedToSheets === false) {
        throw new Error(resData.error || 'Something went wrong: Data could not be stored in Google Spreadsheet. Please verify Google Apps Script permissions.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(formatSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('declaration-printable-area');
    if (!element) return;

    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 6;
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - (margin * 2));

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - (margin * 2));
      }

      const fullId = `${getIdPrefix(formData.agreementDate)}${formData.idSuffix.trim()}`;
      const guestNameClean = (formData.guestName || guestList[0]?.name || 'Guest').trim().replace(/\s+/g, '_');
      pdf.save(`Declaration_Form_${fullId}_${guestNameClean}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleWhatsAppShare = () => {
    const fullId = `${getIdPrefix(formData.agreementDate)}${formData.idSuffix.trim()}`;
    const text = encodeURIComponent(
      `*JOY WATER SPORTS VARKALA*\n` +
      `*Water Sports Liability Waiver Confirmation*\n\n` +
      `📌 *Declaration ID:* ${fullId}\n` +
      `👤 *Primary Contact:* ${formData.guestName || guestList[0]?.name}\n` +
      `👥 *Total Guests:* ${guestCount}\n` +
      `🏄 *Activities:* ${selectedActivities.join(', ')}\n` +
      `📅 *Date:* ${formData.agreementDate}\n` +
      `✅ *Status:* Signed & Verified\n\n` +
      `Thank you for completing your waiver with Joy Water Sports Varkala!`
    );
    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
  };

  const handleStartNew = () => {
    setSubmitted(false);
    setGuestCount(1);
    setGuestList([{ name: '', age: '' }]);
    setFormData({
      idSuffix: generateDefaultSuffix(),
      guestName: '',
      communicationAddress: '',
      phone: '',
      email: '',
      signature: '',
      agreementDate: new Date().toISOString().split('T')[0],
      declarationTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' }),
      hasMinor: false,
      guardianName: '',
      guardianAddress: '',
      guardianPhone: '',
      guardianEmail: '',
      guardianSignature: '',
      guardianAgreementDate: new Date().toISOString().split('T')[0],
      finalConfirmationAgreed: false,
      invoiceNo: '',
      boardingPassNo: '',
      trip1Time: '',
      dateOfSailing: new Date().toISOString().split('T')[0]
    });
    setPerGuestSignatures({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 lg:px-8 text-slate-900 font-sans print:bg-white print:p-0">
      <SEOHead
        title="Water Sports Liability Waiver & Declaration Form | Joy Water Sports Varkala"
        description="Official Joy Water Sports Varkala liability waiver and declaration form. Complete mandatory safety declaration for parasailing, jet ski, and beach activities at Papanasam Beach."
        canonicalUrl="https://joywatersports.com/declaration"
        schema={[
          joyWaterSportsBusinessSchema,
          createBreadcrumbSchema([
            { name: 'Home', url: 'https://joywatersports.com' },
            { name: 'Liability Waiver Declaration', url: 'https://joywatersports.com/declaration' }
          ])
        ]}
      />

      {/* Top Controls Bar (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-sky-700 bg-white px-3.5 py-2 rounded-lg border border-slate-300 shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToHome}
        </button>

        {/* Language Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-300 shadow-xs">
          <GoogleTranslateIcon className="w-4.5 h-4.5 text-sky-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 hidden sm:inline">{t.selectLanguage}:</span>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as LanguageKey)}
            className="bg-transparent text-xs sm:text-sm font-bold text-sky-700 focus:outline-none cursor-pointer"
          >
            {languages.map(lang => (
              <option key={lang.key} value={lang.key}>
                {lang.nativeName} ({lang.label})
              </option>
            ))}
          </select>
        </div>


      </div>

      {/* Spot / Walk-In Registration Indicator */}
      <div className="max-w-4xl mx-auto mb-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900 font-semibold print:hidden">
        <span className="flex items-center gap-1.5 font-bold">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          WALK-IN & SPOT GUEST DECLARATION FORM
        </span>
        <span className="text-[11px] text-blue-700 font-medium hidden sm:inline">Joy Water Sports Varkala Counter</span>
      </div>

      {/* Printable Area Wrapper */}
      <div id="declaration-printable-area" className="max-w-4xl mx-auto bg-white border border-slate-900 shadow-xl p-5 sm:p-8 md:p-10 print:shadow-none print:border-slate-900 print:p-6 print:max-w-none">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-slate-900 pb-5 mb-5 print:pb-3 print:mb-4">
          <div className="flex flex-col items-center justify-center text-center shrink-0">
            <img 
              src="https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx" 
              alt="Joy Water Sports Logo" 
              loading="eager"
              decoding="async"
              className="h-16 sm:h-20 w-auto object-contain" 
            />
          </div>

          <div className="text-center sm:text-right flex-1">
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-black text-black tracking-wider uppercase">
              {t.title}
            </h1>
            <h2 className="font-serif text-xs sm:text-sm md:text-base font-bold text-slate-900 tracking-widest uppercase mt-1">
              {t.subtitle}
            </h2>
            <p className="text-[11px] text-slate-600 font-serif italic mt-0.5">
              {t.location}
            </p>
          </div>
        </div>

        {/* SUCCESS STATE CONFIRMATION */}
        {submitted ? (
          <div className="my-4 p-4 sm:p-5 bg-emerald-50 border-2 border-emerald-600 rounded-xl text-center space-y-3 shadow-md print:hidden max-w-xl mx-auto">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold text-emerald-800 tracking-widest uppercase bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                VERIFIED &amp; RECORDED
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-black text-slate-900 uppercase pt-1">
                {t.submittedSuccessTitle}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 max-w-md mx-auto">
                {t.submittedSuccessMsg(formData.guestName || guestList[0]?.name || 'Guest')}
              </p>
            </div>

            <div className="bg-white border border-emerald-300 rounded-xl p-3.5 sm:p-4 max-w-md mx-auto text-slate-800 space-y-2 text-left shadow-2xs">
              <div className="flex flex-wrap justify-between items-center border-b border-emerald-100 pb-1.5 gap-1">
                <span className="font-sans font-bold text-xs sm:text-sm text-slate-600">Declaration ID:</span>
                <strong className="text-emerald-950 font-black text-base sm:text-lg tracking-wider font-mono">
                  {getIdPrefix(formData.agreementDate)}{formData.idSuffix}
                </strong>
              </div>
              <div className="flex flex-wrap justify-between items-center gap-1 text-xs sm:text-sm">
                <span className="font-sans font-bold text-slate-600">Total Participants:</span>
                <span className="font-black text-slate-900 text-sm sm:text-base">{guestCount} Guests</span>
              </div>
              <div className="flex flex-wrap justify-between items-center gap-1 text-xs sm:text-sm">
                <span className="font-sans font-bold text-slate-600">Primary Contact:</span>
                <span className="font-black text-slate-900 text-sm sm:text-base font-mono">{formData.phone}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xs sm:text-sm pt-1.5 border-t border-emerald-100">
                <span className="font-sans font-bold text-slate-600 shrink-0">Activities:</span>
                <span className="font-black text-sky-900 text-sm sm:text-base sm:text-right leading-tight">{selectedActivities.join(', ')}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold shadow-sm transition-all cursor-pointer"
              >
                {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{isGeneratingPdf ? 'Saving PDF...' : 'Download / Save as PDF'}</span>
              </button>

              <button
                type="button"
                onClick={handleStartNew}
                className="flex items-center gap-2 bg-sky-700 hover:bg-sky-800 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold shadow-sm transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.startNewBtn}</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Printable Document Metadata Bar (Visible in Print Only) */}
        <div className="hidden print:flex items-center justify-between border-2 border-slate-900 p-2.5 mb-3 rounded-md text-xs font-mono font-bold text-black">
          <span>ID NO: {getIdPrefix(formData.agreementDate)}{formData.idSuffix}</span>
          <span>BOOKING REF: #{formData.invoiceNo || 'WALK-IN'}</span>
          <span>PRIMARY GUEST: {formData.guestName || guestList[0]?.name || 'N/A'}</span>
          <span>DATE: {formData.agreementDate || new Date().toISOString().split('T')[0]}</span>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-red-50 border-2 border-red-500 text-red-800 text-xs font-bold rounded-lg print:hidden flex items-start gap-2.5 shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-extrabold uppercase block text-[11px] text-red-900">Form Incomplete</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}


        {/* FORM CONTAINER */}
        <form onSubmit={handleSubmit} className={`space-y-6 print:space-y-4 ${submitted ? 'hidden print:block' : ''}`}>
          
          {/* DECLARATION / SAFETY INFORMATION (Top Section) */}
          <div id="step-safety-terms" className="space-y-3 border-b-2 border-slate-900 pb-5 print:pb-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <h3 className="font-serif font-black text-sm sm:text-base text-black uppercase tracking-wider flex items-center gap-2">
                <span>Water Sports Liability Waiver &amp; Safety Information</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium italic print:hidden">Read carefully before signing</span>
            </div>

            {/* Terms List (Bulleted with ➤ arrow-style bullets) */}
            <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-[13px] leading-relaxed text-slate-900 font-sans print:text-[11px] print:leading-tight">
              {t.terms.map((term, index) => (
                <div key={index} className="flex items-start gap-2.5">
                  <span className="text-sky-700 font-black shrink-0 text-sm print:text-black">➤</span>
                  <span>{term}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DECLARATION ID */}
          <div id="step-declaration-id" className="border-2 border-slate-900 rounded-lg p-3.5 sm:p-4 bg-sky-50/80 space-y-2 print:p-2.5 print:bg-transparent">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <label htmlFor="idSuffixInput" className="text-xs font-serif font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Declaration ID / Counter Ticket No.</span>
                  <span className="text-red-600 print:hidden">*</span>
                </label>
                <p className="text-[11px] text-slate-600 print:hidden font-medium mt-0.5">
                  Prefix starts with <span className="font-mono font-bold text-slate-900">JWS</span> + Date (<span className="font-mono font-bold text-slate-900">{getIdPrefix(formData.agreementDate)}</span>). Enter the <strong>Counter Ticket Number</strong> (last 2 to 4 digits).
                </p>
              </div>

              {/* ID Badge + Editable Suffix Input */}
              <div className="flex flex-col items-start sm:items-end gap-1">
                <span className="text-[10px] font-bold text-sky-900 uppercase font-sans print:hidden">
                  Counter Ticket No. (2–4 Digits) <span className="text-red-600">*</span>
                </span>
                <div className="flex items-center bg-white border-2 border-slate-900 rounded-lg overflow-hidden shadow-2xs font-mono">
                  <span className="bg-slate-900 text-white font-black px-3 py-1.5 text-xs sm:text-sm tracking-wider select-none shrink-0 print:bg-slate-200 print:text-black">
                    {getIdPrefix(formData.agreementDate)}
                  </span>
                  <input
                    id="idSuffixInput"
                    type="text"
                    name="idSuffix"
                    value={formData.idSuffix}
                    onChange={handleChange}
                    placeholder="e.g. 1234"
                    maxLength={8}
                    required
                    className="w-24 sm:w-28 px-2.5 py-1.5 text-slate-900 font-extrabold text-xs sm:text-sm focus:outline-none focus:bg-amber-50 uppercase tracking-widest placeholder:text-slate-400 font-sans"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-700 border-t border-sky-200/80 pt-1.5 print:border-slate-800">
              <span>
                Full Declaration ID: {' '}
                {formData.idSuffix.trim() ? (
                  <strong className="text-sky-900 font-black text-xs sm:text-sm tracking-wider print:text-black">
                    {getIdPrefix(formData.agreementDate)}{formData.idSuffix.trim()}
                  </strong>
                ) : (
                  <span className="text-amber-800 font-bold italic font-sans text-xs">
                    {getIdPrefix(formData.agreementDate)} <span className="underline decoration-dashed">(Enter Counter Ticket No.)</span>
                  </span>
                )}
              </span>
              <span className="text-[10px] text-slate-500 font-sans italic print:hidden">Mandatory Counter Ticket No.</span>
            </div>
          </div>

          {/* PARTICIPANT / GUEST COUNT */}
          <div id="step-guest-count" className="border border-slate-800 rounded-lg p-4 sm:p-5 bg-white space-y-3 print:p-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
              <div>
                <h3 className="font-serif font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>{t.totalGuestsLabel}</span>
                  <span className="text-red-600 print:hidden">*</span>
                </h3>
                <p className="text-[11px] text-slate-600 print:hidden font-medium">
                  {t.totalGuestsSubtitle}
                </p>
              </div>

              {/* Guest Count Selector (1-20) */}
              <div className="flex items-center gap-2">
                <span className="hidden print:inline-block font-bold text-black text-sm">
                  {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                </span>
                <select
                  value={guestCount}
                  onChange={(e) => handleGuestCountChange(parseInt(e.target.value) || 1)}
                  className="bg-sky-50 border-2 border-sky-700 text-sky-950 font-black text-sm rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer shadow-2xs focus:ring-2 focus:ring-sky-500 print:hidden"
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* GUEST / PARTICIPANT DETAILS */}
            <div id="step-guest-details" className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>{t.guestListHeader}</span>
                </h4>
                <span className="text-[11px] font-semibold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full font-sans print:bg-slate-200 print:text-black">
                  {guestCount} {guestCount === 1 ? 'Participant' : 'Participants'}
                </span>
              </div>

              {/* Grid of Compact Participant Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:gap-2">
                {guestList.map((g, idx) => {
                  const isMinor = parseInt(g.age, 10) < 18;
                  return (
                    <div
                      key={idx}
                      id={`field-guest-name-${idx}`}
                      className={`p-3 rounded-lg border-2 flex flex-col gap-2 shadow-2xs print:bg-transparent print:border-slate-800 print:p-2 print:shadow-none ${
                        isMinor ? 'bg-amber-50/70 border-amber-400' : 'bg-slate-50/70 border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-sky-900 bg-sky-100 px-2 py-0.5 rounded font-mono print:bg-slate-200 print:text-black">
                          GUEST {idx + 1}
                        </span>
                        {isMinor && (
                          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full uppercase print:border print:border-black">
                            Minor (&lt;18 yrs)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase print:text-slate-800">
                            {t.guestNameLabel} {idx === 0 && <span className="text-red-600 print:hidden">*</span>}
                          </label>
                          <input
                            type="text"
                            value={g.name}
                            onChange={(e) => handleGuestItemChange(idx, 'name', e.target.value)}
                            placeholder={idx === 0 ? t.guestNamePlaceholder : `Guest ${idx + 1} Full Name`}
                            required={idx === 0}
                            className="w-full border-b border-dotted border-slate-700 bg-transparent px-1 py-0.5 text-xs font-semibold focus:outline-none focus:border-sky-600 text-slate-900 print:font-bold print:text-black print:border-solid print:border-black"
                          />
                        </div>

                        <div className="w-14 shrink-0">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase text-center print:text-slate-800">
                            {t.ageLabel} *
                          </label>
                          <input
                            type="text"
                            value={g.age}
                            onChange={(e) => handleGuestItemChange(idx, 'age', e.target.value)}
                            placeholder={t.agePlaceholder}
                            maxLength={3}
                            className="w-full border-b border-dotted border-slate-700 bg-transparent px-1 py-0.5 text-xs font-semibold focus:outline-none focus:border-sky-600 text-center text-slate-900 print:font-bold print:text-black print:border-solid print:border-black"
                          />
                        </div>

                        <div className="w-20 shrink-0">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase text-center print:text-slate-800">
                            Gender
                          </label>
                          <select
                            value={g.gender || ''}
                            onChange={(e) => handleGuestItemChange(idx, 'gender', e.target.value)}
                            className="w-full border-b border-dotted border-slate-700 bg-transparent px-0.5 py-0.5 text-xs font-semibold focus:outline-none focus:border-sky-600 text-center text-slate-900 cursor-pointer print:font-bold print:text-black print:border-solid print:border-black"
                          >
                            <option value="">- Gender -</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Guardian Section if Minors (<18) exist */}
              {formData.hasMinor && (
                <div className="mt-3 p-3.5 bg-amber-50 border-2 border-amber-400 rounded-lg space-y-2.5 print:bg-transparent print:border-slate-800">
                  <h4 className="font-serif font-extrabold text-xs text-amber-950 uppercase tracking-wide flex items-center gap-1.5 print:text-black">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 print:hidden" />
                    <span>{t.guardianHeader}</span>
                  </h4>
                  <p className="text-[11px] text-amber-900 print:text-slate-800 italic">
                    {t.guardianNote}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase">
                        {t.guardianNameLabel} *
                      </label>
                      <input
                        type="text"
                        name="guardianName"
                        value={formData.guardianName}
                        onChange={handleChange}
                        placeholder={t.guardianNamePlaceholder}
                        required={formData.hasMinor}
                        className="w-full border-b-2 border-dotted border-amber-800 bg-transparent px-1 py-0.5 text-xs font-bold focus:outline-none text-slate-900 print:border-solid print:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase">
                        Guardian Contact Phone *
                      </label>
                      <input
                        type="tel"
                        name="guardianPhone"
                        value={formData.guardianPhone}
                        onChange={handleChange}
                        placeholder={t.guardianPhonePlaceholder}
                        required={formData.hasMinor}
                        className="w-full border-b-2 border-dotted border-amber-800 bg-transparent px-1 py-0.5 text-xs font-bold focus:outline-none text-slate-900 print:border-solid print:border-black"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PRIMARY CONTACT / COMMUNICATION DETAILS */}
          <div id="step-primary-contact" className="border border-slate-800 rounded-lg p-4 sm:p-5 bg-white space-y-3.5 print:p-3">
            <div>
              <h3 className="font-serif font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1.5">
                <span>{t.primaryContactHeader}</span>
              </h3>
              <p className="text-[11px] text-slate-600 print:hidden font-medium mt-1">
                {t.primaryContactSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
              {/* Full Address */}
              <div id="field-address" className="md:col-span-2 space-y-1">
                <label className="text-xs font-serif font-bold text-slate-900 uppercase">
                  {t.commAddressLabel}
                </label>
                <input
                  type="text"
                  name="communicationAddress"
                  value={formData.communicationAddress}
                  onChange={handleChange}
                  placeholder={t.commAddressPlaceholder}
                  className="w-full border-b-2 border-dotted border-slate-700 bg-transparent rounded-none px-1 py-1 text-sm font-medium focus:outline-none focus:border-solid focus:border-sky-600 print:font-bold print:text-black print:border-solid print:border-black"
                />
              </div>

              {/* Telephone / Mobile No */}
              <div id="field-phone" className="space-y-1">
                <label className="text-xs font-serif font-bold text-slate-900 uppercase">
                  {t.phoneLabel} <span className="text-red-600 print:hidden">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder={t.phonePlaceholder}
                  className="w-full border-b-2 border-dotted border-slate-700 bg-transparent rounded-none px-1 py-1 text-sm font-semibold focus:outline-none focus:border-solid focus:border-sky-600 print:font-bold print:text-black print:border-solid print:border-black"
                />
              </div>

              {/* Email Address */}
              <div id="field-email" className="space-y-1">
                <label className="text-xs font-serif font-bold text-slate-900 uppercase">
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t.emailPlaceholder}
                  className="w-full border-b-2 border-dotted border-slate-700 bg-transparent rounded-none px-1 py-1 text-sm font-medium focus:outline-none focus:border-solid focus:border-sky-600 print:font-bold print:text-black print:border-solid print:border-black"
                />
              </div>
            </div>
          </div>

          {/* ACTIVITY SELECTION */}
          <div id="step-activities" className="border border-slate-800 rounded-lg p-4 sm:p-5 bg-white space-y-3.5 print:p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div>
                <h3 className="font-serif font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>{t.activitiesHeader}</span>
                </h3>
                <p className="text-[11px] text-slate-600 print:hidden font-medium mt-0.5">
                  Select water sports activities participating in this trip:
                </p>
              </div>

              {/* Interaction Mode Toggle */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg print:hidden">
                <button
                  type="button"
                  onClick={() => setApplyToAllGuests(true)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                    applyToAllGuests ? 'bg-sky-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.applyToAllGuestsLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setApplyToAllGuests(false)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                    !applyToAllGuests ? 'bg-sky-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.customizePerGuestLabel}
                </button>
              </div>
            </div>

            {/* Mode A: Group Level Activity Selector */}
            {applyToAllGuests ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 print:flex print:flex-wrap print:gap-2">
                {DECLARATION_ACTIVITIES.map((act) => {
                  const isChecked = selectedActivities.includes(act);
                  return (
                    <button
                      key={act}
                      type="button"
                      onClick={() => handleActivityToggleGroup(act)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border-2 text-xs font-extrabold transition-all text-left cursor-pointer select-none ${
                        isChecked
                          ? 'border-sky-700 bg-sky-50/80 text-sky-950 shadow-2xs print:border-black print:bg-slate-100 print:text-black'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 print:hidden'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        isChecked ? 'bg-sky-700 border-sky-700 text-white print:bg-black print:border-black' : 'border-slate-400 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span>{act}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Mode B: Per Participant Activity Customization */
              <div className="space-y-3">
                {guestList.map((g, gIdx) => (
                  <div key={gIdx} className="p-3 border border-slate-300 rounded-lg bg-slate-50 space-y-2">
                    <span className="text-xs font-black text-sky-950 uppercase">
                      Guest {gIdx + 1}: {g.name || `Participant ${gIdx + 1}`}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {DECLARATION_ACTIVITIES.map((act) => {
                        const guestActs = perGuestActivities[gIdx] || selectedActivities;
                        const isChecked = guestActs.includes(act);
                        return (
                          <button
                            key={act}
                            type="button"
                            onClick={() => handleActivityTogglePerGuest(gIdx, act)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-bold cursor-pointer ${
                              isChecked ? 'bg-sky-900 border-sky-900 text-white' : 'bg-white border-slate-300 text-slate-700'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            <span>{act}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="hidden print:block text-xs font-bold font-serif text-slate-900 border-t border-slate-200 pt-1.5">
              Selected Activities: {selectedActivities.join(', ')}
            </div>
          </div>

          {/* FINAL CONFIRMATION */}
          <div id="field-confirmation" className="border-2 border-slate-900 rounded-lg p-4 sm:p-5 bg-amber-50/60 space-y-3 print:bg-transparent">
            <h3 className="font-serif font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-amber-200/80 pb-1.5 print:border-slate-800">
              <span>{t.finalDeclarationHeader}</span>
            </h3>

            <p className="text-xs sm:text-[13px] font-medium text-slate-900 leading-relaxed">
              "{t.finalDeclarationText}"
            </p>

            <label className="flex items-start gap-3 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                name="finalConfirmationAgreed"
                checked={formData.finalConfirmationAgreed}
                onChange={handleChange}
                required
                className="mt-0.5 w-4.5 h-4.5 accent-sky-900 border-2 border-slate-800 rounded cursor-pointer shrink-0"
              />
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                {t.finalDeclarationCheckboxLabel} <span className="text-red-600 print:hidden">*</span>
              </span>
            </label>
          </div>

          {/* GUEST SIGNATURE & DATE */}
          <div id="field-signature" className="border border-slate-800 rounded-lg p-4 sm:p-5 bg-white space-y-4 print:p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <h3 className="font-serif font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>{t.guestSigLabel}</span>
                <span className="text-red-600 print:hidden">*</span>
              </h3>

              {/* Single vs Multi signature toggle for group bookings */}
              {guestCount > 1 && (
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg text-[11px] font-bold print:hidden">
                  <button
                    type="button"
                    onClick={() => setIsGroupSignature(true)}
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                      isGroupSignature ? 'bg-sky-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    {t.signForGroupLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGroupSignature(false)}
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                      !isGroupSignature ? 'bg-sky-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    {t.individualSignaturesLabel}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                {isGroupSignature ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Type Full Legal Name as Digital Signature <span className="text-red-600 print:hidden">*</span>
                      </label>
                      {(formData.guestName || guestList[0]?.name) && (
                        <button
                          type="button"
                          onClick={() => {
                            const nameToUse = formData.guestName || guestList[0]?.name || '';
                            setFormData(prev => ({ ...prev, signature: nameToUse }));
                          }}
                          className="text-[11px] text-sky-800 font-bold hover:underline cursor-pointer flex items-center gap-1 print:hidden"
                        >
                          <span>Use "{formData.guestName || guestList[0]?.name}"</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      name="signature"
                      value={formData.signature}
                      onChange={(e) => setFormData(prev => ({ ...prev, signature: e.target.value }))}
                      placeholder="Type full legal name as digital signature..."
                      required
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:border-sky-700 print:border-b-2 print:border-solid print:border-black print:bg-transparent"
                    />
                    {formData.signature && (
                      <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] uppercase font-mono text-slate-500 font-bold">Digital Signature Preview:</span>
                          <p className="font-serif italic font-bold text-base sm:text-lg text-sky-950 tracking-wider">
                            /s/ {formData.signature}
                          </p>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase print:hidden">
                          Verified
                        </span>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500 italic print:hidden">
                      By typing your full legal name, you confirm and declare that this serves as your legally binding digital signature.
                    </p>
                  </div>
                ) : (
                  /* Per Participant Signatures */
                  <div className="space-y-3">
                    <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Participant Digital Typed Signatures <span className="text-red-600 print:hidden">*</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {guestList.map((g, gIdx) => {
                        const currentSig = perGuestSignatures[gIdx] ?? (gIdx === 0 ? formData.signature : '');
                        return (
                          <div key={gIdx} className="p-3 border border-slate-300 rounded-lg bg-slate-50 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-black text-slate-800 uppercase">
                                Guest {gIdx + 1}: {g.name || `Participant ${gIdx + 1}`}
                              </label>
                              {g.name && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPerGuestSignatures(prev => ({ ...prev, [gIdx]: g.name }));
                                    if (gIdx === 0) setFormData(prev => ({ ...prev, signature: g.name }));
                                  }}
                                  className="text-[10px] text-sky-800 font-bold hover:underline cursor-pointer print:hidden"
                                >
                                  Use Name
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={currentSig}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPerGuestSignatures(prev => ({ ...prev, [gIdx]: val }));
                                if (gIdx === 0) setFormData(prev => ({ ...prev, signature: val }));
                              }}
                              placeholder={`Type signature for Guest ${gIdx + 1}`}
                              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-700"
                            />
                            {currentSig && (
                              <p className="font-serif italic font-bold text-xs text-sky-950 tracking-wider pt-0.5">
                                /s/ {currentSig}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* DATE (Auto-populated current date) */}
              <div className="space-y-1 flex flex-col justify-end">
                <label className="text-xs font-serif font-black text-slate-900 uppercase flex items-center gap-1.5 mb-1">
                  <span>{t.dateLabel}</span>
                </label>
                <input
                  type="date"
                  name="agreementDate"
                  value={formData.agreementDate}
                  readOnly
                  tabIndex={-1}
                  className="w-full border-b-2 border-dotted border-slate-700 bg-slate-50 px-2 py-1.5 text-xs sm:text-sm font-extrabold text-slate-900 cursor-not-allowed select-none print:bg-transparent print:border-solid print:border-black"
                />
                <span className="text-[10px] text-slate-500 italic print:hidden">Auto-generated booking date</span>
              </div>
            </div>
          </div>

          {/* FINAL REVIEW + SUBMIT SUMMARY BOX */}
          <div id="step-summary" className="border-2 border-slate-900 rounded-lg p-4 bg-sky-50/60 space-y-3 print:hidden">
            <h3 className="font-serif font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-sky-200 pb-1.5">
              <span>{t.summaryHeader}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-white p-2 rounded border border-slate-300">
                <span className="block text-[10px] font-sans text-slate-500 font-bold uppercase">Declaration ID</span>
                <strong className="text-sky-950 font-black">
                  {formData.idSuffix.trim() ? `${getIdPrefix(formData.agreementDate)}${formData.idSuffix.trim()}` : `${getIdPrefix(formData.agreementDate)} (Pending Ticket #)`}
                </strong>
              </div>
              <div className="bg-white p-2 rounded border border-slate-300">
                <span className="block text-[10px] font-sans text-slate-500 font-bold uppercase">Total Guests</span>
                <strong className="text-slate-900 font-black">{guestCount} Guests</strong>
              </div>
              <div className="bg-white p-2 rounded border border-slate-300">
                <span className="block text-[10px] font-sans text-slate-500 font-bold uppercase">Primary Contact</span>
                <strong className="text-slate-900 font-black truncate block">{formData.phone || 'Not Entered'}</strong>
              </div>
              <div className="bg-white p-2 rounded border border-slate-300">
                <span className="block text-[10px] font-sans text-slate-500 font-bold uppercase">Signature Status</span>
                <strong className={`font-black ${formData.signature ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {formData.signature ? 'Ready ✓' : 'Pending'}
                </strong>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[11px] text-slate-600 italic">
                {t.footerNotice}
              </p>

              <button
                type="submit"
                disabled={loading || !formData.finalConfirmationAgreed || !formData.phone}
                className="w-full sm:w-auto bg-[#091F44] hover:bg-[#004E98] text-white px-8 py-3 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                {loading ? (
                  <span>{t.submittingBtn}</span>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>{t.submitBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
