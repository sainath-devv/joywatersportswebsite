import { z } from 'zod';
import { parsePhoneNumberFromString, CountryCode, getCountries, getCountryCallingCode } from 'libphonenumber-js';

// Common weak password blocklist
export const COMMON_WEAK_PASSWORDS = [
  'password', 'password123', '12345678', '123456789', 'qwertyuiop', 
  'admin123', 'welcome123', 'letmein123', 'joywatersports'
];

// Common disposable email domains
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'dispostable.com', 'trashmail.com'
]);

export interface CountryInfo {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
}

// Country flags helper mapping for major countries
export const COUNTRY_LIST: CountryInfo[] = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },
];

// Password strength analyzer
export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  notCommon: boolean;
}

export function evaluatePasswordStrength(password: string): {
  score: number; // 0 to 4
  label: 'Too Weak' | 'Weak' | 'Medium' | 'Strong';
  color: string;
  requirements: PasswordRequirements;
} {
  const reqs: PasswordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
    notCommon: !COMMON_WEAK_PASSWORDS.includes(password.toLowerCase())
  };

  const passedCount = Object.values(reqs).filter(Boolean).length;

  let score = 0;
  if (passedCount <= 2) score = 1;
  else if (passedCount <= 4) score = 2;
  else if (passedCount === 5) score = 3;
  else if (passedCount === 6) score = 4;

  let label: 'Too Weak' | 'Weak' | 'Medium' | 'Strong' = 'Too Weak';
  let color = 'bg-rose-500';

  if (score === 2) {
    label = 'Weak';
    color = 'bg-amber-500';
  } else if (score === 3) {
    label = 'Medium';
    color = 'bg-sky-500';
  } else if (score === 4) {
    label = 'Strong';
    color = 'bg-emerald-500';
  }

  return { score, label, color, requirements: reqs };
}

// Phone Number Validator for all international formats using libphonenumber-js
export function validateAndFormatPhone(rawPhone: string, defaultCountry: CountryCode = 'IN'): {
  isValid: boolean;
  e164Format?: string;
  error?: string;
} {
  if (!rawPhone || !rawPhone.trim()) {
    return { isValid: true, e164Format: '' }; // Optional phone
  }

  try {
    const phoneNumber = parsePhoneNumberFromString(rawPhone.trim(), defaultCountry);
    if (!phoneNumber || !phoneNumber.isValid()) {
      return {
        isValid: false,
        error: `Invalid phone number format for ${defaultCountry}. Please check your number.`
      };
    }

    return {
      isValid: true,
      e164Format: phoneNumber.format('E.164') // e.g., +919876543210
    };
  } catch (e) {
    return { isValid: false, error: 'Could not parse phone number.' };
  }
}

// Zod Registration Schema
export const RegisterValidationSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .refine((email) => {
      const domain = email.split('@')[1]?.toLowerCase();
      return !DISPOSABLE_EMAIL_DOMAINS.has(domain);
    }, 'Disposable / temporary email addresses are not accepted')
    .transform(val => val.trim().toLowerCase()),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .refine((pass) => !COMMON_WEAK_PASSWORDS.includes(pass.toLowerCase()), 'This password is too common or easily guessable'),

  firstName: z.string().min(1, 'First name is required').max(50).transform(v => v.trim()),
  lastName: z.string().min(1, 'Last name is required').max(50).transform(v => v.trim()),
  countryCode: z.string().default('IN'),
  phone: z.string().optional().or(z.literal(''))
});

// Zod Login Schema
export const LoginValidationSchema = z.object({
  email: z.string().min(1, 'Email or Phone is required').transform(v => v.trim()),
  password: z.string().min(1, 'Password is required')
});
