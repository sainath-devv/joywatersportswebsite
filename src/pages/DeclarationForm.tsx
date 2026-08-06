import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Printer, CheckCircle2, ArrowLeft, RotateCcw, PenTool, FileText, Anchor, Languages, Ticket, ShieldCheck, ArrowRight, Search, Download, Loader2, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatSafeErrorMessage } from '../lib/errorHandler';
import SignaturePad from '../components/common/SignaturePad';

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
  terms: string[];
  guestDetailsHeader: string;
  totalGuestsLabel: string;
  guestListHeader: string;
  guestNumberLabel: (n: number) => string;
  ageLabel: string;
  agePlaceholder: string;
  guestNameLabel: string;
  guestNamePlaceholder: string;
  commAddressLabel: string;
  commAddressPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  guestSigLabel: string;
  dateLabel: string;
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
    errName: "Please enter Guest Name.",
    errPhone: "Please enter Telephone / Mobile Number.",
    errSig: "Please provide Guest Signature before submitting.",
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
    guestDetailsHeader: "GUEST DETAILS",
    totalGuestsLabel: "Total Number of Guests (Max 20)",
    guestListHeader: "Guest Name & Age List",
    guestNumberLabel: (n) => `Guest ${n}`,
    ageLabel: "Age",
    agePlaceholder: "Age",
    guestNameLabel: "Guest Name",
    guestNamePlaceholder: "Enter full guest name",
    commAddressLabel: "Communication Address",
    commAddressPlaceholder: "Enter full communication address",
    phoneLabel: "Telephone / Mobile No",
    phonePlaceholder: "+91 98765 43210",
    emailLabel: "Email Address",
    emailPlaceholder: "guest@example.com",
    guestSigLabel: "Guest Signature",
    dateLabel: "Date",
    guardianHeader: "GUARDIAN DETAILS",
    guardianNote: "In case of children the age of above 16 years or below, the Guardian of the children should submit liability release and assumption of risk agreement-",
    guardianNameLabel: "Guardian Name",
    guardianNamePlaceholder: "Guardian full name (if applicable)",
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
    submitBtn: "Submit",
    submittingBtn: "Submitting...",
    footerNotice: "By clicking Submit Waiver, you acknowledge that all information provided is accurate and legally binding."
  },
  ml: {
    title: "ജോയ് വാട്ടർ സ്പോർട്സ്",
    subtitle: "വാട്ടർ സ്പോർട്സ് ബാധ്യത ഒഴിവാക്കൽ കരാർ",
    location: "വർക്കല ബീച്ച്, കേരളം • ഡിജിറ്റൽ ലീഗൽ ഡിക്ലറേഷൻ",
    selectLanguage: "താല്പര്യമുള്ള ഭാഷ",
    printForm: "ഫോം പ്രിൻ്റ് ചെയ്യുക",
    backToHome: "ഹോമിലേക്ക് മടങ്ങുക",
    submittedSuccessTitle: "ബാധ്യതാ നിരാകരണ ഫോം വിജയകരമായി സമർപ്പിച്ചു!",
    submittedSuccessMsg: (name) => `നന്ദി, ${name}. നിങ്ങളുടെ ബാധ്യതാ കരാർ രേഖപ്പെടുത്തുകയും ബുക്കിംഗ് പാസുമായി ബന്ധിപ്പിക്കുകയും ചെയ്തിട്ടുണ്ട്.`,
    printCompleted: "പൂർത്തിയാക്കിയ കോപ്പി പ്രിൻ്റ് ചെയ്യുക",
    returnHome: "ഹോം പേജിലേക്ക് മടങ്ങുക",
    errName: "ദയവായി അതിഥിയുടെ പേര് നൽകുക.",
    errPhone: "ദയവായി ഫോൺ / മൊബൈൽ നമ്പർ നൽകുക.",
    errSig: "സമർപ്പിക്കുന്നതിന് മുൻപ് അതിഥിയുടെ ഒപ്പ് നൽകുക.",
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
    guestDetailsHeader: "അതിഥിയുടെ വിവരങ്ങൾ",
    totalGuestsLabel: "ആകെ അതിഥികളുടെ എണ്ണം (പരമാവധി 20)",
    guestListHeader: "അതിഥികളുടെ പേരും വയസ്സും",
    guestNumberLabel: (n) => `അതിഥി ${n}`,
    ageLabel: "വയസ്സ്",
    agePlaceholder: "വയസ്സ്",
    guestNameLabel: "അതിഥിയുടെ പേര്",
    guestNamePlaceholder: "അതിഥിയുടെ മുഴുവൻ പേര് നൽകുക",
    commAddressLabel: "ബന്ധപ്പെടേണ്ട വിലാസം",
    commAddressPlaceholder: "മുഴുവൻ വിലാസം നൽകുക",
    phoneLabel: "ഫോൺ / മൊബൈൽ നമ്പർ",
    phonePlaceholder: "+91 98765 43210",
    emailLabel: "ഇമെയിൽ വിലാസം",
    emailPlaceholder: "guest@example.com",
    guestSigLabel: "അതിഥിയുടെ ഒപ്പ്",
    dateLabel: "തീയതി",
    guardianHeader: "രക്ഷിതാവിൻ്റെ വിവരങ്ങൾ",
    guardianNote: "16 വയസ്സോ അതിൽ കുറവോ പ്രായമുള്ള കുട്ടികളുടെ കാര്യത്തിൽ, കുട്ടികളുടെ രക്ഷിതാവ് ബാധ്യത റിലീസും അപകടസാധ്യത ഏറ്റെടുക്കൽ കരാറും സമർപ്പിക്കണം-",
    guardianNameLabel: "രക്ഷിതാവിൻ്റെ പേര്",
    guardianNamePlaceholder: "രക്ഷിതാവിൻ്റെ മുഴുവൻ പേര് (ബാധകമെങ്കിൽ)",
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
    submitBtn: "സമർപ്പിക്കുക",
    submittingBtn: "സമർപ്പിക്കുന്നു...",
    footerNotice: "സമർപ്പിക്കുക ബട്ടൺ ക്ലിക്കുചെയ്യുന്നതിലൂടെ, നൽകിയിട്ടുള്ള എല്ലാ വിവരങ്ങളും കൃത്യവും നിയമപരമായി ബാധകവുമാണെന്ന് നിങ്ങൾ അംഗീകരിക്കുന്നു."
  },
  ta: {
    title: "ஜாய் வாட்டர் ஸ்போர்ட்ஸ்",
    subtitle: "வாட்டர் ஸ்போர்ட்ஸ் பொறுப்புத் துறப்பு ஒப்பந்தம்",
    location: "வர்க்கலா பீச், கேரளா • டிஜிட்டல் சட்ட அறிவிப்பு",
    selectLanguage: "விரும்பும் மொழி",
    printForm: "படிவத்தை அச்சிடுக",
    backToHome: "முகப்பிற்குத் திரும்பு",
    submittedSuccessTitle: "பொறுப்புத் துறப்பு படிவம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!",
    submittedSuccessMsg: (name) => `நன்றி, ${name}. உங்கள் ஒப்பந்தம் பதிவுசெய்யப்பட்டு உங்கள் புக்கிங் பாஸுடன் இணைக்கப்பட்டுள்ளது.`,
    printCompleted: "பூர்த்தி செய்யப்பட்ட நகலை அச்சிடுக",
    returnHome: "முகப்புப் பக்கத்திற்குத் திரும்பு",
    errName: "தயவுசெய்து விருந்தினர் பெயரை உள்ளிடவும்.",
    errPhone: "தயவுசெய்து தொலைபேசி / மொபைல் எண்ணை உள்ளிடவும்.",
    errSig: "சமர்ப்பிப்பதற்கு முன் விருந்தினர் கையொப்பத்தை வழங்கவும்.",
    terms: [
      "இந்தச் செயல்பாட்டில் உள்ள ஆபத்துகள் குறித்து எனக்கு முழுமையாகத் தெரியும் என்றும், பாதுகாப்பு நடைமுறைகள் குறித்து எனக்கு விளக்கமளிக்கப்பட்டுள்ளது என்றும் சான்றளிக்கிறேன்.",
      "செய்ய வேண்டியவை மற்றும் செய்யக்கூடாதவை, மருத்துவக் கட்டுப்பாடுகள் மற்றும் உள்ளூர் அரசு விதிமுறைகள் பற்றி எனக்குத் தெரியும்.",
      "இந்தச் செயல்பாட்டை மேற்கொள்வதற்கு நான் உடலளவில் தகுதியுடன் இருக்கிறேன் என்றும், இதயம் சம்பந்தப்பட்ட பிரச்சினைகள், ரத்த அழுத்தம், ஆஸ்துமா போன்ற தீவிர மருத்துவப் பிரச்சினைகள் இல்லை என்றும் கூறுகிறேன்.",
      "இந்த ஒப்பந்தத்தில் கையெழுத்திட எனக்கு சட்டப்பூர்வ வயதும் தகுதியும் உள்ளது அல்லது எனது பெற்றோர்/காப்பாளரின் ஒப்புதலைப் பெற்றுள்ளேன் என்று கூறுகிறேன்.",
      "எனக்கு ஏற்படும் எந்தவொரு காயம், இறப்பு அல்லது பிற சேதங்களுக்கு ஜாய் வாட்டர் ஸ்போர்ட்ஸ் அல்லது அதன் ஊழியர்கள் பொறுப்பல்ல என்பதை ஒப்புக்கொள்கிறேன்.",
      "இங்குள்ள விதிமுறைகள் ஒப்பந்தத்திற்குட்பட்டவை என்றும், எனது சொந்த விருப்பத்தின் பேரில் கையெழுத்திடுகிறேன் என்றும் புரிந்து கொள்கிறேன்.",
      "இந்தச் செயல்பாட்டில் உள்ள அனைத்து ஆபத்துகளையும் ஏற்க ஒப்புக்கொள்கிறேன். எனது பங்கேற்பு முற்றிலும் தன்னிச்சையானது.",
      "இழப்பீடு: எனது அலட்சியத்தால் ஏற்படும் செலவுகள் அல்லது சேதங்களிலிருந்து நிறுவனத்தைப் பாதுகாக்கவும் இழப்பீடு வழங்கவும் ஒப்புக்கொள்கிறேன்."
    ],
    guestDetailsHeader: "விருந்தினர் விவரங்கள்",
    totalGuestsLabel: "மொத்த விருந்தினர்களின் எண்ணிக்கை (அதிகபட்சம் 20)",
    guestListHeader: "விருந்தினர்களின் பெயர் & வயது பட்டியல்",
    guestNumberLabel: (n) => `விருந்தினர் ${n}`,
    ageLabel: "வயது",
    agePlaceholder: "வயது",
    guestNameLabel: "விருந்தினர் பெயர்",
    guestNamePlaceholder: "முழு விருந்தினர் பெயரை உள்ளிடவும்",
    commAddressLabel: "தொடர்பு முகவரி",
    commAddressPlaceholder: "முழு முகவரியை உள்ளிடவும்",
    phoneLabel: "தொலைபேசி / மொபைல் எண்",
    phonePlaceholder: "+91 98765 43210",
    emailLabel: "மின்னஞ்சல் முகவரி",
    emailPlaceholder: "guest@example.com",
    guestSigLabel: "விருந்தினர் கையொப்பம்",
    dateLabel: "தேதி",
    guardianHeader: "காப்பாளர் விவரங்கள்",
    guardianNote: "16 வயது மற்றும் அதற்கு குறைவான சிறார்களுக்கு, அவர்களின் காப்பாளர் பொறுப்புத் துறப்பு ஒப்பந்தத்தைச் சமர்ப்பிக்க வேண்டும்-",
    guardianNameLabel: "காப்பாளர் பெயர்",
    guardianNamePlaceholder: "காப்பாளர் முழு பெயர் (பொருந்தினால்)",
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
    submitBtn: "சமர்ப்பி",
    submittingBtn: "சமர்ப்பிக்கப்படுகிறது...",
    footerNotice: "சமர்ப்பி என்பதைக் கிளிக் செய்வதன் மூலம், வழங்கப்பட்ட அனைத்துத் தகவல்களும் துல்லியமானவை மற்றும் சட்டப்பூர்வமானவை என்பதை ஒப்புக்கொள்கிறீர்கள்."
  },
  te: {
    title: "జాయ్ వాటర్ స్పోర్ట్స్",
    subtitle: "వాటర్ స్పోర్ట్స్ లైబిలిటీ వేవర్ ఒప్పందం",
    location: "వర్కల బీచ్, కేరళ • డిజిటల్ లీగల్ డిక్లరేషన్",
    selectLanguage: "ఎంచుకున్న భాష",
    printForm: "ఫారమ్‌ను ప్రింట్ చేయండి",
    backToHome: "హోమ్‌కి తిరిగి వెళ్ళండి",
    submittedSuccessTitle: "బాధ్యత మినహాయింపు మరియు ప్రకటన విజయవంతంగా సమర్పించబడింది!",
    submittedSuccessMsg: (name) => `ధన్యవాదాలు, ${name}. మీ మినహాయింపు ఒప్పందం నమోదు చేయబడింది మరియు మీ బుకింగ్ పాస్‌కు జోడించబడింది.`,
    printCompleted: "పూర్తి కాపీని ప్రింట్ చేయండి",
    returnHome: "హోమ్ పేజీకి తిరిగి వెళ్లండి",
    errName: "దయచేసి అతిథి పేరును నమోదు చేయండి.",
    errPhone: "దయచేసి టెలిఫోన్ / మొబైల్ సంఖ్యను నమోదు చేయండి.",
    errSig: "సమర్పించే ముందు దయచేసి సంతకం చేయండి.",
    terms: [
      "ఈ కార్యకలాపంలో ఉన్న ప్రమాదాల గురించి నాకు పూర్తిగా తెలుసని మరియు రక్షణ విధానాల గురించి నాకు వివరించబడిందని నేను ధృవీకరిస్తున్నాను.",
      "చేయవలసినవి మరియు చేయకూడనివి, వైద్య పరిమితులు మరియు స్థానిక ప్రభుత్వ నిబంధనల గురించి నాకు అవగాహన ఉంది.",
      "నేను ఈ కార్యకలాపాన్ని నిర్వహించడానికి శారీరకంగా ఫిట్‌గా ఉన్నానని మరియు ఎటువంటి గుండె జబ్బులు, రక్తపోటు, ఆస్తమా లేదా ఇతర తీవ్రమైన అనారోగ్యాలతో బాధపడటం లేదని తెలుపుతున్నాను.",
      "నేను ఈ ఒప్పందంపై సంతకం చేయడానికి వయస్సు మరియు చట్టబద్ధంగా అర్హుడనని లేదా నా తల్లిదండ్రులు/సంరక్షకుల రాతపూర్వక సమ్మతిని పొందుతున్నానని తదుపరి ప్రకటిస్తున్నాను.",
      "నాకు కలిగే ఏదైనా గాయం, మరణం లేదా ఇతర నష్టాలకు జాయ్ వాటర్ స్పోర్ట్స్ లేదా దాని ఉద్యోగులు బాధ్యత వహించరని నేను అర్థం చేసుకున్నాను మరియు అంగీకరిస్తున్నాను.",
      "ఇక్కడ ఉన్న నిబంధనలు ఒప్పందపరమైనవని మరియు నా చట్టపరమైన హక్కులను వదులుకోవడానికి సమ్మతిస్తూ నా సొంత నిర్ణయంతో సంతకం చేస్తున్నానని అర్థం చేసుకున్నాను.",
      "ఈ కార్యకలాపంలో ఉన్న అన్ని ప్రమాదాలను స్వీకరించడానికి నేను స్పష్టంగా అంగీకరిస్తున్నాను. నా భాగస్వామ్యం పూర్తిగా స్వచ్ఛందం.",
      "నష్టపరిహారం: నా నిర్లక్ష్యం లేదా తప్పు సమాచారం వలన కలిగే ఏదైనా ఖర్చులు లేదా నష్టాల నుండి కంపెనీని రక్షించడానికి మరియు పరిహారం చెల్లించడానికి నేను అంగీకరిస్తున్నాను."
    ],
    guestDetailsHeader: "అతిథి వివరాలు",
    totalGuestsLabel: "మొత్తం అతిథుల సంఖ్య (గరిష్టంగా 20)",
    guestListHeader: "అతిథుల పేరు & వయస్సు జాబితా",
    guestNumberLabel: (n) => `అతిథి ${n}`,
    ageLabel: "వయస్సు",
    agePlaceholder: "వయస్సు",
    guestNameLabel: "అతిథి పేరు",
    guestNamePlaceholder: "అతిథి పూర్తి పేరు నమోదు చేయండి",
    commAddressLabel: "చిరునామా",
    commAddressPlaceholder: "పూర్తి చిరునామా నమోదు చేయండి",
    phoneLabel: "టెలిఫోన్ / మొబైల్ నంబర్",
    phonePlaceholder: "+91 98765 43210",
    emailLabel: "ఈమెయిల్ చిరునామా",
    emailPlaceholder: "guest@example.com",
    guestSigLabel: "అతిథి సంతకం",
    dateLabel: "తేదీ",
    guardianHeader: "సంరక్షకుని వివరాలు",
    guardianNote: "16 సంవత్సరాలు లేదా అంతకంటే తక్కువ వయస్సు ఉన్న పిల్లల విషయంలో, వారి సంరక్షకులు బాధ్యత విముక్తి ఒప్పందాన్ని సమర్పించాలి-",
    guardianNameLabel: "సంరక్షకుని పేరు",
    guardianNamePlaceholder: "సంరక్షకుని పూర్తి పేరు (వర్తిస్తే)",
    guardianAddressPlaceholder: "సంరక్షకుని చిరునామా",
    guardianPhonePlaceholder: "సంరక్షకుని ఫోన్ నంబర్",
    guardianSigLabel: "సంరక్షకుని సంతకం",
    dateOfSailingLabel: "ప్రయాణ తేదీ :",
    invoiceNoLabel: "ఇన్‌వాయిస్ నంబర్ :",
    boardingPassNoLabel: "బోర్డింగ్ పాస్ నంబర్ :",
    tripTimeLabel: (n) => `ట్రిప్ ${n} సమయం :`,
    trip1Placeholder: "ఉదా: 10:00 AM",
    trip2Placeholder: "ఉదా: 11:30 AM",
    boatLabel: "బోట్ :",
    submitBtn: "సమర్పించండి",
    submittingBtn: "సమర్పిస్తోంది...",
    footerNotice: "సమర్పించు క్లిక్ చేయడం ద్వారా, అందించిన సమాచారం అంతా ఖచ్చితమైనదని మరియు చట్టబద్ధంగా కట్టుబడి ఉంటుందని మీరు అంగীకరిస్తున్నారు."
  },
  hi: {
    title: "जॉय वाटर स्पोर्ट्स",
    subtitle: "वाटर स्पोर्ट्स देयता छूट समझौता",
    location: "वरकला बीच, केरल • डिजिटल कानूनी घोषणा",
    selectLanguage: "पसंदीदा भाषा",
    printForm: "फॉर्म प्रिंट करें",
    backToHome: "होम पर वापस जाएं",
    submittedSuccessTitle: "देयता छूट और घोषणा सफलतापूर्वक जमा की गई!",
    submittedSuccessMsg: (name) => `धन्यवाद, ${name}। आपका घोषणा पत्र दर्ज कर लिया गया है और आपके बुकिंग पास से जोड़ दिया गया है।`,
    printCompleted: "पूर्ण प्रति प्रिंट करें",
    returnHome: "मुख्य पृष्ठ पर लौटें",
    errName: "कृपया अतिथि का नाम दर्ज करें।",
    errPhone: "कृपया टेलीफोन / मोबाइल नंबर दर्ज करें।",
    errSig: "कृपया जमा करने से पहले हस्ताक्षर करें।",
    terms: [
      "मैं प्रमाणित करता हूं कि मुझे इस गतिविधि में शामिल जोखिमों के बारे में पूरी जानकारी है और मुझे सुरक्षा प्रक्रियाओं के बारे में बताया गया है।",
      "मुझे क्या करना है और क्या नहीं, चिकित्सा प्रतिबंधों और स्थानीय सरकारी नियमों के बारे में जानकारी है।",
      "मैं घोषित करता हूं कि मैं गतिविधि करने के लिए शारीरिक रूप से स्वस्थ हूं और किसी भी दिल की बीमारी, रक्तचाप या सांस की समस्या से पीड़ित नहीं हूं।",
      "मैं आगे घोषित करता हूं कि मैं इस समझौते पर हस्ताक्षर करने के लिए वयस्क और सक्षम हूं या मैंने अभिभावक की सहमति प्राप्त कर ली है।",
      "मैं समझता हूं और सहमत हूं कि मुझे होने वाली किसी भी चोट, मृत्यु या अन्य नुकसान के लिए जॉय वाटर स्पोर्ट्स या उसके कर्मचारी जिम्मेदार नहीं होंगे।",
      "मैं समझता हूं कि यहां दी गई शर्तें अनुबंधात्मक हैं और मैं अपनी स्वेच्छा से इस समझौते पर हस्ताक्षर कर रहा हूं।",
      "मैं इस गतिविधि में मौजूद सभी जोखिमों को स्वीकार करने के लिए स्पष्ट रूप से सहमत हूं। मेरी भागीदारी पूरी तरह से स्वैच्छिक है।",
      "क्षतिपूर्ति: मैं अपनी लापरवाही या गलत जानकारी के कारण होने वाले किसी भी नुकसान से कंपनी की रक्षा करने और क्षतिपूर्ति करने के लिए सहमत हूं।"
    ],
    guestDetailsHeader: "अतिथि विवरण",
    totalGuestsLabel: "कुल मेहमानों की संख्या (अधिकतम 20)",
    guestListHeader: "मेहमानों का नाम और आयु सूची",
    guestNumberLabel: (n) => `मेहमान ${n}`,
    ageLabel: "आयु",
    agePlaceholder: "आयु",
    guestNameLabel: "अतिथि का नाम",
    guestNamePlaceholder: "अतिथि का पूरा नाम दर्ज करें",
    commAddressLabel: "संचार पता",
    commAddressPlaceholder: "पूरा पता दर्ज करें",
    phoneLabel: "टेलीफोन / मोबाइल नंबर",
    phonePlaceholder: "+91 98765 43210",
    emailLabel: "ईमेल पता",
    emailPlaceholder: "guest@example.com",
    guestSigLabel: "अतिथि के हस्ताक्षर",
    dateLabel: "दिनांक",
    guardianHeader: "अभिभावक विवरण",
    guardianNote: "16 वर्ष या उससे कम उम्र के बच्चों के मामले में, अभिभावक को देयता छूट समझौता जमा करना होगा-",
    guardianNameLabel: "अभिभावक का नाम",
    guardianNamePlaceholder: "अभिभावक का पूरा नाम (यदि लागू हो)",
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
    submitBtn: "जमा करें",
    submittingBtn: "जमा किया जा रहा है...",
    footerNotice: "जमा करें पर क्लिक करके, आप स्वीकार करते हैं कि प्रदान की गई सभी जानकारी सटीक और कानूनी रूप से बाध्यकारी है।"
  },
  bn: {
    title: "জয় ওয়াটার স্পোর্টস",
    subtitle: "ওয়াটার স্পোর্টস দায়মুক্তি চুক্তিপত্র",
    location: "ভারকালা বিচ, কেরালা • ডিজিটাল আইনি ঘোষণা",
    selectLanguage: "পছন্দের ভাষা",
    printForm: "ফর্ম প্রিন্ট করুন",
    backToHome: "হোমে ফিরে যান",
    submittedSuccessTitle: "দায়মুক্তি ফর্ম সফলভাবে জমা দেওয়া হয়েছে!",
    submittedSuccessMsg: (name) => `ধন্যবাদ, ${name}। আপনার দায়মুক্তি চুক্তিটি রেকর্ড করা হয়েছে এবং আপনার বুকিং পাসের সাথে যুক্ত করা হয়েছে।`,
    printCompleted: "সম্পূর্ণ কপি প্রিন্ট করুন",
    returnHome: "হোম পেজে ফিরে যান",
    errName: "অনুগ্রহ করে অতিথির নাম লিখুন।",
    errPhone: "অনুগ্রহ করে টেলিফোন / মোবাইল নম্বর লিখুন।",
    errSig: "জমা দেওয়ার আগে অনুগ্রহ করে স্বাক্ষর করুন।",
    terms: [
      "আমি প্রত্যয়ন করছি যে আমি এই কার্যকলাপে জড়িত ঝুঁকি সম্পর্কে পুরোপুরি সচেতন এবং আমাকে সুরক্ষা পদ্ধতি সম্পর্কে অবহিত করা হয়েছে।",
      "আমি কি করা উচিত এবং কি করা উচিত নয়, চিকিৎসা সংক্রান্ত বিধিনিষেধ এবং স্থানীয় সরকারি নিয়মাবলী সম্পর্কে অবগত।",
      "আমি উল্লেখ করছি যে আমি শারীরিকভাবে এই কার্যকলাপে অংশ নিতে সক্ষম এবং হৃদরোগ, রক্তচাপ, হাঁপানি বা অন্য কোনো মারাত্মক সমস্যায় ভুগছি না।",
      "আমি আরও উল্লেখ করছি যে আমি আইনিভাবে প্রাপ্তবয়স্ক এবং এই চুক্তিপত্রে স্বাক্ষর করতে সক্ষম অথবা আমি আমার অভিভাবকের লিখিত সম্মতি পেয়েছি।",
      "আমি বুঝতে পারছি এবং সম্মত হচ্ছি যে জয় ওয়াটার স্পোর্টস বা এর কর্মচারী/মালিকদের আমার কোনো আঘাত, মৃত্যু বা অন্য ক্ষতির জন্য দায়ী করা যাবে না।",
      "আমি বুঝতে পারছি যে এখানে উল্লেখিত শর্তাবলী চুক্তিভিত্তিক এবং আমি স্বেচ্ছায় আমার আইনি অধিকার ত্যাগ করে এই চুক্তিতে স্বাক্ষর করছি।",
      "আমি এই ক্রিয়াকলাপে বিদ্যমান সমস্ত ঝুঁকি গ্রহণ করতে স্পষ্টভাবে সম্মত। আমার অংশগ্রহণ সম্পূর্ণরূপে ঐচ্ছিক।",
      "ক্ষতিপূরণ: আমি (বা আমার প্রতিনিধি) আমার অবহেলা বা ভুল তথ্যের কারণে সৃষ্ট কোনো খরচ বা ক্ষতির বিরুদ্ধে কোম্পানিকে রক্ষা ও ক্ষতিপূরণ দিতে সম্মত।"
    ],
    guestDetailsHeader: "অতিথির বিবরণ",
    totalGuestsLabel: "মোট অতিথির সংখ্যা (সর্বোচ্চ ২০)",
    guestListHeader: "অতিথিদের নাম ও বয়সের তালিকা",
    guestNumberLabel: (n) => `অতিথি ${n}`,
    ageLabel: "বয়স",
    agePlaceholder: "বয়স",
    guestNameLabel: "অতিথির নাম",
    guestNamePlaceholder: "অতিথির পুরো নাম লিখুন",
    commAddressLabel: "যোগাযোগের ঠিকানা",
    commAddressPlaceholder: "সম্পূর্ণ যোগাযোগের ঠিকানা লিখুন",
    phoneLabel: "টেলিফোন / মোবাইল নম্বর",
    phonePlaceholder: "+91 98765 43210",
    emailLabel: "ইমেল ঠিকানা",
    emailPlaceholder: "guest@example.com",
    guestSigLabel: "অতিথির স্বাক্ষর",
    dateLabel: "তারিখ",
    guardianHeader: "অভিভাবকের বিবরণ",
    guardianNote: "১৬ বছর বা তার কম বয়সী শিশুদের ক্ষেত্রে, শিশুদের অভিভাবককে দায়মুক্তি চুক্তিপত্র জমা দিতে হবে-",
    guardianNameLabel: "অভিভাবকের নাম",
    guardianNamePlaceholder: "অভিভাবকের পুরো নাম (প্রযোজ্য হলে)",
    guardianAddressPlaceholder: "অভিভাবকের যোগাযোগের ঠিকানা",
    guardianPhonePlaceholder: "অভিভাবকের ফোন নম্বর",
    guardianSigLabel: "অভিভাবকের স্বাক্ষর",
    dateOfSailingLabel: "যাত্রার তারিখ :",
    invoiceNoLabel: "ইনভয়েস নম্বর :",
    boardingPassNoLabel: "বোর্ডিং পাস নম্বর :",
    tripTimeLabel: (n) => `ট্রিপ ${n} সময় :`,
    trip1Placeholder: "যেমন: 10:00 AM",
    trip2Placeholder: "যেমন: 11:30 AM",
    boatLabel: "বোট :",
    submitBtn: "জমা দিন",
    submittingBtn: "জমা হচ্ছে...",
    footerNotice: "জমা দিন বোতামে ক্লিক করে, আপনি স্বীকার করছেন যে প্রদান করা সমস্ত তথ্য সঠিক এবং আইনগতভাবে বাধ্যবাধকতাযুক্ত।"
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

  // Dynamic guest list state (Max 20 guests)
  const initialGuests = Math.min(20, Math.max(1, parseInt(searchParams.get('guests') || '1')));
  const [guestCount, setGuestCount] = useState<number>(initialGuests);
  const [guestList, setGuestList] = useState<{ name: string; age: string }[]>(() => {
    const list: { name: string; age: string }[] = [];
    for (let i = 0; i < initialGuests; i++) {
      list.push({
        name: i === 0 ? (searchParams.get('name') || '') : '',
        age: ''
      });
    }
    return list;
  });

  // Activities Selection State
  const [selectedActivities, setSelectedActivities] = useState<string[]>(() => {
    const actParam = searchParams.get('activities') || searchParams.get('activity');
    if (actParam) {
      const parsed = actParam.split(',').map(s => s.trim()).filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
    return ['Parasailing'];
  });

  const handleActivityToggle = (activityName: string) => {
    setSelectedActivities(prev => {
      if (prev.includes(activityName)) {
        if (prev.length === 1) return prev; // keep at least 1 activity selected
        return prev.filter(a => a !== activityName);
      } else {
        return [...prev, activityName];
      }
    });
  };

  // Helper for 24-hour format current IST time
  const get24HourISTTime = () => {
    return new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Form State matching original waiver layout
  const [formData, setFormData] = useState({
    guestName: searchParams.get('name') || '',
    communicationAddress: searchParams.get('address') || '',
    phone: searchParams.get('phone') || '',
    email: searchParams.get('email') || '',
    signature: '',
    agreementDate: searchParams.get('date') || new Date().toISOString().split('T')[0],
    declarationTime: searchParams.get('declarationTime') || searchParams.get('time') || get24HourISTTime(),

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

  // Online Booking Authentication Lookup state
  const [lookupInput, setLookupInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [verifiedBooking, setVerifiedBooking] = useState<any>(null);

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
      setVerifiedBooking(b);
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

  const handleGuestCountChange = (count: number) => {
    const newCount = Math.min(20, Math.max(1, count));
    setGuestCount(newCount);
    setGuestList(prev => {
      const list = [...prev];
      if (list.length < newCount) {
        for (let i = list.length; i < newCount; i++) {
          list.push({ name: '', age: '' });
        }
      } else if (list.length > newCount) {
        return list.slice(0, newCount);
      }
      return list;
    });
  };

  const handleGuestItemChange = (index: number, field: 'name' | 'age', value: string) => {
    setGuestList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    if (index === 0 && field === 'name') {
      setFormData(prev => ({ ...prev, guestName: value }));
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
          if (list[0]) {
            list[0] = { ...list[0], name: value };
          }
          return list;
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.guestName.trim()) {
      setErrorMessage(t.errName);
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage(t.errPhone);
      return;
    }
    if (!formData.signature) {
      setErrorMessage(t.errSig);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const activitiesStr = selectedActivities.join(', ');
      const directDeclarationScriptUrl = 'https://script.google.com/macros/s/AKfycbwltnDwvfSKPuHdJqmXtXBfgU2xRZJ0SOSadQbtIeIxoX2K1foJJNCOBuDMGspZEt5s6A/exec';

      const current24hTime = formData.declarationTime || get24HourISTTime();

      const payload = {
        bookingId: formData.invoiceNo || bookingIdParam || `WALKIN-${Date.now()}`,
        guestName: formData.guestName,
        totalGuests: guestCount,
        guestList: guestList,
        activities: selectedActivities,
        selectedActivities: activitiesStr,
        communicationAddress: formData.communicationAddress || 'Onsite Guest',
        phone: formData.phone,
        email: formData.email,
        signature: formData.signature,
        agreementDate: formData.agreementDate,
        declarationDate: formData.agreementDate,
        declarationTime: current24hTime,
        declarationFillingTime: current24hTime,
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
        language: selectedLang,
        source: bookingIdParam ? 'ONLINE_BOOKING_DECLARATION' : 'NAVBAR_DECLARATION',
        action: bookingIdParam ? 'ONLINE_DECLARATION' : 'GENERAL_DECLARATION'
      };

      // Direct backup sync to user's Google Apps Script web app
      try {
        fetch(directDeclarationScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            activities: activitiesStr,
            "Activities": activitiesStr,
            "Selected Activities": activitiesStr,
            guestNamesAndAges: guestList.map((g, i) => `${i + 1}. ${g.name || 'Guest'}${g.age ? ` (${g.age} yrs)` : ''}`).join(', '),
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            "Guest Name": formData.guestName,
            "Phone": formData.phone,
            "Email": formData.email,
            "Total Guests": guestCount,
            "Agreement Date": formData.agreementDate,
            "Declaration Date": formData.agreementDate,
            "Declaration Time": current24hTime,
            "Declaration Time (24h)": current24hTime,
            "Declaration Filling Time": current24hTime,
            "Signature": formData.signature
          })
        }).catch(() => {});
      } catch (e) {}

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
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const sanitizeCssText = (str: string) => {
            return str
              .replace(/oklab\([^)]+\)/gi, '#0f172a')
              .replace(/oklch\([^)]+\)/gi, '#0f172a')
              .replace(/color-mix\([^)]+\)/gi, '#0f172a')
              .replace(/color\([^)]+\)/gi, '#0f172a')
              .replace(/light-dark\([^)]+\)/gi, '#0f172a');
          };

          // Gather all CSS rules and remove original style tags so html2canvas doesn't read unsanitized CSSStyleSheet rules
          let aggregatedCss = '';

          const styleEls = Array.from(clonedDoc.querySelectorAll('style'));
          styleEls.forEach((s) => {
            if (s.textContent) {
              aggregatedCss += s.textContent + '\n';
            }
            if (s.parentNode) s.parentNode.removeChild(s);
          });

          const linkEls = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"]'));
          linkEls.forEach((link) => {
            try {
              const sheet = Array.from(document.styleSheets).find(
                (ss) => ss.href === (link as HTMLLinkElement).href || ss.ownerNode === link
              );
              if (sheet) {
                try {
                  const cssRules = Array.from(sheet.cssRules || []).map((r) => r.cssText).join('\n');
                  aggregatedCss += cssRules + '\n';
                } catch {
                  // cross-origin
                }
              }
            } catch {
              // ignore
            }
            if (link.parentNode) link.parentNode.removeChild(link);
          });

          // Inject single clean, sanitized style tag
          const cleanStyle = clonedDoc.createElement('style');
          cleanStyle.textContent = sanitizeCssText(aggregatedCss);
          clonedDoc.head.appendChild(cleanStyle);

          // Sanitize inline style attributes on all cloned elements
          const allEls = clonedDoc.querySelectorAll('*');
          allEls.forEach((el) => {
            const inlineStyle = el.getAttribute('style');
            if (inlineStyle && /(oklab|oklch|color-mix|color|light-dark)\([^)]+\)/i.test(inlineStyle)) {
              el.setAttribute('style', sanitizeCssText(inlineStyle));
            }
          });

          const clonedArea = clonedDoc.getElementById('declaration-printable-area');
          if (clonedArea) {
            clonedArea.style.display = 'block';
            clonedArea.style.maxWidth = '800px';
            clonedArea.style.padding = '24px';
            clonedArea.style.backgroundColor = '#ffffff';

            const form = clonedArea.querySelector('form');
            if (form) {
              form.classList.remove('screen-only-hide-when-submitted');
              form.style.display = 'block';
              form.style.visibility = 'visible';
            }

            // Reveal hidden print blocks like Selected Activities summary
            const printBlockElements = clonedArea.querySelectorAll('.hidden.print\\:block');
            printBlockElements.forEach((el) => {
              (el as HTMLElement).style.display = 'block';
            });

            // Convert interactive inputs/selects into visible text blocks so html2canvas captures filled values cleanly
            const inputs = clonedArea.querySelectorAll('input, textarea, select');
            inputs.forEach((inputEl) => {
              const el = inputEl as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
              if (el.type === 'checkbox' || el.type === 'radio' || el.type === 'hidden' || el.type === 'submit') {
                return;
              }
              const val = el.value || '';
              const textSpan = clonedDoc.createElement('span');
              textSpan.className = 'font-bold text-black text-xs sm:text-sm block py-1 border-b border-black';
              textSpan.textContent = val || '—';
              if (el.parentNode) {
                el.style.display = 'none';
                el.parentNode.insertBefore(textSpan, el);
              }
            });

            // Handle Signatures in PDF export
            if (formData.signature) {
              const sigFields = clonedArea.querySelectorAll('#field-signature');
              sigFields.forEach((field) => {
                if (formData.signature.startsWith('data:image')) {
                  const img = clonedDoc.createElement('img');
                  img.src = formData.signature;
                  img.className = 'max-h-16 w-auto object-contain border-b border-black py-1 my-1';
                  field.appendChild(img);
                  const canvasEl = field.querySelector('canvas');
                  if (canvasEl) canvasEl.style.display = 'none';
                } else if (formData.signature.startsWith('typed:')) {
                  const typedVal = formData.signature.replace('typed:', '');
                  const span = clonedDoc.createElement('span');
                  span.className = 'font-serif italic font-bold text-base text-black block py-1 border-b border-black';
                  span.textContent = typedVal;
                  field.appendChild(span);
                }
              });
            }

            const printHiddenElements = clonedArea.querySelectorAll('.print\\:hidden');
            printHiddenElements.forEach((el) => {
              (el as HTMLElement).style.display = 'none';
            });

            const metaBar = clonedArea.querySelector('.print\\:flex');
            if (metaBar) {
              (metaBar as HTMLElement).style.display = 'flex';
            }
          }
        }
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

      const docRef = formData.invoiceNo || bookingIdParam || 'DECLARATION';
      const guestNameClean = (formData.guestName || guestList[0]?.name || 'Guest').trim().replace(/\s+/g, '_');
      pdf.save(`Declaration_Form_${docRef}_${guestNameClean}.pdf`);
    } catch (error) {
      console.error('PDF generation error, falling back to print dialog:', error);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 lg:px-8 text-slate-900 font-sans print:bg-white print:p-0">
      {/* Top Controls Bar (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-sky-700 bg-white px-3.5 py-2 rounded-lg border border-slate-300 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToHome}
        </button>

        {/* Top Language Select Dropdown in Controls Bar */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-300 shadow-sm">
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isGeneratingPdf ? 'Saving PDF...' : 'Save as PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Printed Document Outer Border Frame */}
      <div id="declaration-printable-area" className="max-w-4xl mx-auto bg-white border border-slate-900 shadow-xl p-5 sm:p-8 md:p-10 print:shadow-none print:border-slate-900 print:p-6 print:max-w-none">
        
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



        {/* Confirmation Banner if Submitted (Hidden in Print so print output is clean document) */}
        {submitted ? (
          <div className="my-6 p-6 sm:p-8 bg-emerald-50 border-2 border-emerald-600 rounded-2xl text-center space-y-4 shadow-xl print:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-emerald-800 tracking-widest uppercase bg-emerald-100 px-3 py-1 rounded-full inline-block">
                AUTHENTICATED &amp; VERIFIED
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 uppercase pt-1">
                {t.submittedSuccessTitle}
              </h3>
              <p className="text-sm font-semibold text-slate-700 max-w-lg mx-auto">
                {t.submittedSuccessMsg(formData.guestName)}
              </p>
            </div>

            {formData.invoiceNo && (
              <div className="bg-white border border-emerald-200 rounded-xl p-3 max-w-md mx-auto text-xs text-slate-700 flex justify-between items-center font-mono shadow-2xs">
                <span>Linked Booking Ref:</span>
                <strong className="text-emerald-700 font-bold text-sm">#{formData.invoiceNo}</strong>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPdf ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Download className="w-4 h-4.5" />}
                <span>{isGeneratingPdf ? 'Saving PDF...' : 'Save as PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold hover:bg-sky-700 shadow-md transition-all cursor-pointer"
              >
                {t.returnHome}
              </button>
            </div>
          </div>
        ) : null}

        {/* Printable Document Metadata Bar (Visible in Print Only) */}
        <div className="hidden print:flex items-center justify-between border-2 border-slate-900 p-2.5 mb-3 rounded-md text-xs font-mono font-bold text-black">
          <span>BOOKING REF: #{formData.invoiceNo || 'WALK-IN'}</span>
          <span>PRIMARY GUEST: {formData.guestName || guestList[0]?.name || 'N/A'}</span>
          <span>PHONE: {formData.phone || 'N/A'}</span>
          <span>DATE: {formData.agreementDate || new Date().toISOString().split('T')[0]}</span>
        </div>

        {/* Error Message Box */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-bold rounded print:hidden">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className={`space-y-6 print:space-y-4 ${submitted ? 'screen-only-hide-when-submitted' : ''}`}>
          
          {/* Terms List (Bulleted with ➤ arrow-style bullets) */}
          <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-[13px] leading-relaxed text-slate-900 font-sans print:text-[11px] print:leading-tight">
            {t.terms.map((term, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-sky-600 font-bold shrink-0 text-sm print:text-black">➤</span>
                <span>{term}</span>
              </div>
            ))}
          </div>

          {/* Guest Details Section (rounded-corner bordered box) */}
          <div className="border border-slate-800 rounded-lg p-4 sm:p-5 bg-white space-y-3.5 print:p-3 print:space-y-2">
            <h3 className="font-serif font-bold text-sm text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1.5 flex items-center justify-between">
              <span>{t.guestDetailsHeader}</span>
              <span className="text-xs font-sans text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full lowercase tracking-normal font-medium">
                max 20 guests
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
              {/* Total Guest Selection (1 - 20) */}
              <div className="md:col-span-2 p-3 bg-slate-50 border border-slate-300 rounded-lg flex flex-wrap items-center justify-between gap-3 print:bg-transparent print:border-slate-800 print:p-2">
                <div>
                  <label className="text-xs font-serif font-bold text-slate-900 uppercase">
                    {t.totalGuestsLabel} <span className="text-red-600 print:hidden">*</span>
                  </label>
                  <p className="text-[11px] text-slate-600 print:hidden">
                    Select how many guests are participating in this trip
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden print:inline-block font-bold text-black text-sm">
                    {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                  </span>
                  <select
                    value={guestCount}
                    onChange={(e) => handleGuestCountChange(parseInt(e.target.value) || 1)}
                    className="bg-white border-2 border-sky-600 text-sky-950 font-bold text-sm rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer shadow-xs focus:ring-2 focus:ring-sky-500 print:hidden"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Guest Name & Age Inputs */}
              <div className="md:col-span-2 space-y-2.5 bg-sky-50/50 p-3 rounded-lg border border-sky-100 print:bg-transparent print:border-slate-800 print:p-2">
                <div className="flex items-center justify-between border-b border-sky-200 pb-1.5 print:border-slate-800">
                  <h4 className="font-serif font-bold text-xs text-sky-950 uppercase tracking-wider flex items-center gap-2 print:text-black">
                    <span>{t.guestListHeader}</span>
                    <span className="bg-sky-600 text-white text-[10px] px-2 py-0.5 rounded-full font-sans print:bg-slate-900">
                      {guestCount} {guestCount === 1 ? 'Person' : 'People'}
                    </span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:gap-2">
                  {guestList.map((g, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-300 flex items-center gap-2 shadow-2xs print:bg-transparent print:border-slate-800 print:p-1.5 print:shadow-none">
                      <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2 py-1 rounded shrink-0 font-mono print:bg-slate-200 print:text-black">
                        #{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase print:text-slate-800">
                          {t.guestNumberLabel(idx + 1)} {t.guestNameLabel} {idx === 0 && <span className="text-red-600 print:hidden">*</span>}
                        </label>
                        <input
                          type="text"
                          value={g.name}
                          onChange={(e) => handleGuestItemChange(idx, 'name', e.target.value)}
                          placeholder={idx === 0 ? t.guestNamePlaceholder : `Guest ${idx + 1} Name`}
                          required={idx === 0}
                          className="w-full border-b border-dotted border-slate-600 bg-transparent px-1 py-0.5 text-xs font-medium focus:outline-none focus:border-sky-600 text-slate-900 print:font-bold print:text-black print:border-solid print:border-black"
                        />
                      </div>
                      <div className="w-16 shrink-0">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase text-center print:text-slate-800">
                          {t.ageLabel}
                        </label>
                        <input
                          type="text"
                          value={g.age}
                          onChange={(e) => handleGuestItemChange(idx, 'age', e.target.value)}
                          placeholder={t.agePlaceholder}
                          className="w-full border-b border-dotted border-slate-600 bg-transparent px-1 py-0.5 text-xs font-medium focus:outline-none focus:border-sky-600 text-center text-slate-900 print:font-bold print:text-black print:border-solid print:border-black"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Communication Address */}
              <div className="md:col-span-2 space-y-1">
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

              {/* Telephone/mobile No */}
              <div className="space-y-1">
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
                  className="w-full border-b-2 border-dotted border-slate-700 bg-transparent rounded-none px-1 py-1 text-sm font-medium focus:outline-none focus:border-solid focus:border-sky-600 print:font-bold print:text-black print:border-solid print:border-black"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
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

              {/* Activities Selection Section (Above Signature) */}
              <div className="md:col-span-2 border border-slate-300 rounded-lg p-3.5 sm:p-4 bg-slate-50/70 space-y-2.5 my-1 print:p-2 print:border-slate-800">
                <h3 className="font-serif font-bold text-xs sm:text-sm text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center justify-between">
                  <span>Participating Water Sports Activities</span>
                  <span className="text-[11px] font-sans text-sky-800 bg-sky-100/80 border border-sky-200 px-2 py-0.5 rounded-full lowercase tracking-normal font-semibold print:bg-transparent print:border-black print:text-black">
                    {selectedActivities.length} {selectedActivities.length === 1 ? 'activity' : 'activities'} selected
                  </span>
                </h3>
                <p className="text-[11px] text-slate-600 print:hidden font-medium">
                  Select all water sports activities you or your group will be participating in:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 print:flex print:flex-wrap print:gap-2">
                  {DECLARATION_ACTIVITIES.map((act) => {
                    const isChecked = selectedActivities.includes(act);
                    return (
                      <button
                        key={act}
                        type="button"
                        onClick={() => handleActivityToggle(act)}
                        className={`flex items-center gap-2 p-2 rounded-lg border-2 text-xs font-extrabold transition-all text-left cursor-pointer select-none ${
                          isChecked
                            ? 'border-sky-600 bg-white text-sky-950 shadow-xs print:border-black print:bg-slate-100 print:text-black'
                            : 'border-slate-200 bg-white/50 text-slate-600 hover:border-slate-300 print:hidden'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                          isChecked ? 'bg-sky-600 border-sky-600 text-white print:bg-black print:border-black' : 'border-slate-400 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{act}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="hidden print:block text-xs font-bold font-serif text-slate-900 border-t border-slate-200 pt-1.5">
                  Selected Activities: {selectedActivities.join(', ')}
                </div>
              </div>

              {/* Guest Signature */}
              <div className="space-y-1">
                <SignaturePad
                  label={t.guestSigLabel}
                  required
                  onSignatureChange={(sig) => setFormData(prev => ({ ...prev, signature: sig }))}
                />
              </div>

              {/* Date */}
              <div className="space-y-1 flex flex-col justify-end">
                <label className="text-xs font-serif font-bold text-slate-900 uppercase block mb-0.5">
                  {t.dateLabel} <span className="text-red-600 print:hidden">*</span>
                </label>
                <input
                  type="date"
                  name="agreementDate"
                  value={formData.agreementDate}
                  onChange={handleChange}
                  required
                  className="w-full border-b-2 border-dotted border-slate-700 bg-transparent rounded-none px-1 py-1 text-sm font-medium focus:outline-none focus:border-solid focus:border-sky-600 print:font-bold print:text-black print:border-solid print:border-black"
                />
              </div>
            </div>
          </div>

          {/* Form Submit Button (Hidden in Print) */}
          {!submitted && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
              <p className="text-xs text-slate-500 italic">
                {t.footerNotice}
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-[#091F44] hover:bg-[#004E98] text-white px-8 py-3 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>{t.submittingBtn}</span>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    {t.submitBtn}
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

