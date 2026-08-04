import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import helmet from 'helmet';
import * as xlsx from 'xlsx';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import QRCode from 'qrcode';
import crypto from 'crypto';
import pg from 'pg';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for @neondatabase/serverless WebSocket driver in Node.js serverless environments
if (neonConfig) {
  neonConfig.webSocketConstructor = ws;
}
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import { z } from 'zod';
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

// AES-256-GCM Sensitive Field Encryption at Rest Helper
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET 
  ? crypto.scryptSync(process.env.ENCRYPTION_SECRET, 'salt_joy_watersports_2026', 32)
  : crypto.scryptSync('default_joy_encryption_secret_2026', 'salt_joy_watersports_2026', 32);

export function encryptSensitiveData(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptSensitiveData(encryptedData: string): string {
  if (!encryptedData || !encryptedData.includes(':')) return encryptedData;
  try {
    const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return encryptedData; // Fallback if unencrypted
  }
}

const DISPOSABLE_DOMAINS = new Set(['mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'trashmail.com']);
const WEAK_PASSWORDS = ['password', 'password123', '12345678', 'qwertyuiop', 'admin123'];

// Server-side Zod Validation Schemas
const RegisterSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .refine((val) => {
      const domain = val.split('@')[1]?.toLowerCase();
      return !DISPOSABLE_DOMAINS.has(domain);
    }, 'Disposable / temporary email accounts are not permitted')
    .transform(val => val.trim().toLowerCase()),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .refine((val) => !WEAK_PASSWORDS.includes(val.toLowerCase()), 'Password is too common or easily guessable'),

  firstName: z.string().min(1, 'First name is required').max(50).transform(val => val.trim()),
  lastName: z.string().min(1, 'Last name is required').max(50).transform(val => val.trim()),
  countryCode: z.string().optional().default('IN'),
  phone: z.string().optional().or(z.literal('')),
  emergencyContact: z.string().optional()
});

const LoginSchema = z.object({
  email: z.string().min(1, 'Email or Phone is required').transform(val => val.trim()),
  password: z.string().min(1, 'Password is required')
});

// Import custom middleware
import { sanitizeInput } from './middleware/sanitize';
import { loginLimiter } from './middleware/limiter';
import { adminAuth } from './middleware/auth';

// Load .env
dotenv.config();

// Ensure default environment settings if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'jwt_secret_jws_default_12345';
}

// Auto-generate .env on startup if it doesn't exist to make local VSCode launch flawless
try {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    const defaultEnv = `DATABASE_URL=${process.env.DATABASE_URL || ''}
JWT_SECRET=${process.env.JWT_SECRET || 'jwt_secret_jws_default_12345'}
GOOGLE_SHEETS_URL=${process.env.GOOGLE_SHEETS_URL || ''}
FRONTEND_URL=${process.env.FRONTEND_URL || 'http://localhost:3000'}`;
    fs.writeFileSync(envPath, defaultEnv, 'utf-8');
  }
} catch (e) {
  // Ignore read-only filesystem errors on Vercel / serverless
}

const { Pool } = pg;
let pool: any = null;

export async function getDbPool() {
  if (pool) return pool;
  await initDatabase();
  return pool;
}

const currentFilename = typeof __filename !== 'undefined' ? __filename : process.cwd();
const currentDirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(currentFilename);

const isVercel = !!process.env.VERCEL;
const DATA_DIR = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const WAIVER_AGREEMENTS_FILE = path.join(DATA_DIR, 'waiver_agreements.json');
const MANUAL_BOOKINGS_FILE = path.join(DATA_DIR, 'manual_bookings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CHATBOT_FILE = path.join(DATA_DIR, 'chatbot_store.json');
const COUPONS_FILE = path.join(DATA_DIR, 'coupons.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn(`Could not create DATA_DIR at ${DATA_DIR}, using /tmp/data fallback.`);
}

// Safe write JSON helper that handles read-only filesystems (e.g. Vercel) gracefully
export function safeWriteJson(filePath: string, data: any) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.warn(`⚠️ Write failed for ${filePath}: ${err.message}. Trying /tmp fallback.`);
    try {
      const fileName = path.basename(filePath);
      const tmpPath = path.join('/tmp', 'data', fileName);
      const tmpDir = path.dirname(tmpPath);
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
    } catch (tmpErr) {
      console.error(`❌ Fallback write to /tmp failed for ${filePath}:`, tmpErr);
    }
  }
}

// Robust JSON file reader helper that handles empty or corrupted files gracefully
function safeReadJson(filePath: string, defaultValue: any): any {
  try {
    if (!fs.existsSync(filePath)) {
      const fileName = path.basename(filePath);
      const tmpPath = path.join('/tmp', 'data', fileName);
      if (fs.existsSync(tmpPath)) {
        const content = fs.readFileSync(tmpPath, 'utf-8').trim();
        if (content) return JSON.parse(content);
      }
      safeWriteJson(filePath, defaultValue);
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (!content) {
      safeWriteJson(filePath, defaultValue);
      return defaultValue;
    }
    return JSON.parse(content);
  } catch (e) {
    console.warn(`⚠️ Error reading/parsing JSON from ${filePath}. Resetting to default.`, e);
    try {
      safeWriteJson(filePath, defaultValue);
    } catch (err) {
      console.error(`❌ Failed to reset JSON file ${filePath}:`, err);
    }
    return defaultValue;
  }
}

// Initialize JSON files safely using safeReadJson
const defaultChatbotConfig = {
  exact_matches: {
    "what is the price of parasailing?": "Parasailing is ₹2500 per person and is one of our most popular high-flying adventures!",
    "what are the total packages?": "We have two packages: PACK 2500 at ₹2500/person and our premium OVERALL Package at ₹4500/person which covers all our main sports!",
    "where are you located?": "We are located right on the stunning coast of Varkala, Kerala, India!",
    "how can i book?": "Booking is incredibly easy! You can book directly on our website through the Bookings page.",
    "tomorrow available": "Absolutely! We are open and operating tomorrow. All days of the week are available for booking!",
    "is scuba available?": "We don't offer Scuba Diving at Varkala right now, but our Parasailing, Jet Skiing, and adventure rafts are second to none!"
  },
  keyword_matches: {
    "parasailing": "Parasailing is one of our signatures! It is ₹2500 per person for an incredible bird's-eye view of the Varkala coast. Need any member calculation?",
    "jet ski": "Jet Skiing on the open ocean is ₹700 per person. Fast, fun, and extremely thrilling! Let me know if you want to calculate for multiple riders.",
    "scuba": "We don't have Scuba Diving at our Varkala location at the moment. However, we have a fantastic lineup of 8 other activities like Parasailing, Jet Skiing, Flying Fish, and ATV rides that you will absolutely love!",
    "flying fish": "The Flying Fish is ₹600 per person. You hold on tight as the raft jumps over current waves! Super fun.",
    "speed boat": "Our high-speed Speed Boat excursions are ₹500 per person, perfect for a fast coastal cruise with friends and family.",
    "banana": "The Banana Boat ride is ₹500 per person. A splash-filled group adventure that's a crowd favorite!",
    "sofa": "The Crazy Sofa is ₹500 per person. You bounce and slide across the top of water waves!",
    "doughnut": "The Doughnut Boat is ₹500 per person. Prepare for some funny, dizzying spins and splashes!",
    "atv": "Our beach ATV rides are ₹300 per person, letting you speed across the soft shores of Varkala Beach.",
    "price": "Our official activity prices per person:\n• Parasailing: ₹2500\n• Jet Ski: ₹700\n• Flying Fish: ₹600\n• Speed Boat: ₹500\n• Banana Boat: ₹500\n• Crazy Sofa: ₹500\n• Doughnut Boat: ₹500\n• ATV Beach Ride: ₹300\n\nSimply let me know which activity and how many members (e.g. 'Parasailing for 3 people') and I will calculate the total for you!",
    "package": "We offer two awesome money-saving packages:\n1. PACK 2500: ₹2500 per person\n2. OVERALL Package: ₹4500 per person (Includes all main watersports)\n\nBoth are designed to give you maximum fun for a smaller price!",
    "book": "You can book your slots right here on our website! Just head to the Bookings section or select an activity from the Catalog.",
    "location": "We are located directly on the main beach of Varkala, Kerala, India. Safe, beautiful, and easy to reach!",
    "hello": "Hello! Welcome to Joy Water Sports! I'm here to help with your rides, calculated rates, or booking details. What's on your mind today?",
    "hi": "Hi there! Super excited to help you plan your sea adventure. How can I assist you with pricing, dates, or our activities?",
    "hey": "Hey! Welcome to Joy Water Sports. Keen for some beach action? Ask me anything about our rides or pricing!",
    "date": "We are open and operating all days! All days of the week, including Sundays and holidays, are available from 9:30 AM to 6:00 PM. Just let me know when you'd like to book!",
    "day": "Yes, we operates 7 days a week, 365 days a year (weather permitting)! All days are open for booking. Sessions run daily from 9:30 AM to 6:00 PM.",
    "time": "Our ocean sessions start at 9:30 AM and wrap up around 6:00 PM daily. This is the optimal window for the best sunlight and waves!",
    "who": "We are Joy Water Sports, your premium destination for safe, thrilling, and extremely memorable watersports on Varkala beach.",
    "safety": "Safety is our highest priority! We use certified equipment, premium life vests, and have highly trained double-certified rescue teams on high alert. You do not need to know swimming!",
    "swim": "No swimming skills are required for any of our water sports! We provide top-of-the-line buoyant life jackets, and our trained captains are right by your side during the entire experience."
  }
};

const defaultCoupons = [
  { id: 'cp_1', code: 'WELCOME10', discountType: 'percentage', discountValue: 10, minBill: 1000, active: true, usageCount: 24, createdAt: new Date().toISOString() },
  { id: 'cp_2', code: 'JOYOVERALL', discountType: 'fixed', discountValue: 500, minBill: 2500, active: true, usageCount: 58, createdAt: new Date().toISOString() },
  { id: 'cp_3', code: 'GROUPFUN15', discountType: 'percentage', discountValue: 15, minBill: 4000, active: false, usageCount: 12, createdAt: new Date().toISOString() },
];

safeReadJson(BOOKINGS_FILE, []);
safeReadJson(WAIVER_AGREEMENTS_FILE, []);
safeReadJson(USERS_FILE, []);
safeReadJson(CHATBOT_FILE, defaultChatbotConfig);
safeReadJson(COUPONS_FILE, defaultCoupons);

// ========================================
// GOOGLE SHEETS INTEGRATION
// ========================================
// GOOGLE SHEETS SYNC & RETRY QUEUE
// ========================================
const DEFAULT_GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbx5d0sIlWfrCecgrTOrST4r60_yWnPM_28zoYKTnUFpSeizwkJZfX7kx23AMtKDnRYF5A/exec';
const DEFAULT_DECLARATION_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbx5d0sIlWfrCecgrTOrST4r60_yWnPM_28zoYKTnUFpSeizwkJZfX7kx23AMtKDnRYF5A/exec';
const DEFAULT_USER_LOGIN_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyAnJHYBUOXHguJh7mfaf4EVCl8B5AoKbQy39ArPNruunkmhFTGDiXPPFjoaA4wiBWyqg/exec';

async function getActiveGoogleSheetsUrl(): Promise<string> {
  try {
    const customUrl = await getAdminConfig('google_sheets_url');
    if (customUrl && customUrl.trim() && !customUrl.includes('AKfycbz4QHrY') && !customUrl.includes('AKfycbyZJbtM')) {
      return customUrl.trim();
    }
  } catch (e) {}
  return process.env.GOOGLE_SHEETS_URL?.trim() || DEFAULT_GOOGLE_SHEETS_URL;
}

async function getActiveDeclarationSheetsUrl(): Promise<string> {
  try {
    const customUrl = await getAdminConfig('declaration_sheets_url');
    if (customUrl && customUrl.trim() && !customUrl.includes('AKfycbz4QHrY') && !customUrl.includes('AKfycbyZJbtM')) {
      return customUrl.trim();
    }
  } catch (e) {}
  return process.env.DECLARATION_SHEETS_URL?.trim() || DEFAULT_DECLARATION_SHEETS_URL;
}

async function getActiveUserLoginSheetsUrl(): Promise<string> {
  try {
    const customUrl = await getAdminConfig('user_login_sheets_url');
    if (customUrl && customUrl.trim()) return customUrl.trim();
  } catch (e) {}
  return process.env.USER_LOGIN_SHEETS_URL?.trim() || DEFAULT_USER_LOGIN_SHEETS_URL;
}

async function syncUserLoginDataToSheets(payload: {
  action: 'REGISTER' | 'LOGIN' | 'PASSWORD_RESET',
  userId?: string,
  email: string,
  firstName?: string,
  lastName?: string,
  phone?: string,
  ipAddress?: string,
  userAgent?: string
}) {
  try {
    const targetUrl = await getActiveUserLoginSheetsUrl();
    if (!targetUrl) return;

    const timestampStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const sheetData = {
      timestamp: timestampStr,
      action: payload.action,
      userId: payload.userId || '',
      email: payload.email || '',
      firstName: payload.firstName || '',
      lastName: payload.lastName || '',
      name: `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || 'Guest',
      phone: payload.phone || '',
      ipAddress: payload.ipAddress || 'Unknown',
      userAgent: payload.userAgent || 'Unknown',
      createdAt: new Date().toISOString()
    };

    console.log(`📊 [User Login Sheets Sync] Sending ${payload.action} for ${payload.email} to Google Sheets...`);
    
    fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sheetData)
    }).then(res => {
      console.log(`✅ [User Login Sheets Sync] Successfully logged ${payload.email} (${payload.action}) to userlogindata spreadsheet.`);
    }).catch(err => {
      console.warn(`⚠️ [User Login Sheets Sync Error]: ${err.message || err}`);
    });
  } catch (e) {
    console.warn('User login sync warning:', e);
  }
}

function buildSheetPayload(booking: any) {
  const now = new Date();
  const id = booking.id || booking.bookingId || '';
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const str = String(dateStr).trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const parts = str.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    try {
      const date = new Date(str);
      if (isNaN(date.getTime())) return str;
      const day = date.getUTCDate().toString().padStart(2, '0');
      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const year = date.getUTCFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return str;
    }
  };

  const formatTime12Hour = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const convertSingleTime = (t: string) => {
        const match = t.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (!match) return t;
        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
      };

      if (timeStr.includes('-')) {
        return timeStr.split('-').map(part => convertSingleTime(part.trim())).join(' - ');
      }
      return convertSingleTime(timeStr);
    } catch (e) {
      return timeStr;
    }
  };

  let customerName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim();
  if (!customerName && booking.customerName) {
    customerName = booking.customerName;
  }
  if (!customerName && booking.guestName) {
    customerName = booking.guestName;
  }

  const actStr = Array.isArray(booking.activities)
    ? booking.activities.join(', ')
    : (booking.activities || booking.activity || booking.package || booking.packageName || booking.services || '');

  const formattedDate = formatDate(booking.date || booking.dateOfSailing || booking.agreementDate);
  const formattedTime = formatTime12Hour(booking.time || booking.trip1Time || '');

  return {
    action: 'BOOKING',
    type: 'BOOKING',
    category: 'BOOKING_DETAILS',
    sheetName: 'Sheet1',
    sheet: 'Sheet1',
    targetSheet: 'Sheet1',

    // Form Source Identifier
    formType: 'Online Booking',
    source: 'Online Booking',
    formSource: 'Online Booking',
    "Form Source": 'Online Booking',

    // Core IDs
    id: id,
    bookingId: id,
    waiverId: id,

    // Header Matcher Aliases (exact Google Sheet Header Names)
    "Booking Reference": id,
    "Booking ID": id,
    "Booking/Invoice ID": id,
    "Invoice No": id,
    "Guest Name": customerName || 'Valued Guest',
    "Customer Name": customerName || 'Valued Guest',
    "Name": customerName || 'Valued Guest',
    "Mobile Number": booking.phone || '',
    "Phone Number": booking.phone || '',
    "Phone": booking.phone || '',
    "Email Address": booking.email || '',
    "Email": booking.email || '',
    "Date & Time": `${formattedDate} ${formattedTime}`.trim(),
    "Date": formattedDate,
    "Time": formattedTime,
    "Sailing Date": formattedDate,
    "Date of Sailing": formattedDate,
    "Time Slot": formattedTime,
    "Activities": actStr,
    "Activity": actStr,
    "Package": actStr,
    "Total Bill": booking.totalAmount || 0,
    "Total Amount": booking.totalAmount || 0,
    "Advance Paid": booking.advancePaid || 0,
    "Balance Paid": booking.balancePaid || 0,
    "Remaining Due": booking.remainingDue || 0,
    "Payment Status": booking.paymentStatus || 'Pending',
    "Payment Mode": booking.advancePaymentMode || booking.paymentMode || 'Cash',
    "Communication Address": booking.communicationAddress || booking.address || '',
    "Address": booking.communicationAddress || booking.address || '',

    // Standard properties
    bookedAt: booking.createdAt ? new Date(booking.createdAt).toLocaleString('en-GB') : (booking.bookedAt || now.toLocaleString('en-GB')),
    customerName: customerName || 'Valued Guest',
    guestName: customerName || 'Valued Guest',
    name: customerName || 'Valued Guest',
    fullName: customerName || 'Valued Guest',
    clientName: customerName || 'Valued Guest',
    phone: booking.phone || '',
    email: booking.email || '',
    date: formattedDate,
    sailingDate: formattedDate,
    dateOfSailing: formattedDate,
    bookingDate: formattedDate,
    time: formattedTime,
    slotTime: formattedTime,
    timeSlot: formattedTime,
    trip1Time: formattedTime,
    bookingTime: formattedTime,
    activities: actStr,
    activity: actStr,
    package: actStr,
    packageName: actStr,
    selectedActivities: actStr,
    activityList: actStr,
    services: actStr,
    guests: booking.guests || 1,
    pax: booking.guests || 1,
    guestCount: booking.guests || 1,
    noOfGuests: booking.guests || 1,
    persons: booking.guests || 1,
    totalAmount: booking.totalAmount || 0,
    total: booking.totalAmount || 0,
    amount: booking.totalAmount || 0,
    advancePaid: booking.advancePaid || 0,
    advanceAmount: booking.advancePaid || 0,
    balancePaid: booking.balancePaid || 0,
    remainingDue: booking.remainingDue || 0,
    due: booking.remainingDue || 0,
    balance: booking.remainingDue || 0,
    paymentStatus: booking.paymentStatus || 'Pending',
    status: booking.paymentStatus || 'Pending',
    ticketStatus: booking.ticketStatus || 'Pending',
    paymentMode: booking.advancePaymentMode || booking.paymentMode || 'Cash',
    advancePaymentMode: booking.advancePaymentMode || booking.paymentMode || 'Cash',
    specialRequest: booking.specialRequest || booking.notes || '',
    signature: booking.signature || booking.guestSignature || '',
    guestSignature: booking.signature || booking.guestSignature || '',
    communicationAddress: booking.communicationAddress || booking.address || '',
    hasMinor: (booking.hasMinor || booking.hasGuardian || booking.guardianName) ? 'Yes' : 'No',
    guardianName: booking.guardianName || '',
    guardianAddress: booking.guardianAddress || '',
    guardianPhone: booking.guardianPhone || '',
    guardianEmail: booking.guardianEmail || '',
    guardianSignature: booking.guardianSignature || '',
    createdAt: booking.createdAt || now.toISOString()
  };
}

async function logSheetSyncAttempt(bookingId: string, status: 'SUCCESS' | 'FAILED' | 'SKIPPED', errorMessage?: string) {
  const targetId = bookingId || 'UNKNOWN';
  const timestamp = new Date().toISOString();
  if (status === 'SUCCESS') {
    await setAdminConfig('last_successful_sync_time', timestamp).catch(() => {});
  }
  const activePool = await getDbPool();
  if (activePool) {
    try {
      await activePool.query(
        'INSERT INTO sheet_sync_logs (booking_id, status, error_message, timestamp) VALUES ($1, $2, $3, $4)',
        [targetId, status, errorMessage || null, timestamp]
      );
    } catch (e) {}
  } else {
    const logsFile = path.join(DATA_DIR, 'sheet_sync_logs.json');
    const logs = safeReadJson(logsFile, []);
    logs.unshift({ bookingId: targetId, status, errorMessage: errorMessage || null, timestamp });
    if (logs.length > 200) logs.length = 200;
    safeWriteJson(logsFile, logs);
  }
}

async function markQueueSynced(bookingId: string) {
  if (!bookingId) return;
  const syncedAt = new Date().toISOString();
  const activePool = await getDbPool();
  if (activePool) {
    try {
      await activePool.query(
        'UPDATE sheet_sync_queue SET synced = TRUE, synced_at = $1, last_error = NULL WHERE booking_id = $2',
        [syncedAt, bookingId]
      );
    } catch (e) {}
  } else {
    const queueFile = path.join(DATA_DIR, 'sheet_sync_queue.json');
    const queue = safeReadJson(queueFile, []);
    const item = queue.find((q: any) => q.bookingId === bookingId);
    if (item) {
      item.synced = true;
      item.syncedAt = syncedAt;
      item.lastError = null;
      safeWriteJson(queueFile, queue);
    }
  }
}

async function enqueueFailedSync(bookingId: string, payload: any, errorMsg: string) {
  const targetId = bookingId || payload?.bookingId || payload?.id;
  if (!targetId) {
    console.warn("⚠️ Skipping enqueueFailedSync due to missing booking ID:", { bookingId, payload, errorMsg });
    return;
  }
  const activePool = await getDbPool();
  if (activePool) {
    try {
      await activePool.query(`
        INSERT INTO sheet_sync_queue (booking_id, payload, attempt_count, last_error, synced, created_at)
        VALUES ($1, $2, 1, $3, FALSE, CURRENT_TIMESTAMP)
        ON CONFLICT (booking_id) DO UPDATE SET
          attempt_count = sheet_sync_queue.attempt_count + 1,
          last_error = EXCLUDED.last_error,
          synced = FALSE,
          payload = EXCLUDED.payload
      `, [targetId, JSON.stringify(payload), errorMsg]);
    } catch (e) {
      console.error("Failed to insert into sheet_sync_queue:", e);
    }
  } else {
    const queueFile = path.join(DATA_DIR, 'sheet_sync_queue.json');
    const queue = safeReadJson(queueFile, []);
    const existing = queue.find((q: any) => q.bookingId === targetId);
    if (existing) {
      existing.attemptCount = (existing.attemptCount || 1) + 1;
      existing.lastError = errorMsg;
      existing.synced = false;
      existing.payload = payload;
    } else {
      queue.push({
        bookingId: targetId,
        payload,
        attemptCount: 1,
        lastError: errorMsg,
        synced: false,
        createdAt: new Date().toISOString()
      });
    }
    safeWriteJson(queueFile, queue);
  }
}

async function sendToGoogleSheets(booking: any): Promise<boolean> {
  if (!booking) return false;
  const targetUrl = await getActiveGoogleSheetsUrl();
  if (!targetUrl || !targetUrl.trim()) {
    console.warn("⚠️ Google Sheets Webhook URL is not configured. Skipping sync.");
    return false;
  }

  const payload = buildSheetPayload(booking);
  const targetId = payload.bookingId || payload.id || 'UNKNOWN';

  try {
    const response = await fetch(targetUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    const responseText = await response.text();
    const isOk = response.ok || response.status === 200 || response.status === 302;

    if (isOk && !responseText.includes("Script function not found: doPost") && !responseText.includes("Authorization is required")) {
      await markQueueSynced(targetId);
      await logSheetSyncAttempt(targetId, 'SUCCESS');
      console.log(`✅ Successfully sent booking #${targetId} to Google Sheets`);
      return true;
    } else {
      const errorMsg = `HTTP ${response.status}: ${responseText.substring(0, 150)}`;
      await enqueueFailedSync(targetId, payload, errorMsg);
      await logSheetSyncAttempt(targetId, 'FAILED', errorMsg);
      console.error(`❌ Failed Google Sheets sync for #${targetId}: ${errorMsg}`);
      return false;
    }
  } catch (error: any) {
    const errorMsg = error.message || 'Fetch failed';
    await enqueueFailedSync(targetId, payload, errorMsg);
    await logSheetSyncAttempt(targetId, 'FAILED', errorMsg);
    console.error(`❌ Exception during Google Sheets sync for #${targetId}:`, errorMsg);
    return false;
  }
}

async function sendWaiverToGoogleSheets(waiver: any): Promise<boolean> {
  if (!waiver) return false;
  const targetUrl = await getActiveDeclarationSheetsUrl();
  if (!targetUrl || !targetUrl.trim()) return false;

  const bookingId = waiver.bookingId || waiver.invoiceNo || '';
  const actionType = waiver.action || 'GENERAL_DECLARATION';
  const targetId = waiver.id || waiver.waiverId || bookingId || `WAV-${Date.now()}`;

  const rawSig = waiver.signature || waiver.guestSignature || waiver.sig || waiver.clientSignature || '';
  const finalSig = typeof rawSig === 'string' && rawSig.startsWith('typed:') 
    ? `Signed Digitally: ${rawSig.replace('typed:', '')}`
    : (rawSig || (waiver.guestName ? `Digitally Signed by ${waiver.guestName}` : ''));

  const rawGuardianSig = waiver.guardianSignature || waiver.guardianSig || '';
  const finalGuardianSig = typeof rawGuardianSig === 'string' && rawGuardianSig.startsWith('typed:')
    ? `Signed Digitally: ${rawGuardianSig.replace('typed:', '')}`
    : rawGuardianSig;

  const guestNameVal = waiver.guestName || waiver.name || waiver.customerName || '';
  const commAddressVal = waiver.communicationAddress || waiver.address || '';
  const phoneVal = waiver.phone || waiver.mobile || '';
  const emailVal = waiver.email || '';
  const agreementDateVal = waiver.agreementDate || waiver.date || new Date().toISOString().split('T')[0];
  const hasMinorVal = (waiver.hasMinor || waiver.hasGuardian || waiver.guardianName) ? 'Yes' : 'No';
  const guardianNameVal = waiver.guardianName || '';
  const guardianAddressVal = waiver.guardianAddress || '';
  const guardianPhoneVal = waiver.guardianPhone || '';
  const guardianEmailVal = waiver.guardianEmail || '';
  const guardianAgreementDateVal = waiver.guardianAgreementDate || '';
  const dateOfSailingVal = waiver.dateOfSailing || waiver.agreementDate || waiver.date || '';
  const invoiceNoVal = waiver.invoiceNo || bookingId || '';
  const boardingPassNoVal = waiver.boardingPassNo || (bookingId ? `BP-${bookingId}` : '');
  const trip1TimeVal = waiver.trip1Time || waiver.time || '';
  const boatVal = waiver.boat || (waiver.boatG1 || waiver.boatG1_1 || waiver.boatG1_2 || waiver.boatG1_3 ? 'G1' : '');
  const timestampVal = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const payload = {
    action: actionType,
    sheetName: 'Declarations',
    sheet: 'Declarations',
    targetSheet: 'Declarations',
    declarationSheet: 'Declarations',
    type: 'DECLARATION',
    waiverId: targetId,
    id: targetId,
    bookingId: bookingId || 'N/A',

    // Form Source Identifier
    formType: waiver.formType || waiver.source || 'Declaration Form',
    source: waiver.formType || waiver.source || 'Declaration Form',
    formSource: waiver.formType || waiver.source || 'Declaration Form',
    "Form Source": waiver.formType || waiver.source || 'Declaration Form',

    // Guest Details (camelCase)
    guestName: guestNameVal,
    name: guestNameVal,
    customerName: guestNameVal,
    communicationAddress: commAddressVal,
    address: commAddressVal,
    phone: phoneVal,
    mobile: phoneVal,
    email: emailVal,
    
    // Comprehensive Signature fields for all Apps Script variations
    signature: finalSig,
    guestSignature: finalSig,
    sig: finalSig,
    signatureData: finalSig,
    signatureUrl: finalSig,
    signatureImage: finalSig,
    clientSignature: finalSig,
    declarationSignature: finalSig,
    signed: finalSig ? 'Yes' : 'No',
    isSigned: Boolean(finalSig),

    agreementDate: agreementDateVal,
    date: agreementDateVal,

    // Guardian Details (camelCase)
    hasMinor: hasMinorVal,
    hasGuardian: hasMinorVal,
    guardianName: guardianNameVal,
    guardianAddress: guardianAddressVal,
    guardianPhone: guardianPhoneVal,
    guardianEmail: guardianEmailVal,
    guardianSignature: finalGuardianSig,
    guardianSig: finalGuardianSig,
    guardianAgreementDate: guardianAgreementDateVal,

    // Sailing & Trip Details (camelCase)
    dateOfSailing: dateOfSailingVal,
    invoiceNo: invoiceNoVal,
    boardingPassNo: boardingPassNoVal,
    trip1Time: trip1TimeVal,
    trip2Time: waiver.trip2Time || '',
    trip3Time: waiver.trip3Time || '',
    trip4Time: waiver.trip4Time || '',
    boat: boatVal,
    createdAt: waiver.createdAt || new Date().toISOString(),
    timestamp: timestampVal,

    // Capitalized Spaced Heading Keys (Matching exact Google Sheets column headers)
    "Waiver ID": targetId,
    "ID": targetId,
    "Booking ID": bookingId || 'N/A',
    "Guest Name": guestNameVal,
    "Name": guestNameVal,
    "Customer Name": guestNameVal,
    "Communication Address": commAddressVal,
    "Address": commAddressVal,
    "Phone": phoneVal,
    "Phone Number": phoneVal,
    "Mobile": phoneVal,
    "Email": emailVal,
    "Signature": finalSig,
    "Guest Signature": finalSig,
    "Agreement Date": agreementDateVal,
    "Date": agreementDateVal,
    "Has Minor": hasMinorVal,
    "Guardian Name": guardianNameVal,
    "Guardian Address": guardianAddressVal,
    "Guardian Phone": guardianPhoneVal,
    "Guardian Email": guardianEmailVal,
    "Guardian Signature": finalGuardianSig,
    "Guardian Agreement Date": guardianAgreementDateVal,
    "Date of Sailing": dateOfSailingVal,
    "Sailing Date": dateOfSailingVal,
    "Invoice No": invoiceNoVal,
    "Boarding Pass No": boardingPassNoVal,
    "Trip 1 Time": trip1TimeVal,
    "Trip Time": trip1TimeVal,
    "Boat": boatVal,
    "Created At": waiver.createdAt || new Date().toISOString(),
    "Timestamp": timestampVal,

    // Snake case keys
    "waiver_id": targetId,
    "booking_id": bookingId || 'N/A',
    "guest_name": guestNameVal,
    "communication_address": commAddressVal,
    "phone_number": phoneVal,
    "guest_signature": finalSig,
    "agreement_date": agreementDateVal,
    "has_minor": hasMinorVal,
    "guardian_name": guardianNameVal,
    "guardian_address": guardianAddressVal,
    "guardian_phone": guardianPhoneVal,
    "guardian_email": guardianEmailVal,
    "guardian_signature": finalGuardianSig,
    "guardian_agreement_date": guardianAgreementDateVal,
    "date_of_sailing": dateOfSailingVal,
    "invoice_no": invoiceNoVal,
    "boarding_pass_no": boardingPassNoVal,
    "trip1_time": trip1TimeVal,

    // Array row fallback for e.parameter or e.postData index parsing
    "row": [
      timestampVal,
      targetId,
      bookingId || 'N/A',
      guestNameVal,
      commAddressVal,
      phoneVal,
      emailVal,
      finalSig,
      agreementDateVal,
      hasMinorVal,
      guardianNameVal,
      guardianAddressVal,
      guardianPhoneVal,
      guardianEmailVal,
      finalGuardianSig,
      guardianAgreementDateVal,
      dateOfSailingVal,
      invoiceNoVal,
      boardingPassNoVal,
      trip1TimeVal,
      boatVal
    ]
  };

  try {
    const response = await fetch(targetUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    const text = await response.text();
    const isOk = response.ok || response.status === 200 || response.status === 302;
    if (isOk && !text.includes("Script function not found") && !text.includes("Authorization is required")) {
      await markQueueSynced(targetId);
      await logSheetSyncAttempt(targetId, 'SUCCESS');
      console.log(`✅ [Waiver Sheets Sync] ${actionType} sent to Google Sheets for #${targetId}:`, text.substring(0, 100));
      return true;
    } else {
      const errorMsg = `HTTP ${response.status}: ${text.substring(0, 150)}`;
      await enqueueFailedSync(targetId, payload, errorMsg);
      await logSheetSyncAttempt(targetId, 'FAILED', errorMsg);
      console.error(`❌ Failed Waiver Google Sheets sync for #${targetId}: ${errorMsg}`);
      return false;
    }
  } catch (err: any) {
    const errorMsg = err.message || 'Fetch failed';
    await enqueueFailedSync(targetId, payload, errorMsg);
    await logSheetSyncAttempt(targetId, 'FAILED', errorMsg);
    console.warn(`⚠️ Exception syncing waiver to Google Sheets for #${targetId}:`, errorMsg);
    return false;
  }
}

async function retryFailedSheetSyncs() {
  const targetUrl = await getActiveGoogleSheetsUrl();
  if (!targetUrl || !targetUrl.trim()) {
    return { processed: 0, succeeded: 0, failed: 0, remaining: 0, message: "Google Sheets Webhook URL is not configured." };
  }

  let pendingItems: any[] = [];

  const activePool = await getDbPool();
  if (activePool) {
    try {
      const res = await activePool.query('SELECT * FROM sheet_sync_queue WHERE synced = FALSE ORDER BY created_at ASC LIMIT 50');
      pendingItems = res.rows.map(r => ({
        bookingId: r.booking_id,
        payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload
      }));
    } catch (e) {
      console.error("Error fetching pending sync items from PostgreSQL:", e);
    }
  } else {
    const queueFile = path.join(DATA_DIR, 'sheet_sync_queue.json');
    const queue = safeReadJson(queueFile, []);
    pendingItems = queue.filter((q: any) => !q.synced).slice(0, 50);
  }

  if (pendingItems.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0, remaining: 0, message: "No pending sheet sync items in queue." };
  }

  let succeeded = 0;
  let failed = 0;

  for (const item of pendingItems) {
    const payload = item.payload;
    const targetId = item.bookingId || payload?.bookingId || payload?.id;
    if (!payload || !targetId) continue;

    try {
      const response = await fetch(targetUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });

      const text = await response.text();
      const isOk = response.ok || response.status === 200 || response.status === 302;

      if (isOk && !text.includes("Script function not found: doPost") && !text.includes("Authorization is required")) {
        await markQueueSynced(targetId);
        await logSheetSyncAttempt(targetId, 'SUCCESS');
        succeeded++;
      } else {
        const errorMsg = `HTTP ${response.status}: ${text.substring(0, 150)}`;
        await enqueueFailedSync(targetId, payload, errorMsg);
        await logSheetSyncAttempt(targetId, 'FAILED', errorMsg);
        failed++;
      }
    } catch (e: any) {
      const errorMsg = e.message || 'Network fetch error';
      await enqueueFailedSync(targetId, payload, errorMsg);
      await logSheetSyncAttempt(targetId, 'FAILED', errorMsg);
      failed++;
    }
  }

  return {
    processed: pendingItems.length,
    succeeded,
    failed,
    remaining: pendingItems.length - succeeded,
    message: `Processed ${pendingItems.length} queued items (${succeeded} synced, ${failed} failed).`
  };
}

// ========================================
// DATABASE CONNECTION & SCHEMA ENSURE HELPERS
// ========================================

async function ensureUsersTable(p: any) {
  if (!p) return;
  try {
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        emergency_contact_encrypted TEXT,
        is_legacy_auth BOOLEAN DEFAULT FALSE,
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_encrypted TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_legacy_auth BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);
  } catch (e: any) {
    console.warn('ensureUsersTable warning:', e?.message || e);
  }
}

async function ensureRefreshTokensTable(p: any) {
  if (!p) return;
  try {
    await p.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        device_info TEXT,
        ip_address TEXT,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        revoked_at TIMESTAMP WITH TIME ZONE,
        replaced_by_token VARCHAR(64)
      );
      ALTER TABLE refresh_tokens ALTER COLUMN ip_address TYPE TEXT;
    `);
  } catch (e: any) {
    console.warn('ensureRefreshTokensTable warning:', e?.message || e);
  }
}

async function initDatabase() {
  let dbUrl = process.env.DATABASE_URL?.trim();

  if (!dbUrl || dbUrl.includes('<YOUR_PASSWORD>') || dbUrl.includes('<password>') || dbUrl.includes('<YOUR_NEON_PASSWORD>')) {
    console.warn("⚠️ PostgreSQL DATABASE_URL not set in .env. Using local JSON storage.");
    pool = null;
    return;
  }

  const isLocalHost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

  if (dbUrl && dbUrl.startsWith('postgres')) {
    try {
      const isNeon = dbUrl.includes('neon.tech') || isVercel;
      console.log(`🔌 [PostgreSQL] Connecting to database (${isLocalHost ? 'Local PostgreSQL' : 'Remote Neon Serverless'})...`);
      
      let tempPool: any;
      if (isNeon) {
        tempPool = new NeonPool({ connectionString: dbUrl });
      } else {
        tempPool = new Pool({
          connectionString: dbUrl,
          ssl: isLocalHost ? false : { rejectUnauthorized: false },
          connectionTimeoutMillis: 15000,
          idleTimeoutMillis: 30000
        });
      }

      tempPool.on('error', (err: any) => {
        console.error('Unexpected database error:', err.message);
      });

      try {
        await tempPool.query(`SELECT 1`);
        console.log("✅ Successfully connected to Neon / PostgreSQL database!");
      } catch (connErr: any) {
        console.error(`❌ Connection failed: ${connErr.message}`);
        console.error(`💡 Tip: Make sure DATABASE_URL in .env contains your exact Neon connection string (e.g. postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require).`);
        pool = null;
        return;
      }

      // Execute schema definition
      const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sqlScript = fs.readFileSync(schemaPath, 'utf-8');
        await tempPool.query(sqlScript);
      }

      // Ensure refresh_tokens table and columns are compatible with multi-proxy IPv6/forwarded IPs
      try {
        await tempPool.query('ALTER TABLE refresh_tokens ALTER COLUMN ip_address TYPE TEXT;');
      } catch (alterErr) {
        // Table or column may not exist yet or already altered
      }

      // Explicitly check columns
      const { rows } = await tempPool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'bookings'
      `);
      const existingCols = new Set(rows.map((r: any) => r.column_name.toLowerCase()));

      if (!existingCols.has('booking_source')) {
        console.error("❌ Migration incomplete: missing column 'booking_source' in table 'bookings'. Run `npm run db:migrate` and restart.");
      }
      if (!existingCols.has('booking_id')) {
        console.error("❌ Migration incomplete: missing column 'booking_id' in table 'bookings'. Run `npm run db:migrate` and restart.");
      }

      console.log("✅ PostgreSQL connected and unified bookings table verified!");
      pool = tempPool;

      // Automatically sync any local bookings into database
      try {
        const syncResult = await reconcilePendingBookings();
        if (syncResult.synced > 0) {
          console.log(`✅ [DB Sync] Reconciled local bookings to DB (${syncResult.synced} synced).`);
        }
      } catch (e: any) {
        console.error("Auto reconciliation error:", e.message);
      }

    } catch (err: any) {
      console.warn("⚠️ Database connection issue:", err.message);
      console.warn("Falling back to local queued storage.");
      pool = null;
    }
  } else {
    console.warn("⚠️ PostgreSQL DATABASE_URL not set. Using local queued storage.");
  }
}

async function getAdminConfig(key: string): Promise<string | null> {
  const activePool = await getDbPool();
  if (activePool) {
    try {
      const { rows } = await activePool.query('SELECT value FROM admin_config WHERE key = $1', [key]);
      if (rows.length > 0) return rows[0].value;
    } catch (e) {
      console.error("Error reading from admin_config:", e);
    }
  }
  const config = safeReadJson(path.join(DATA_DIR, 'admin_config.json'), {});
  return config[key] || null;
}

async function setAdminConfig(key: string, value: string): Promise<void> {
  const activePool = await getDbPool();
  if (activePool) {
    try {
      await activePool.query(`
        INSERT INTO admin_config (key, value) 
        VALUES ($1, $2) 
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `, [key, value]);
      return;
    } catch (e) {
      console.error("Error writing to admin_config:", e);
    }
  }
  const config = safeReadJson(path.join(DATA_DIR, 'admin_config.json'), {});
  if (config[key] === value) return;
  config[key] = value;
  safeWriteJson(path.join(DATA_DIR, 'admin_config.json'), config);
}

async function getAdminUser(username: string = 'admin'): Promise<any | null> {
  const activePool = await getDbPool();
  if (activePool) {
    try {
      const { rows } = await activePool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
      if (rows.length > 0) {
        return {
          username: rows[0].username,
          password_hash: rows[0].password_hash,
          mobile_number: rows[0].mobile_number,
          otp_code: rows[0].otp_code,
          otp_expiry: rows[0].otp_expiry
        };
      }
    } catch (e) {
      console.error("Error reading from admin_users:", e);
    }
  }
  const users = safeReadJson(path.join(DATA_DIR, 'admin_users.json'), []);
  const u = users.find((usr: any) => usr.username === username);
  return u || null;
}

async function saveAdminUser(username: string = 'admin', fields: Partial<{ password_hash: string; mobile_number: string; otp_code: string; otp_expiry: string }>): Promise<void> {
  const activePool = await getDbPool();
  if (activePool) {
    try {
      const existing = await getAdminUser(username);
      if (existing) {
        const keys = Object.keys(fields);
        if (keys.length > 0) {
          const assignments = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
          const values = Object.values(fields);
          await pool.query(`
            UPDATE admin_users 
            SET ${assignments} 
            WHERE username = $1
          `, [username, ...values]);
        }
      } else {
        const keys = ['username', ...Object.keys(fields)];
        const columns = keys.join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const values = [username, ...Object.values(fields)];
        await pool.query(`
          INSERT INTO admin_users (${columns}) 
          VALUES (${placeholders})
        `, values);
      }
      return;
    } catch (e) {
      console.error("Error writing to admin_users:", e);
    }
  }

  const users = safeReadJson(path.join(DATA_DIR, 'admin_users.json'), []);
  let user = users.find((usr: any) => usr.username === username);
  if (!user) {
    user = { username, password_hash: '', mobile_number: '', otp_code: '', otp_expiry: '' };
    users.push(user);
  }
  Object.assign(user, fields);
  safeWriteJson(path.join(DATA_DIR, 'admin_users.json'), users);
}

// Helper functions for local disk storage fallback
function readLocalBookings(): any[] {
  const file1 = path.join(DATA_DIR, 'bookings.json');
  const file2 = path.join(DATA_DIR, 'pending_bookings.json');
  const file3 = path.join(DATA_DIR, 'manual_bookings.json');

  const b1 = safeReadJson(file1, []);
  const b2 = safeReadJson(file2, []);
  const b3 = safeReadJson(file3, []);

  const map = new Map<string, any>();
  [...b1, ...b2, ...b3].forEach((b: any) => {
    if (b && b.id) {
      map.set(b.id, {
        ...b,
        isDeleted: b.isDeleted || false,
        source: b.source || (b.id.startsWith('JMB') ? 'manual' : 'online')
      });
    }
  });

  return Array.from(map.values()).sort((a: any, b: any) => 
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

function writeLocalBooking(booking: any) {
  const file1 = path.join(DATA_DIR, 'bookings.json');
  const file2 = path.join(DATA_DIR, 'pending_bookings.json');

  const b1 = safeReadJson(file1, []);
  const idx1 = b1.findIndex((x: any) => x.id === booking.id);
  if (idx1 !== -1) {
    b1[idx1] = booking;
  } else {
    b1.unshift(booking);
  }
  safeWriteJson(file1, b1);

  const b2 = safeReadJson(file2, []);
  const idx2 = b2.findIndex((x: any) => x.id === booking.id);
  if (idx2 !== -1) {
    b2[idx2] = booking;
  } else {
    b2.unshift(booking);
  }
  safeWriteJson(file2, b2);
}

async function getBookings(filter?: { source?: string }) {
  let dbList: any[] = [];
  const activePool = await getDbPool();
  if (activePool) {
    try {
      let query = 'SELECT * FROM bookings WHERE is_deleted = FALSE OR is_deleted IS NULL';
      const params: any[] = [];
      if (filter?.source) {
        query += ' AND source = $1';
        params.push(filter.source);
      }
      query += ' ORDER BY created_at DESC';

      const { rows } = await activePool.query(query, params);
      dbList = rows.map((r: any) => {
        let parsedActivities = [];
        try {
          parsedActivities = typeof r.activities === 'string' ? JSON.parse(r.activities) : (r.activities || []);
        } catch {
          parsedActivities = r.activities || [];
        }
        return {
          id: r.id,
          firstName: r.first_name || '',
          lastName: r.last_name || '',
          phone: r.phone || '',
          email: r.email || '',
          date: r.date || '',
          time: r.time || '',
          guests: Number(r.guests) || 1,
          activities: parsedActivities,
          specialRequest: r.special_request || '',
          totalAmount: Number(r.total_amount) || 0,
          advancePaid: Number(r.advance_paid) || 0,
          balancePaid: Number(r.balance_paid) || 0,
          remainingDue: Number(r.remaining_due) || 0,
          paymentStatus: r.payment_status || 'Pending',
          ticketStatus: r.ticket_status || 'Pending',
          advancePaymentMode: r.advance_payment_mode || 'Online',
          balancePaymentMode: r.balance_payment_mode || 'Cash',
          source: r.source || 'online',
          createdBy: r.created_by || r.agent_name || null,
          agentName: r.agent_name || r.created_by || null,
          notes: r.notes || null,
          createdAt: r.created_at,
          isDeleted: r.is_deleted || false
        };
      });
    } catch (e: any) {
      console.error("Error reading bookings from PostgreSQL pool:", e.message);
    }
  }

  // Read local bookings
  const localList = readLocalBookings().filter((b: any) => filter?.source ? b.source === filter.source : true);

  // Merge database items and local fallback items smoothly
  const map = new Map<string, any>();
  localList.forEach((b: any) => map.set(b.id, b));
  dbList.forEach((b: any) => map.set(b.id, b));

  return Array.from(map.values())
    .filter((b: any) => !b.isDeleted)
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

async function saveBooking(booking: any) {
  const source = booking.source || booking.bookingSource || 'online';
  const createdBy = booking.createdBy || booking.agentName || null;
  const agentName = booking.agentName || booking.createdBy || null;
  const notes = booking.notes || null;

  const entry = {
    ...booking,
    source,
    bookingSource: source,
    createdBy,
    agentName,
    notes,
    createdAt: booking.createdAt || new Date().toISOString()
  };

  // Always write locally first for immediate local storage persistence
  writeLocalBooking(entry);

  const activePool = await getDbPool();
  if (activePool) {
    try {
      console.log(`💾 [PostgreSQL] Saving booking ${booking.id} (source: ${source}) into database...`);
      const actStr = typeof entry.activities === 'string' ? entry.activities : JSON.stringify(entry.activities || []);

      await activePool.query(`
        INSERT INTO bookings (
          id, booking_id, first_name, last_name, phone, email, date, time, guests, activities, 
          special_request, total_amount, advance_paid, balance_paid, remaining_due, 
          payment_status, ticket_status, advance_payment_mode, balance_payment_mode,
          source, booking_source, created_by, agent_name, notes, is_deleted, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
        )
        ON CONFLICT (id) DO UPDATE SET
          booking_id = EXCLUDED.booking_id,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          date = EXCLUDED.date,
          time = EXCLUDED.time,
          guests = EXCLUDED.guests,
          activities = EXCLUDED.activities,
          special_request = EXCLUDED.special_request,
          total_amount = EXCLUDED.total_amount,
          advance_paid = EXCLUDED.advance_paid,
          balance_paid = EXCLUDED.balance_paid,
          remaining_due = EXCLUDED.remaining_due,
          payment_status = EXCLUDED.payment_status,
          ticket_status = EXCLUDED.ticket_status,
          advance_payment_mode = EXCLUDED.advance_payment_mode,
          balance_payment_mode = EXCLUDED.balance_payment_mode,
          source = EXCLUDED.source,
          booking_source = EXCLUDED.booking_source,
          created_by = EXCLUDED.created_by,
          agent_name = EXCLUDED.agent_name,
          notes = EXCLUDED.notes,
          is_deleted = EXCLUDED.is_deleted
      `, [
        entry.id || '',
        entry.id || '',
        entry.firstName || '',
        entry.lastName || '',
        entry.phone || '',
        entry.email || '',
        entry.date || '',
        entry.time || '',
        Number(entry.guests) || 1,
        actStr,
        entry.specialRequest || '',
        Number(entry.totalAmount) || 0,
        Number(entry.advancePaid) || 0,
        Number(entry.balancePaid) || 0,
        Number(entry.remainingDue) || 0,
        entry.paymentStatus || 'Pending',
        entry.ticketStatus || 'Pending',
        entry.advancePaymentMode || 'Online',
        entry.balancePaymentMode || 'Cash',
        source,
        source,
        createdBy,
        agentName,
        notes,
        entry.isDeleted || false,
        entry.createdAt || new Date().toISOString()
      ]);
      console.log(`✅ [PostgreSQL] Successfully inserted/updated booking ${booking.id} in database!`);

      // Auto-create/sync signed waiver agreement for this booking
      const clientName = `${entry.firstName || ''} ${entry.lastName || ''}`.trim() || 'Valued Guest';
      saveWaiverAgreement({
        id: "WAV-" + entry.id,
        bookingId: entry.id,
        guestName: clientName,
        communicationAddress: "Digitally Verified",
        phone: entry.phone || '',
        email: entry.email || '',
        signature: clientName,
        agreementDate: entry.date || new Date().toISOString().split('T')[0],
        hasMinor: false,
        guardianName: "",
        guardianAddress: "",
        guardianPhone: "",
        guardianEmail: "",
        guardianSignature: "",
        guardianAgreementDate: "",
        dateOfSailing: entry.date || '',
        invoiceNo: entry.id,
        boardingPassNo: "BP-" + entry.id,
        trip1Time: entry.time || '',
        createdAt: entry.createdAt || new Date().toISOString()
      }).catch(e => console.error("Auto waiver creation failed:", e.message));
    } catch (err: any) {
      console.error(`⚠️ PostgreSQL insert failed for ${booking.id}: ${err.message}`);
    }
  } else {
    // Retry syncing once pool connects
    setTimeout(() => {
      if (pool) reconcilePendingBookings().catch(() => {});
    }, 2000);
  }
}

async function updateBookingInDb(id: string, updates: any) {
  const current = (await getBookingById(id)) || {};
  const merged = { ...current, ...updates, id };
  writeLocalBooking(merged);

  const activePool = await getDbPool();
  if (activePool) {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const key in updates) {
        if (key === 'id' || key === 'createdAt') continue;
        let dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();

        // Handle synonyms gracefully
        if (dbKey === 'source') {
          fields.push(`source = $${idx}`, `booking_source = $${idx}`);
          values.push(updates[key] ?? 'online');
          idx++;
          continue;
        }
        if (dbKey === 'booking_source') {
          fields.push(`booking_source = $${idx}`, `source = $${idx}`);
          values.push(updates[key] ?? 'online');
          idx++;
          continue;
        }
        if (dbKey === 'booking_id') {
          fields.push(`booking_id = $${idx}`, `id = $${idx}`);
          values.push(updates[key] ?? id);
          idx++;
          continue;
        }

        fields.push(`${dbKey} = $${idx}`);
        if (key === 'activities') {
          const actVal = typeof updates[key] === 'string' ? updates[key] : JSON.stringify(updates[key] || []);
          values.push(actVal);
        } else {
          values.push(updates[key] ?? null);
        }
        idx++;
      }

      if (fields.length > 0) {
        values.push(id);
        const query = `UPDATE bookings SET ${fields.join(', ')} WHERE id = $${idx}`;
        await activePool.query(query, values);
      }
    } catch (err: any) {
      console.error(`⚠️ PostgreSQL update failed for ${id}: ${err.message}`);
    }
  }
}

async function getBookingById(id: string) {
  if (!id) return null;
  const cleanId = String(id).trim();
  const activePool = await getDbPool();
  if (activePool) {
    try {
      const { rows } = await activePool.query(
        'SELECT * FROM bookings WHERE LOWER(id) = LOWER($1) OR LOWER(booking_id) = LOWER($1)', 
        [cleanId]
      );
      if (rows.length > 0) {
        const r = rows[0];
        let acts = [];
        try {
          acts = typeof r.activities === 'string' ? JSON.parse(r.activities) : (r.activities || []);
        } catch {
          acts = r.activities || [];
        }
        return {
          id: r.id,
          bookingId: r.booking_id || r.id,
          firstName: r.first_name || '',
          lastName: r.last_name || '',
          phone: r.phone || '',
          email: r.email || '',
          date: r.date || '',
          time: r.time || '',
          guests: Number(r.guests) || 1,
          activities: acts,
          specialRequest: r.special_request || '',
          totalAmount: Math.round(Number(r.total_amount) || 0),
          advancePaid: Math.round(Number(r.advance_paid) || 0),
          balancePaid: Math.round(Number(r.balance_paid) || 0),
          remainingDue: Math.round(Number(r.remaining_due) || 0),
          paymentStatus: r.payment_status || 'Pending',
          ticketStatus: r.ticket_status || 'Pending',
          advancePaymentMode: r.advance_payment_mode || 'Online',
          balancePaymentMode: r.balance_payment_mode || 'Cash',
          source: r.source || 'online',
          createdBy: r.created_by || r.agent_name || null,
          agentName: r.agent_name || r.created_by || null,
          notes: r.notes || null,
          isDeleted: r.is_deleted || false,
          createdAt: r.created_at
        };
      }
    } catch (e: any) {
      console.error("Error fetching booking by id from pool:", e.message);
    }
  }

  const allLocal = readLocalBookings();
  return allLocal.find((b: any) => 
    String(b.id || '').toLowerCase() === cleanId.toLowerCase() || 
    String(b.bookingId || '').toLowerCase() === cleanId.toLowerCase()
  ) || null;
}

async function saveWaiverAgreement(waiver: any) {
  if (!waiver || (!waiver.id && !waiver.bookingId)) return;
  const waiverId = waiver.id || ("WAV-" + waiver.bookingId);
  const bookingId = waiver.bookingId || waiverId;

  const activePool = await getDbPool();
  if (activePool) {
    try {
      console.log(`💾 [Neon/PostgreSQL] Upserting waiver agreement ${waiverId} for booking ${bookingId}...`);
      await activePool.query(`
        INSERT INTO waiver_agreements (
          id, booking_id, guest_name, communication_address, phone, email, signature, agreement_date,
          has_minor, guardian_name, guardian_address, guardian_phone, guardian_email, guardian_signature, guardian_agreement_date,
          date_of_sailing, invoice_no, boarding_pass_no, trip_1_time, trip_2_time, trip_3_time, trip_4_time, boat_g1
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        )
        ON CONFLICT (id) DO UPDATE SET
          booking_id = EXCLUDED.booking_id,
          guest_name = EXCLUDED.guest_name,
          communication_address = EXCLUDED.communication_address,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          signature = EXCLUDED.signature,
          agreement_date = EXCLUDED.agreement_date,
          has_minor = EXCLUDED.has_minor,
          guardian_name = EXCLUDED.guardian_name,
          guardian_address = EXCLUDED.guardian_address,
          guardian_phone = EXCLUDED.guardian_phone,
          guardian_email = EXCLUDED.guardian_email,
          guardian_signature = EXCLUDED.guardian_signature,
          guardian_agreement_date = EXCLUDED.guardian_agreement_date,
          date_of_sailing = EXCLUDED.date_of_sailing,
          invoice_no = EXCLUDED.invoice_no,
          boarding_pass_no = EXCLUDED.boarding_pass_no,
          trip_1_time = EXCLUDED.trip_1_time,
          trip_2_time = EXCLUDED.trip_2_time,
          trip_3_time = EXCLUDED.trip_3_time,
          trip_4_time = EXCLUDED.trip_4_time,
          boat_g1 = EXCLUDED.boat_g1
      `, [
        waiverId, bookingId, waiver.guestName || waiver.guest_name || '', waiver.communicationAddress || waiver.communication_address || 'Digitally Signed', waiver.phone || '', waiver.email || '', waiver.signature || waiver.guestName || 'Signed', waiver.agreementDate || waiver.agreement_date || new Date().toISOString().split('T')[0],
        Boolean(waiver.hasMinor || waiver.has_minor), waiver.guardianName || waiver.guardian_name || '', waiver.guardianAddress || waiver.guardian_address || '', waiver.guardianPhone || waiver.guardian_phone || '', waiver.guardianEmail || waiver.guardian_email || '', waiver.guardianSignature || waiver.guardian_signature || '', waiver.guardianAgreementDate || waiver.guardian_agreement_date || '',
        waiver.dateOfSailing || waiver.date_of_sailing || '', waiver.invoiceNo || waiver.invoice_no || bookingId, waiver.boardingPassNo || waiver.boarding_pass_no || ("BP-" + bookingId), waiver.trip1Time || waiver.trip_1_time || '', waiver.trip2Time || waiver.trip_2_time || '', waiver.trip3Time || waiver.trip_3_time || '', waiver.trip4Time || waiver.trip_4_time || '', Boolean(waiver.boatG1 || waiver.boat_g1)
      ]);
      console.log(`✅ [Neon/PostgreSQL] Waiver agreement ${waiverId} saved successfully!`);
    } catch (e: any) {
      console.error(`⚠️ Error saving waiver to Neon pool: ${e.message}`);
    }
  }

  // Local JSON fallback
  const data = safeReadJson(WAIVER_AGREEMENTS_FILE, []);
  const idx = data.findIndex((w: any) => w.id === waiverId || w.bookingId === bookingId);
  const updatedEntry = {
    ...waiver,
    id: waiverId,
    bookingId
  };
  if (idx !== -1) {
    data[idx] = { ...data[idx], ...updatedEntry };
  } else {
    data.push(updatedEntry);
  }
  safeWriteJson(WAIVER_AGREEMENTS_FILE, data);
}

async function getWaiverByBookingId(bookingId: string) {
  if (!bookingId) return null;

  const activePool = await getDbPool();
  if (activePool) {
    try {
      const { rows } = await activePool.query('SELECT * FROM waiver_agreements WHERE booking_id = $1 OR id = $1', [bookingId]);
      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          bookingId: r.booking_id,
          guestName: r.guest_name,
          communicationAddress: r.communication_address,
          phone: r.phone,
          email: r.email,
          signature: r.signature,
          agreementDate: r.agreement_date,
          hasMinor: r.has_minor,
          guardianName: r.guardian_name,
          guardianAddress: r.guardian_address,
          guardianPhone: r.guardian_phone,
          guardianEmail: r.guardian_email,
          guardianSignature: r.guardian_signature,
          guardianAgreementDate: r.guardian_agreement_date,
          dateOfSailing: r.date_of_sailing,
          invoiceNo: r.invoice_no,
          boardingPassNo: r.boarding_pass_no,
          trip1Time: r.trip_1_time,
          trip2Time: r.trip_2_time,
          trip3Time: r.trip_3_time,
          trip4Time: r.trip_4_time,
          boatG1: r.boat_g1,
          createdAt: r.created_at
        };
      }
    } catch (e: any) {
      console.error(`Error querying waiver_agreements table: ${e.message}`);
    }
  }

  // Check local JSON
  const data = safeReadJson(WAIVER_AGREEMENTS_FILE, []);
  const localWaiver = data.find((w: any) => w.bookingId === bookingId || w.id === bookingId);
  if (localWaiver) return localWaiver;

  // Fallback: Auto-generate signed waiver agreement from the booking details
  const booking = await getBookingById(bookingId);
  if (booking) {
    const clientName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Valued Guest';
    const autoWaiver = {
      id: "WAV-" + booking.id,
      bookingId: booking.id,
      guestName: clientName,
      communicationAddress: "Digitally Verified",
      phone: booking.phone || '',
      email: booking.email || '',
      signature: clientName,
      agreementDate: booking.date || new Date().toISOString().split('T')[0],
      hasMinor: false,
      guardianName: "",
      guardianAddress: "",
      guardianPhone: "",
      guardianEmail: "",
      guardianSignature: "",
      guardianAgreementDate: "",
      dateOfSailing: booking.date || '',
      invoiceNo: booking.id,
      boardingPassNo: "BP-" + booking.id,
      trip1Time: booking.time || '',
      trip2Time: '',
      trip3Time: '',
      trip4Time: '',
      boatG1: false,
      createdAt: booking.createdAt || new Date().toISOString()
    };
    await saveWaiverAgreement(autoWaiver);
    return autoWaiver;
  }

  return null;
}

async function deleteBookingInDb(id: string) {
  const activePool = await getDbPool();
  if (activePool) {
    await activePool.query('UPDATE bookings SET is_deleted = TRUE WHERE id = $1', [id]);
  } else {
    const pendingFile = path.join(DATA_DIR, 'pending_bookings.json');
    const pendingList = safeReadJson(pendingFile, []);
    const idx = pendingList.findIndex((b: any) => b.id === id);
    if (idx !== -1) {
      pendingList[idx].isDeleted = true;
      safeWriteJson(pendingFile, pendingList);
    }
  }
}

// Reconciliation Job for Pending Offline Queue
async function reconcilePendingBookings() {
  if (!pool) {
    return { total: 0, synced: 0, remaining: 0, message: "PostgreSQL database not connected." };
  }

  const allLocal = readLocalBookings();
  const pendingFile = path.join(DATA_DIR, 'pending_bookings.json');
  const pendingList = safeReadJson(pendingFile, []);

  // Merge items from all local storage files
  const itemsToSyncMap = new Map<string, any>();
  allLocal.forEach((b: any) => { if (b && b.id) itemsToSyncMap.set(b.id, b); });
  pendingList.forEach((b: any) => { if (b && (b.id || b.bookingId)) itemsToSyncMap.set(b.id || b.bookingId, b); });

  const itemsToSync = Array.from(itemsToSyncMap.values());
  if (itemsToSync.length === 0) {
    return { total: 0, synced: 0, remaining: 0, message: "No local bookings to sync." };
  }

  let syncedCount = 0;
  const errors: string[] = [];

  for (const item of itemsToSync) {
    try {
      const source = item.source || (item.id?.startsWith('JMB') ? 'manual' : 'online');
      const createdBy = item.createdBy || item.agentName || null;
      const agentName = item.agentName || item.createdBy || null;
      const notes = item.notes || null;

      const actStr = typeof item.activities === 'string' ? item.activities : JSON.stringify(item.activities || []);

      await pool.query(`
        INSERT INTO bookings (
          id, first_name, last_name, phone, email, date, time, guests, activities, 
          special_request, total_amount, advance_paid, balance_paid, remaining_due, 
          payment_status, ticket_status, advance_payment_mode, balance_payment_mode,
          source, created_by, agent_name, notes, is_deleted, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
        )
        ON CONFLICT (id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          date = EXCLUDED.date,
          time = EXCLUDED.time,
          guests = EXCLUDED.guests,
          activities = EXCLUDED.activities,
          special_request = EXCLUDED.special_request,
          total_amount = EXCLUDED.total_amount,
          advance_paid = EXCLUDED.advance_paid,
          balance_paid = EXCLUDED.balance_paid,
          remaining_due = EXCLUDED.remaining_due,
          payment_status = EXCLUDED.payment_status,
          ticket_status = EXCLUDED.ticket_status,
          advance_payment_mode = EXCLUDED.advance_payment_mode,
          balance_payment_mode = EXCLUDED.balance_payment_mode,
          source = EXCLUDED.source,
          created_by = EXCLUDED.created_by,
          agent_name = EXCLUDED.agent_name,
          notes = EXCLUDED.notes,
          is_deleted = EXCLUDED.is_deleted
      `, [
        item.id || '',
        item.firstName || '',
        item.lastName || '',
        item.phone || '',
        item.email || '',
        item.date || '',
        item.time || '',
        Number(item.guests) || 1,
        actStr,
        item.specialRequest || '',
        Number(item.totalAmount) || 0,
        Number(item.advancePaid) || 0,
        Number(item.balancePaid) || 0,
        Number(item.remainingDue) || 0,
        item.paymentStatus || 'Pending',
        item.ticketStatus || 'Pending',
        item.advancePaymentMode || 'Online',
        item.balancePaymentMode || 'Cash',
        source,
        createdBy,
        agentName,
        notes,
        item.isDeleted || false,
        item.createdAt || new Date().toISOString()
      ]);

      item.synced = true;
      item.syncedAt = new Date().toISOString();
      syncedCount++;

      // Automatically sync waiver agreement record with client name for every booking
      const clientName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Valued Guest';
      await saveWaiverAgreement({
        id: "WAV-" + item.id,
        bookingId: item.id,
        guestName: clientName,
        communicationAddress: "Digitally Verified",
        phone: item.phone || '',
        email: item.email || '',
        signature: clientName,
        agreementDate: item.date || new Date().toISOString().split('T')[0],
        hasMinor: false,
        guardianName: "",
        guardianAddress: "",
        guardianPhone: "",
        guardianEmail: "",
        guardianSignature: "",
        guardianAgreementDate: "",
        dateOfSailing: item.date || '',
        invoiceNo: item.id,
        boardingPassNo: "BP-" + item.id,
        trip1Time: item.time || '',
        createdAt: item.createdAt || new Date().toISOString()
      });

      console.log(`✅ Synced local booking ${item.id} & waiver into Neon PostgreSQL database!`);
    } catch (err: any) {
      console.error(`❌ Reconciliation failed for booking ${item.id}:`, err.message);
      errors.push(`Booking ${item.id}: ${err.message}`);
    }
  }

  if (fs.existsSync(pendingFile)) {
    safeWriteJson(pendingFile, []);
  }

  return {
    total: itemsToSync.length,
    synced: syncedCount,
    remaining: 0,
    errors
  };
}

// Legacy wrappers pointing to unified bookings helpers
async function getManualBookings() {
  return getBookings({ source: 'manual' });
}

async function saveManualBooking(booking: any) {
  return saveBooking({ ...booking, source: 'manual', createdBy: booking.agentName || 'Counter Agent' });
}

async function updateManualBookingInDb(id: string, updates: any) {
  return updateBookingInDb(id, updates);
}

async function getManualBookingById(id: string) {
  return getBookingById(id);
}

async function deleteManualBookingInDb(id: string) {
  return deleteBookingInDb(id);
}



// Rule based bot responder
class ChatbotService {
  async handleChat(messages: any[]) {
    const userMessage = messages[messages.length - 1]?.parts?.[0]?.text?.toLowerCase() || '';
    return this.generateRuleBasedResponse(userMessage, messages);
  }

  generateRuleBasedResponse(message: string, messages?: any[]): string {
    try {
      const db = safeReadJson(CHATBOT_FILE, defaultChatbotConfig);
      
      const activityPrices: Record<string, number> = {
        "parasailing": 2500,
        "jet ski": 700,
        "flying fish": 600,
        "speed boat": 500,
        "banana boat": 500,
        "crazy sofa": 500,
        "doughnut boat": 500,
        "atv": 300,
        "package 2500": 2500,
        "overall package": 4500,
        "overall": 4500
      };
      
      const simpleNumberMatch = message.match(/(\d+)/);
      const foundCount = simpleNumberMatch ? parseInt(simpleNumberMatch[1], 10) : null;
      
      if (foundCount && foundCount > 0 && foundCount < 500) { // realistic person count guardrails
        // Try to match activity defined inside the user message itself
        for (const [key, price] of Object.entries(activityPrices)) {
          if (message.includes(key)) {
            return `Awesome! For ${foundCount} member(s) doing ${key.toUpperCase()}, at ₹${price} per person, the total would be ₹${price * foundCount}/- only. We are open all days (including Sundays and public holidays) from 9:30 AM to 6:00 PM. Would you like to proceed to the booking section to grab your slots?`;
          }
        }
        
        // If not matched, scan back through conversational history (closest message first) to find associated activity
        if (messages && Array.isArray(messages)) {
          for (let i = messages.length - 2; i >= 0; i--) {
            const pastTxt = messages[i]?.parts?.[0]?.text?.toLowerCase() || '';
            for (const [key, price] of Object.entries(activityPrices)) {
              if (pastTxt.includes(key)) {
                return `That sounds like an amazing plan! For ${foundCount} member(s) doing ${key.toUpperCase()}, the rate is ₹${price}/person, making your total only ₹${price * foundCount}/-. In addition, we are open and operating all days of the week! Shall I help you reserve your spots?`;
              }
            }
          }
        }
      }

      for (const [key, answer] of Object.entries(db.exact_matches || {})) {
        if (message.trim() === key) return answer as string;
      }

      for (const [key, answer] of Object.entries(db.keyword_matches || {})) {
        if (message.includes(key)) return answer as string;
      }
    } catch (e) {
      console.error("Failed to read chatbot store", e);
    }

    return "Hi! I am Joy, your personalized virtual assistant! How can I help you today?";
  }
}

export const app = express();

// Configure Express middleware synchronously at module load time for instant Vercel Serverless availability
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(sanitizeInput);

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_jws_default_12345';

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Dynamic / Static SEO Files (robots.txt and sitemap.xml)
  app.get('/robots.txt', (req, res) => {
    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      res.header('Content-Type', 'text/plain');
      return res.sendFile(robotsPath);
    }
    res.type('text/plain').send("User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: https://joywatersports.com/sitemap.xml");
  });

  app.get('/sitemap.xml', (req, res) => {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      res.header('Content-Type', 'application/xml');
      return res.sendFile(sitemapPath);
    }
    res.status(404).send("Sitemap not found");
  });

  // Endpoint to check database connection status
  app.get('/api/db-status', async (req, res) => {
    const activePool = await getDbPool();
    const rawUrl = process.env.DATABASE_URL?.trim();
    let databaseUrlMasked = null;
    if (rawUrl) {
      try {
        const atIdx = rawUrl.lastIndexOf('@');
        const protocolIdx = rawUrl.indexOf('://');
        const hostInfo = atIdx !== -1 ? rawUrl.substring(atIdx + 1) : rawUrl.substring(protocolIdx !== -1 ? protocolIdx + 3 : 0);
        const protocol = protocolIdx !== -1 ? rawUrl.substring(0, protocolIdx + 3) : 'postgresql://';
        databaseUrlMasked = `${protocol}***@${hostInfo}`;
      } catch (e) {
        databaseUrlMasked = "Configured (Unable to parse/mask)";
      }
    }
    res.json({
      connected: activePool !== null,
      type: activePool ? "postgres" : "local",
      databaseUrlSet: !!rawUrl,
      databaseUrlMasked
    });
  });

  // Check if Admin password setup has been completed
  const checkSetupHandler = async (req: express.Request, res: express.Response) => {
    try {
      const admin = await getAdminUser('admin');
      res.json({ isSetup: !!(admin && admin.password_hash) });
    } catch (err) {
      res.status(500).json({ error: 'Failed to verify admin status.' });
    }
  };
  app.get('/api/admin/setup-status', checkSetupHandler);
  app.get('/api/admin/check-setup', checkSetupHandler);

  // Request secure OTP for first-time setup (prints to server logs)
  app.post('/api/admin/request-setup-otp', loginLimiter, async (req, res) => {
    try {
      const admin = await getAdminUser('admin');
      if (admin && admin.password_hash) {
        return res.status(400).json({ error: 'Admin account has already been set up.' });
      }

      const mobileNumber = (req.body.mobileNumber || req.body.mobile || '').toString().trim();
      if (!mobileNumber || mobileNumber.length < 10) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number first.' });
      }

      // Generate secure 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes validity
      
      // Save setup credential state into admin_users database table
      await saveAdminUser('admin', {
        otp_code: otp,
        otp_expiry: String(expiry),
        mobile_number: mobileNumber
      });

      // Log clearly to Node/Supabase terminal console
      console.log(`\n🔑 ==========================================`);
      console.log(`🔑 [ADMIN PORTAL - FIRST-TIME ACCOUNT CREATION]`);
      console.log(`🔑 FOR MOBILE NUMBER: ${mobileNumber}`);
      console.log(`🔑 SETUP VERIFICATION OTP IS: ${otp}`);
      console.log(`🔑 This code is valid for 10 minutes.`);
      console.log(`🔑 ==========================================\n`);

      res.json({ 
        success: true, 
        message: 'OTP has been generated! For safety, check your server console terminal/logs for the 6-digit activation code.' 
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to request admin setup OTP.' });
    }
  });

  // Complete admin registration by validating setup OTP and hashing custom password
  app.post('/api/admin/setup-password', loginLimiter, async (req, res) => {
    try {
      const admin = await getAdminUser('admin');
      if (admin && admin.password_hash) {
        return res.status(400).json({ error: 'Admin account has already been set up.' });
      }

      const { password, otp } = req.body;
      if (!password || !otp) {
        return res.status(400).json({ error: 'Password and OTP are required.' });
      }

      if (!admin || !admin.otp_code) {
        return res.status(400).json({ error: 'No OTP session found. Please request an OTP first.' });
      }

      if (admin.otp_code !== otp.toString().trim()) {
        return res.status(400).json({ error: 'Invalid verification OTP code. Please check your console.' });
      }

      if (Date.now() > Number(admin.otp_expiry)) {
        return res.status(400).json({ error: 'OTP code has expired. Please request a new setup OTP.' });
      }

      // Hash password securely with bcrypt and store
      const saltRounds = 10;
      const hashed = await bcrypt.hash(password, saltRounds);
      
      // Update the secure DB row with hashed password and clear OTP parameters
      await saveAdminUser('admin', {
        password_hash: hashed,
        otp_code: '',
        otp_expiry: ''
      });

      const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });

      res.json({ success: true, token, message: 'Admin account password registered successfully!' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to register admin password.' });
    }
  });

  // Request secure OTP for password reset (Forgot Password)
  const requestResetOtpHandler = async (req: express.Request, res: express.Response) => {
    try {
      const admin = await getAdminUser('admin');
      if (!admin || !admin.password_hash) {
        return res.status(400).json({ error: 'Admin account has not been set up yet.' });
      }

      const mobileNumber = (req.body.mobileNumber || req.body.mobile || '').toString().trim();
      if (!mobileNumber || mobileNumber.length < 10) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number first.' });
      }

      if (admin.mobile_number && admin.mobile_number !== mobileNumber) {
        return res.status(400).json({ error: 'Incorrect mobile number. Access denied.' });
      }

      // Generate secure 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes validity
      
      // Save setup credential state into admin_users database table
      await saveAdminUser('admin', {
        otp_code: otp,
        otp_expiry: String(expiry)
      });

      // Log clearly to Node/Supabase terminal console
      console.log(`\n🔑 ==========================================`);
      console.log(`🔑 [ADMIN PORTAL - PASSWORD RESET / RECOVERY]`);
      console.log(`🔑 FOR MOBILE NUMBER: ${mobileNumber}`);
      console.log(`🔑 RESET PW VERIFICATION OTP IS: ${otp}`);
      console.log(`🔑 This code is valid for 10 minutes.`);
      console.log(`🔑 ==========================================\n`);

      res.json({ 
        success: true, 
        message: 'OTP has been generated! For safety, check your server console terminal/logs for the 6-digit verification code.' 
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to request reset OTP.' });
    }
  };
  app.post('/api/admin/forgot-password/request', loginLimiter, requestResetOtpHandler);
  app.post('/api/admin/request-reset-otp', loginLimiter, requestResetOtpHandler);
  app.post('/api/admin/send-otp', loginLimiter, requestResetOtpHandler);

  // Complete admin password reset / verify OTP
  const resetPasswordHandler = async (req: express.Request, res: express.Response) => {
    try {
      const admin = await getAdminUser('admin');
      if (!admin || !admin.password_hash) {
        return res.status(400).json({ error: 'Admin account has not been set up yet.' });
      }

      const password = req.body.newPassword || req.body.password;
      const otp = req.body.otp;
      if (!otp) {
        return res.status(400).json({ error: 'OTP is required.' });
      }

      if (!admin.otp_code) {
        return res.status(400).json({ error: 'No OTP session found. Please request an OTP first.' });
      }

      if (admin.otp_code !== otp.toString().trim()) {
        return res.status(400).json({ error: 'Invalid verification OTP code. Please try again.' });
      }

      if (Date.now() > Number(admin.otp_expiry)) {
        return res.status(400).json({ error: 'OTP code has expired. Please request a new OTP.' });
      }

      let token: string | undefined;
      // If password provided, update it
      if (password) {
        const saltRounds = 10;
        const hashed = await bcrypt.hash(password, saltRounds);
        await saveAdminUser('admin', {
          password_hash: hashed,
          otp_code: '',
          otp_expiry: ''
        });
        token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
      } else {
        // Just verify OTP
        token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
        await saveAdminUser('admin', {
          otp_code: '',
          otp_expiry: ''
        });
      }

      res.json({ success: true, token, message: 'OTP verified successfully!' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to verify admin OTP.' });
    }
  };
  app.post('/api/admin/forgot-password/reset', loginLimiter, resetPasswordHandler);
  app.post('/api/admin/reset-password', loginLimiter, resetPasswordHandler);
  app.post('/api/admin/verify-otp', loginLimiter, resetPasswordHandler);

  app.post('/api/admin/login', loginLimiter, async (req, res) => {
    try {
      const { password } = req.body;
      const admin = await getAdminUser('admin');

      if (!admin || !admin.password_hash) {
        return res.status(400).json({ 
          error: 'Admin account has not been setup yet. Please initialize security setup.',
          notSetup: true 
        });
      }

      const isMatch = await bcrypt.compare(password, admin.password_hash);
      if (isMatch) {
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
        res.json({ success: true, token });
      } else {
        res.status(401).json({ error: 'Invalid admin credentials.' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Error processing admin login.' });
    }
  });

  // Helper to hash refresh tokens before storing in database
  const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
  };

  // Helper to issue access & refresh tokens with DB session tracking in NeonDB
  const issueAuthTokens = async (req: any, res: any, user: { id: string; email: string }) => {
    const userIdStr = String(user.id);
    const accessToken = jwt.sign(
      { userId: userIdStr, email: user.email, type: 'access' },
      JWT_SECRET,
      { expiresIn: '15m' } // Short-lived 15 min access token
    );

    const refreshToken = jwt.sign(
      { userId: userIdStr, email: user.email, type: 'refresh', jti: crypto.randomUUID() },
      JWT_SECRET,
      { expiresIn: '7d' } // 7-day refresh token rotation
    );

    const tokenHash = hashToken(refreshToken);
    const deviceInfo = (req.headers['user-agent'] || 'Unknown Device').toString();
    const rawIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString();
    const ipAddress = rawIp ? rawIp.split(',')[0].trim() : 'Unknown';
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Track session token in NeonDB if database connection active
    const activePool = await getDbPool();
    if (activePool) {
      try {
        await ensureRefreshTokensTable(activePool);
        await activePool.query(
          `INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at) 
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (token_hash) DO NOTHING`,
          [userIdStr, tokenHash, deviceInfo, ipAddress, expiresAt]
        );
      } catch (dbErr: any) {
        console.warn('Refresh token DB recording warning:', dbErr?.message || dbErr);
      }
    }

    const csrfToken = crypto.randomBytes(24).toString('hex');
    const isProduction = process.env.NODE_ENV === 'production';

    // HTTP-only Cookie for Refresh Token (7 days)
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api'
    });

    // Double-Submit CSRF Token Cookie (accessible to JS for X-XSRF-TOKEN header)
    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/'
    });

    return { accessToken, refreshToken, csrfToken };
  };

  app.post('/api/register', loginLimiter, async (req, res) => {
    try {
      // 1. Input Validation & Sanitization with Zod
      const parseResult = RegisterSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.issues.map(e => e.message).join(', ');
        return res.status(400).json({ error: errorMsg });
      }

      const { email, password, firstName, lastName, phone, countryCode, emergencyContact } = parseResult.data;
      
      // Validate Phone Format per Country using libphonenumber-js
      let formattedPhone = '';
      if (phone && phone.trim()) {
        try {
          const parsedPhone = parsePhoneNumberFromString(phone.trim(), (countryCode || 'IN') as CountryCode);
          if (!parsedPhone || !parsedPhone.isValid()) {
            return res.status(400).json({ error: `Invalid mobile phone number for country code ${countryCode || 'IN'}` });
          }
          formattedPhone = parsedPhone.format('E.164'); // e.g. +919876543210
        } catch (e) {
          return res.status(400).json({ error: 'Failed to parse mobile number for selected country' });
        }
      }

      // 2. Password Hashing with bcrypt (Salt rounds = 12)
      const passwordHash = await bcrypt.hash(password, 12);
      
      // 3. Encrypt Sensitive Fields at Rest (e.g., Emergency Contact)
      const encryptedEmergencyContact = emergencyContact ? encryptSensitiveData(emergencyContact) : '';

      const activePool = await getDbPool();
      let user: any = null;
      if (activePool) {
        await ensureUsersTable(activePool);

        let checkRows: any[] = [];
        try {
          const checkUser = await activePool.query(
            'SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR (phone IS NOT NULL AND phone = $2 AND phone <> \'\')', 
            [email, formattedPhone || '']
          );
          checkRows = checkUser.rows;
        } catch (dbQueryErr: any) {
          console.warn('Postgres check user query warning, falling back to JSON check:', dbQueryErr?.message);
          const rawUsers = safeReadJson(USERS_FILE, []);
          checkRows = Array.isArray(rawUsers) ? rawUsers : [];
        }

        const matchedEmail = checkRows.some((r: any) => r.email?.toLowerCase() === email.toLowerCase());
        const matchedPhone = formattedPhone ? checkRows.some((r: any) => r.phone === formattedPhone) : false;
        if (matchedEmail) {
          return res.status(400).json({ error: 'User with this Email address already exists' });
        } else if (matchedPhone) {
          return res.status(400).json({ error: 'User with this Mobile number already exists' });
        }

        try {
          const result = await activePool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, phone, emergency_contact_encrypted, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
             RETURNING id, email, first_name, last_name, phone`,
            [email, passwordHash, firstName, lastName, formattedPhone || '', encryptedEmergencyContact]
          );
          user = result.rows[0];
        } catch (dbInsertErr: any) {
          console.warn('Postgres insert user failed, falling back to JSON storage:', dbInsertErr?.message);
          const rawUsers = safeReadJson(USERS_FILE, []);
          const users = Array.isArray(rawUsers) ? rawUsers : [];
          user = {
            id: Date.now().toString(),
            email: email,
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName,
            phone: formattedPhone || '',
            emergency_contact_encrypted: encryptedEmergencyContact,
            created_at: new Date().toISOString()
          };
          users.push(user);
          safeWriteJson(USERS_FILE, users);
        }
      } else {
        const rawUsers = safeReadJson(USERS_FILE, []);
        const users = Array.isArray(rawUsers) ? rawUsers : [];
        const matchedEmail = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        const matchedPhone = formattedPhone ? users.find((u: any) => u.phone === formattedPhone) : null;
        
        if (matchedEmail) {
          return res.status(400).json({ error: 'User with this Email address already exists' });
        }
        if (matchedPhone) {
          return res.status(400).json({ error: 'User with this Mobile number already exists' });
        }
        
        user = {
          id: Date.now().toString(),
          email: email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          phone: formattedPhone || '',
          emergency_contact_encrypted: encryptedEmergencyContact,
          created_at: new Date().toISOString()
        };
        users.push(user);
        safeWriteJson(USERS_FILE, users);
      }
      
      const userIdStr = String(user.id);
      const { accessToken, csrfToken } = await issueAuthTokens(req, res, { id: userIdStr, email: user.email });

      // Trigger sync of registration data to userlogindata Google Spreadsheet
      const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim();
      syncUserLoginDataToSheets({
        action: 'REGISTER',
        userId: userIdStr,
        email: user.email,
        firstName: user.first_name || user.firstName || firstName || '',
        lastName: user.last_name || user.lastName || lastName || '',
        phone: user.phone || formattedPhone || '',
        ipAddress: clientIp,
        userAgent: (req.headers['user-agent'] || '').toString()
      }).catch(err => console.warn('User login sheet sync error:', err));

      return res.status(201).json({ 
        success: true, 
        token: accessToken, 
        csrfToken,
        user: { 
          id: userIdStr, 
          email: user.email,
          firstName: user.first_name || user.firstName || firstName || '',
          lastName: user.last_name || user.lastName || lastName || '',
          phone: user.phone || formattedPhone || ''
        } 
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Failed to register account. Please try again.' });
    }
  });

  app.post('/api/login', loginLimiter, async (req, res) => {
    try {
      const parseResult = LoginSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.issues.map(e => e.message).join(', ');
        return res.status(400).json({ error: errorMsg });
      }

      const { email, password } = parseResult.data;

      const activePool = await getDbPool();
      let user: any = null;
      if (activePool) {
        await ensureUsersTable(activePool);
        try {
          const result = await activePool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR phone = $1', [email]);
          user = result.rows[0];
        } catch (dbQueryErr: any) {
          console.warn('Postgres login query warning, falling back to local file:', dbQueryErr?.message);
          const rawUsers = safeReadJson(USERS_FILE, []);
          const users = Array.isArray(rawUsers) ? rawUsers : [];
          user = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase() || (u.phone && u.phone === email));
        }
      } else {
        const rawUsers = safeReadJson(USERS_FILE, []);
        const users = Array.isArray(rawUsers) ? rawUsers : [];
        user = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase() || (u.phone && u.phone === email));
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid email, mobile or password' });
      }

      let match = false;
      const storedHash = user.password_hash || user.passwordHash || user.password || '';
      
      // Standard bcrypt comparison
      if (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$')) {
        match = await bcrypt.compare(password, storedHash);
      } else {
        // Safe Graceful Legacy Migration: Check plaintext or legacy hash for pre-existing records
        match = (password === storedHash);
        if (match) {
          // Transparently upgrade user to bcrypt(12) hash without forcing password reset!
          const newBcryptHash = await bcrypt.hash(password, 12);
          if (activePool) {
            try {
              await activePool.query('UPDATE users SET password_hash = $1, is_legacy_auth = FALSE WHERE id = $2', [newBcryptHash, user.id]);
            } catch (e) {}
          }
        }
      }

      if (!match) {
        return res.status(401).json({ error: 'Invalid email, mobile or password' });
      }

      // Update last login timestamp in DB
      if (activePool) {
        activePool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]).catch(() => {});
      }

      const userIdStr = String(user.id);
      const { accessToken, csrfToken } = await issueAuthTokens(req, res, { id: userIdStr, email: user.email });

      // Trigger sync of login data to userlogindata Google Spreadsheet
      const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim();
      syncUserLoginDataToSheets({
        action: 'LOGIN',
        userId: userIdStr,
        email: user.email,
        firstName: user.first_name || user.firstName || '',
        lastName: user.last_name || user.lastName || '',
        phone: user.phone || '',
        ipAddress: clientIp,
        userAgent: (req.headers['user-agent'] || '').toString()
      }).catch(err => console.warn('User login sheet sync error:', err));

      return res.json({ 
        success: true, 
        token: accessToken, 
        csrfToken,
        user: { 
          id: userIdStr, 
          email: user.email,
          firstName: user.first_name || user.firstName || '',
          lastName: user.last_name || user.lastName || '',
          phone: user.phone || ''
        } 
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Failed to login. Please try again.' });
    }
  });

  // Silent Token Renewal via HTTP-Only Refresh Cookie & Token Rotation
  app.post('/api/refresh', async (req, res) => {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token missing' });
      }

      const tokenHash = hashToken(refreshToken);

      // Check NeonDB refresh_tokens session store if database active
      if (pool) {
        const tokenRes = await pool.query(
          'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()',
          [tokenHash]
        );
        if (tokenRes.rows.length === 0) {
          res.clearCookie('refresh_token', { path: '/api' });
          return res.status(401).json({ error: 'Session expired or revoked' });
        }
      }

      jwt.verify(refreshToken, JWT_SECRET, async (err: any, decoded: any) => {
        if (err || decoded?.type !== 'refresh') {
          res.clearCookie('refresh_token', { path: '/api' });
          return res.status(403).json({ error: 'Invalid or expired refresh token' });
        }

        // Revoke current refresh token (Token Rotation)
        if (pool) {
          await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [tokenHash]);
        }

        // Issue new access + refresh token pair
        const { accessToken, csrfToken } = await issueAuthTokens(req, res, { id: decoded.userId, email: decoded.email });
        res.json({ success: true, token: accessToken, csrfToken });
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to refresh session' });
    }
  });

  // Logout current device (Revokes active session in NeonDB & clears cookies)
  app.post('/api/logout', async (req, res) => {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken && pool) {
        const tokenHash = hashToken(refreshToken);
        await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [tokenHash]);
      }

      const isProduction = process.env.NODE_ENV === 'production';
      res.clearCookie('refresh_token', { path: '/api', httpOnly: true, secure: isProduction, sameSite: 'lax' });
      res.clearCookie('XSRF-TOKEN', { path: '/', httpOnly: false, secure: isProduction, sameSite: 'lax' });
      res.json({ success: true, message: 'Logged out successfully from this device' });
    } catch (err) {
      res.status(500).json({ error: 'Error processing logout' });
    }
  });

  // Logout from ALL devices (Revokes all active refresh tokens for user in NeonDB)
  app.post('/api/logout-all', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1] || req.cookies?.access_token;
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (pool && decoded?.userId) {
        await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [decoded.userId]);
      }

      const isProduction = process.env.NODE_ENV === 'production';
      res.clearCookie('refresh_token', { path: '/api', httpOnly: true, secure: isProduction, sameSite: 'lax' });
      res.clearCookie('XSRF-TOKEN', { path: '/', httpOnly: false, secure: isProduction, sameSite: 'lax' });
      res.json({ success: true, message: 'Successfully logged out from all devices' });
    } catch (err) {
      res.status(401).json({ error: 'Invalid token or session' });
    }
  });

  // Current Logged-In User Profile Endpoint
  app.get('/api/user/me', async (req, res) => {
    try {
      const token = req.cookies?.access_token || req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const decoded: any = jwt.verify(token, JWT_SECRET);
      let user: any = null;

      if (pool) {
        await ensureUsersTable(pool);
        try {
          const result = await pool.query(
            'SELECT id, email, first_name, last_name, phone FROM users WHERE CAST(id AS TEXT) = $1 OR LOWER(email) = LOWER($2)', 
            [String(decoded.userId), String(decoded.email || '')]
          );
          user = result.rows[0];
        } catch (dbQueryErr: any) {
          console.warn('Postgres profile lookup warning, falling back to JSON:', dbQueryErr?.message);
          const rawUsers = safeReadJson(USERS_FILE, []);
          const users = Array.isArray(rawUsers) ? rawUsers : [];
          user = users.find((u: any) => String(u.id) === String(decoded.userId) || u.email?.toLowerCase() === decoded.email?.toLowerCase());
        }
      } else {
        const rawUsers = safeReadJson(USERS_FILE, []);
        const users = Array.isArray(rawUsers) ? rawUsers : [];
        user = users.find((u: any) => String(u.id) === String(decoded.userId) || u.email?.toLowerCase() === decoded.email?.toLowerCase());
      }

      if (!user) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      return res.json({
        user: {
          id: String(user.id),
          email: user.email,
          firstName: user.first_name || user.firstName || '',
          lastName: user.last_name || user.lastName || '',
          phone: user.phone || ''
        }
      });
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired access session' });
    }
  });

  app.get('/api/ticket/qr/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const qrDataUrl = await QRCode.toDataURL(id, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 250,
        color: { dark: '#14213D', light: '#F9FAFB' }
      });
      const imgBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
      res.setHeader('Content-Type', 'image/png');
      res.send(imgBuffer);
    } catch (e) {
      res.status(500).json({ error: 'Failed to generate secure QR' });
    }
  });

  const chatbot = new ChatbotService();

  app.post('/api/chat', async (req, res) => {
    try {
      const userMessages = req.body.messages;
      if (!Array.isArray(userMessages)) {
        return res.status(400).json({ error: 'Invalid messages format' });
      }
      
      const reply = await chatbot.handleChat(userMessages);
      res.json({ reply });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to process chat' });
    }
  });

  // Helper to check for multiple package options conflict (only 1 package option allowed per booking)
  function isPackageOptionName(name: string): boolean {
    if (!name) return false;
    const lower = String(name).toLowerCase();
    return (
      lower.includes('package') ||
      lower.includes('pack') ||
      lower.includes('parasailing') ||
      lower === 'overall'
    );
  }

  function hasMultiplePackagesConflict(activities: any): boolean {
    if (!activities) return false;

    let actList: string[] = [];

    if (Array.isArray(activities)) {
      actList = activities.map((a: any) => {
        if (typeof a === 'string') return a;
        if (typeof a === 'object' && a !== null && a.name) return String(a.name);
        return String(a);
      });
    } else if (typeof activities === 'string') {
      let rawStr = activities;
      if (rawStr.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(rawStr);
          if (Array.isArray(parsed)) {
            actList = parsed.map((a: any) => typeof a === 'object' && a !== null ? (a.name || String(a)) : String(a));
          }
        } catch (e) {}
      }
      if (actList.length === 0) {
        actList = rawStr.split(',').map(s => s.trim());
      }
    }

    const selectedPackages = actList.filter(isPackageOptionName);
    return selectedPackages.length > 1;
  }

  // Create Booking (with merged Declaration validation)
  app.post('/api/bookings', async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        date,
        time,
        activities,
        declarationAgreed,
        communicationAddress,
        signature,
        guestName,
        agreementDate,
        hasGuardian,
        guardianName,
        guardianAddress,
        guardianPhone,
        guardianEmail,
        guardianSignature,
        guardianAgreementDate
      } = req.body;

      let resolvedFirstName = (firstName && typeof firstName === 'string') ? firstName.trim() : '';
      let resolvedLastName = (lastName && typeof lastName === 'string') ? lastName.trim() : '';
      if (!resolvedFirstName) {
        const altName = (guestName || req.body.customerName || req.body.name || '').trim();
        if (altName) {
          const parts = altName.split(' ');
          resolvedFirstName = parts[0];
          resolvedLastName = parts.slice(1).join(' ');
        }
      }

      // 1. Validate Booking Details
      if (!resolvedFirstName) {
        return res.status(400).json({ error: 'First Name is required.' });
      }
      if (!email || typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({ error: 'Email Address is required.' });
      }
      if (!phone || typeof phone !== 'string' || !phone.trim()) {
        return res.status(400).json({ error: 'Phone Number is required.' });
      }
      if (!date || typeof date !== 'string' || !date.trim()) {
        return res.status(400).json({ error: 'Sailing Date is required.' });
      }
      if (!time || typeof time !== 'string' || !time.trim()) {
        return res.status(400).json({ error: 'Time Slot is required.' });
      }
      if (!activities || (Array.isArray(activities) && activities.length === 0)) {
        return res.status(400).json({ error: 'Please select at least one activity or package.' });
      }

      if (hasMultiplePackagesConflict(activities)) {
        return res.status(400).json({ error: 'Only one package can be selected per booking.' });
      }

      const effectiveGuestName = (guestName && typeof guestName === 'string' && guestName.trim())
        ? guestName.trim()
        : `${resolvedFirstName} ${resolvedLastName}`.trim() || 'Guest Participant';

      const effectiveAddress = (communicationAddress && typeof communicationAddress === 'string' && communicationAddress.trim())
        ? communicationAddress.trim()
        : 'Online Guest, Varkala';

      const effectiveSignature = (signature && typeof signature === 'string' && signature.trim())
        ? signature.trim()
        : 'DIGITAL_ACCEPTED';

      const bookingId = "JWS" + crypto.randomBytes(4).toString('hex').toUpperCase();
      
      const totalAmt = Number(req.body.totalAmount) || 0;
      const advPaid = Number(req.body.advancePaid) || 0;
      const balPaid = Number(req.body.balancePaid) || 0;
      const remDue = Math.max(0, totalAmt - advPaid - balPaid);

      let paymentStatus = 'Pending';
      if (remDue === 0 && totalAmt > 0) {
        paymentStatus = 'Completed';
      } else if (advPaid > 0 || balPaid > 0) {
        paymentStatus = 'Partial Paid';
      }

      const effectiveAgreementDate = agreementDate || date || new Date().toISOString().split('T')[0];

      const newBooking = { 
        ...req.body, 
        id: bookingId, 
        guestName: effectiveGuestName,
        communicationAddress: effectiveAddress,
        signature: effectiveSignature,
        agreementDate: effectiveAgreementDate,
        declarationAgreed: true,
        createdAt: new Date().toISOString(),
        paymentStatus,
        ticketStatus: 'Pending',
        advancePaid: advPaid,
        balancePaid: balPaid,
        advancePaymentMode: req.body.advancePaymentMode || 'Online',
        balancePaymentMode: req.body.balancePaymentMode || 'Cash',
        remainingDue: remDue
      };
      
      await saveBooking(newBooking);

      // Save corresponding Waiver record locally linked with the same bookingId
      const waiverRecord = {
        id: "WAV" + crypto.randomBytes(4).toString('hex').toUpperCase(),
        bookingId,
        guestName: effectiveGuestName,
        communicationAddress: effectiveAddress,
        phone,
        email,
        signature: effectiveSignature,
        agreementDate: effectiveAgreementDate,
        hasMinor: !!hasGuardian,
        guardianName: guardianName || '',
        guardianAddress: guardianAddress || '',
        guardianPhone: guardianPhone || '',
        guardianEmail: guardianEmail || '',
        guardianSignature: guardianSignature || '',
        guardianAgreementDate: guardianAgreementDate || effectiveAgreementDate,
        dateOfSailing: date,
        invoiceNo: bookingId,
        boardingPassNo: `BP-${bookingId}`,
        declarationAgreed: true,
        createdAt: new Date().toISOString()
      };
      
      saveWaiverAgreement(waiverRecord).catch(err => console.error(`Async waiver save error for ${bookingId}:`, err));
      sendWaiverToGoogleSheets(waiverRecord).catch(err => console.error(`Async Declaration Sheets sync error for ${bookingId}:`, err));

      // Sync online activity booking data exclusively to Sheet1
      sendToGoogleSheets(newBooking).catch(err => console.error(`Async Google Sheets sync error for ${newBooking.id}:`, err));
      
      res.json({ success: true, booking: newBooking });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save booking' });
    }
  });

  // Create Waiver Agreement
  app.post('/api/waivers', async (req, res) => {
    try {
      const waiverId = "WAV" + crypto.randomBytes(4).toString('hex').toUpperCase();
      const waiver = {
        ...req.body,
        id: waiverId,
        createdAt: new Date().toISOString()
      };
      
      await saveWaiverAgreement(waiver);
      const synced = await sendWaiverToGoogleSheets(waiver);

      // If associated with an existing booking ID, update signature locally in DB
      const targetBookingId = waiver.bookingId || waiver.invoiceNo;
      if (targetBookingId && targetBookingId !== 'N/A') {
        const existingBooking = await getBookingById(targetBookingId);
        if (existingBooking) {
          const updatedBooking = {
            ...existingBooking,
            signature: waiver.signature || waiver.guestSignature || existingBooking.signature || '',
            guestSignature: waiver.signature || waiver.guestSignature || existingBooking.guestSignature || '',
            declarationAgreed: true
          };
          await saveBooking(updatedBooking);
        }
      }

      res.json({ success: true, waiver, syncedToSheets: synced });
    } catch (err) {
      console.error("Waiver save error:", err);
      res.status(500).json({ error: 'Failed to save waiver agreement' });
    }
  });

  // Get Waiver Agreement by Booking ID
  const getWaiverHandler = async (req: express.Request, res: express.Response) => {
    try {
      const waiver = await getWaiverByBookingId(req.params.bookingId);
      if (waiver) {
        res.json(waiver);
      } else {
        res.status(404).json({ error: 'Waiver agreement not found' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Error fetching waiver agreement' });
    }
  };
  app.get('/api/waivers/:bookingId', getWaiverHandler);
  app.get('/api/waiver/:bookingId', getWaiverHandler);

  // Edit Booking
  app.put('/api/bookings/:id', adminAuth, async (req, res) => {
    try {
      if (req.body.activities && hasMultiplePackagesConflict(req.body.activities)) {
        return res.status(400).json({ error: 'Only one package can be selected per booking.' });
      }

      const b = await getBookingById(req.params.id);
      if (!b) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const updatedBooking = { ...b, ...req.body };
      
      const advance = Number(updatedBooking.advancePaid) || 0;
      const balance = Number(updatedBooking.balancePaid) || 0;
      const total = Number(updatedBooking.totalAmount) || 0;
      
      updatedBooking.remainingDue = Math.max(0, total - advance - balance);
      
      if (updatedBooking.remainingDue === 0 && total > 0) {
        updatedBooking.paymentStatus = "Completed";
      } else if (advance > 0 || balance > 0) {
        updatedBooking.paymentStatus = "Partial Paid";
      } else {
        updatedBooking.paymentStatus = "Pending";
      }
      
      await updateBookingInDb(req.params.id, updatedBooking);
      sendToGoogleSheets(updatedBooking).catch(err => console.error(`Async Google Sheets sync error for ${updatedBooking.id}:`, err));

      res.json({ message: 'Booking updated', booking: updatedBooking });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update booking' });
    }
  });

  // Get ticket by ID
  app.get('/api/ticket/:id', async (req, res) => {
    try {
      const booking = await getBookingById(req.params.id);
      if (booking) {
        res.json(booking);
      } else {
        res.status(404).json({ error: 'Ticket not found' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Error fetching ticket' });
    }
  });

  // Customer-facing booking lookup (by phone or booking ID)
  app.post('/api/customer/lookup', async (req, res) => {
    try {
      const { phoneOrId } = req.body;
      if (!phoneOrId || !String(phoneOrId).trim()) {
        return res.status(400).json({ error: 'Please enter a valid Phone Number or Ticket ID.' });
      }

      const input = String(phoneOrId).trim();
      const cleanDigits = input.replace(/\D/g, '');

      const allBookings = await getBookings();
      
      const matches = allBookings.filter((b: any) => {
        if (b.isDeleted) return false;
        const bId = String(b.id || '').toLowerCase();
        const bBookingId = String(b.bookingId || '').toLowerCase();
        const matchId = bId === input.toLowerCase() || bBookingId === input.toLowerCase();
        
        const bPhone = String(b.phone || '').replace(/\D/g, '');
        const matchPhone = cleanDigits.length >= 7 && bPhone.endsWith(cleanDigits.slice(-10));

        return matchId || matchPhone;
      });

      if (matches.length === 0) {
        return res.status(404).json({ error: 'No active bookings found matching the provided Phone Number or Ticket ID.' });
      }

      const sanitized = matches.map((b: any) => {
        const total = Math.round(Number(b.totalAmount) || 0);
        const adv = Math.round(Number(b.advancePaid) || 0);
        const bal = Math.round(Number(b.balancePaid) || 0);
        const rem = b.remainingDue !== undefined 
          ? Math.round(Number(b.remainingDue)) 
          : Math.max(0, total - adv - bal);

        return {
          id: b.id,
          firstName: b.firstName,
          lastName: b.lastName ? `${b.lastName.substring(0, 1)}.` : '',
          date: b.date,
          time: b.time,
          guests: b.guests,
          activities: b.activities,
          totalAmount: total,
          advancePaid: adv,
          balancePaid: bal,
          remainingDue: rem,
          paymentStatus: b.paymentStatus,
          ticketStatus: b.ticketStatus
        };
      });

      res.json({ success: true, bookings: sanitized });
    } catch (error) {
      console.error('Customer lookup error:', error);
      res.status(500).json({ error: 'Failed to look up booking details.' });
    }
  });

  // Cache company logo as base64 for embedding into exported SVG ticket images
  let cachedLogoBase64: string | null = null;
  async function getLogoBase64(): Promise<string> {
    if (cachedLogoBase64) return cachedLogoBase64;
    try {
      const response = await fetch('https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx');
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        cachedLogoBase64 = Buffer.from(arrayBuffer).toString('base64');
        return cachedLogoBase64;
      }
    } catch (err) {
      console.error('Failed to fetch company logo for SVG ticket:', err);
    }
    return '';
  }

  // Export ticket image using Sharp (renders high-quality SVG container stream seamlessly)
  app.get('/api/ticket/export/:id', async (req, res) => {
    try {
      const booking = await getBookingById(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const qrCodeBuffer = await QRCode.toBuffer(booking.id, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 150,
        color: { dark: '#0B192C', light: '#FFFFFF' }
      });

      const logoBase64 = await getLogoBase64();

      const customerName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim();
      const formatAct = Array.isArray(booking.activities) ? booking.activities.join(', ') : String(booking.activities || '');
      const totalAmount = Number(booking.totalAmount) || 0;
      const advancePaid = Number(booking.advancePaid) || 0;
      const balancePaid = Number(booking.balancePaid) || 0;
      const remainingDue = booking.remainingDue !== undefined ? Number(booking.remainingDue) : Math.max(0, totalAmount - advancePaid - balancePaid);
      const isPaid = remainingDue === 0;

      // Construct an ultra-premium, minimalist vector SVG ticket pass with website brand color palette
      const svgTicket = `
        <svg width="440" height="730" viewBox="0 0 440 730" xmlns="http://www.w3.org/2000/svg">
          <!-- Main Outer Card Frame -->
          <rect width="440" height="730" rx="28" fill="#FFFFFF" stroke="#004E98" stroke-width="4"/>
          
          <!-- Premium Deep Navy Header Banner -->
          <path d="M 0 28 A 28 28 0 0 1 28 0 L 412 0 A 28 28 0 0 1 440 28 L 440 125 L 0 125 Z" fill="#091F44"/>
          <!-- Sky Blue Accent Line -->
          <rect x="0" y="123" width="440" height="4" fill="#00A6FB"/>
          
          <!-- Company Logo Frame & Image -->
          <rect x="190" y="12" width="60" height="60" rx="16" fill="#FFFFFF" fill-opacity="0.15" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="1.5"/>
          ${logoBase64 ? `<image x="195" y="17" width="50" height="50" href="data:image/png;base64,${logoBase64}"/>` : ''}

          <text x="220" y="90" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">JOY WATER SPORTS</text>
          <text x="220" y="110" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="800" fill="#00A6FB" text-anchor="middle" letter-spacing="1.5">VARKALA BEACH • PREMIUM ADVENTURE PASS</text>
          
          <!-- Ticket Type Badge -->
          <rect x="140" y="132" width="160" height="26" rx="13" fill="#F0F9FF" stroke="#00A6FB" stroke-width="1.2"/>
          <text x="220" y="149" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="900" fill="#004E98" text-anchor="middle" letter-spacing="1">DIGITAL ADMISSION PASS</text>
          
          <!-- QR Code Container -->
          <rect x="135" y="170" width="170" height="170" rx="20" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
          <image x="145" y="180" width="150" height="150" href="data:image/png;base64,${qrCodeBuffer.toString('base64')}"/>
          
          <text x="220" y="358" font-family="Helvetica, Arial, sans-serif" font-size="9" font-weight="700" fill="#004E98" text-anchor="middle">SCAN AT BEACH ENTRY COUNTER FOR Instant CHECK-IN</text>
          
          <!-- Dashed Divider -->
          <line x1="28" y1="375" x2="412" y2="375" stroke="#CBD5E1" stroke-dasharray="6,6" stroke-width="2"/>
          
          <!-- Booking Meta Details -->
          <text x="32" y="405" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="800" fill="#94A3B8" letter-spacing="1">TICKET CODE</text>
          <text x="408" y="405" font-family="Courier, monospace" font-size="14" font-weight="900" fill="#004E98" text-anchor="end">#${booking.id}</text>
          
          <text x="32" y="435" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="800" fill="#94A3B8" letter-spacing="1">GUEST NAME</text>
          <text x="408" y="435" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="800" fill="#091F44" text-anchor="end">${customerName}</text>

          <text x="32" y="465" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="800" fill="#94A3B8" letter-spacing="1">EVENT SCHEDULE</text>
          <text x="408" y="465" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="800" fill="#091F44" text-anchor="end">${booking.date} @ ${booking.time}</text>

          <text x="32" y="495" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="800" fill="#94A3B8" letter-spacing="1">PARTY SIZE</text>
          <text x="408" y="495" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="800" fill="#091F44" text-anchor="end">${booking.guests || 1} Person(s)</text>
          
          <text x="32" y="525" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="800" fill="#94A3B8" letter-spacing="1">ACTIVITIES</text>
          <text x="408" y="525" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="800" fill="#004E98" text-anchor="end">${formatAct.length > 32 ? formatAct.substring(0, 29) + '...' : formatAct}</text>
          
          <!-- Financial Breakdown Card Box -->
          <rect x="28" y="542" width="384" height="116" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
          
          <text x="44" y="564" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="800" fill="#64748B">Total Bill Amount</text>
          <text x="396" y="564" font-family="Courier, monospace" font-size="13" font-weight="900" fill="#091F44" text-anchor="end">₹${totalAmount}</text>
          
          <text x="44" y="586" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="800" fill="#64748B">Advance Collection</text>
          <text x="396" y="586" font-family="Courier, monospace" font-size="12" font-weight="800" fill="#004E98" text-anchor="end">₹${advancePaid}</text>
          
          <text x="44" y="608" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="800" fill="#64748B">Balance Collected</text>
          <text x="396" y="608" font-family="Courier, monospace" font-size="12" font-weight="800" fill="#16A34A" text-anchor="end">₹${balancePaid}</text>
          
          <line x1="44" y1="618" x2="396" y2="618" stroke="#CBD5E1" stroke-width="1"/>
          
          <text x="44" y="638" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="900" fill="#091F44">Remaining Balance Due</text>
          <text x="396" y="638" font-family="Courier, monospace" font-size="15" font-weight="900" fill="${remainingDue > 0 ? '#DC2626' : '#16A34A'}" text-anchor="end">₹${remainingDue}</text>
          
          <!-- Payment Status Bar Footer -->
          <rect x="28" y="668" width="384" height="38" rx="12" fill="${isPaid ? '#10B981' : '#F59E0B'}"/>
          <text x="220" y="692" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
             ${isPaid ? '✓ FULLY PAID • ADMISSION APPROVED' : `⏳ PARTIAL PAID • DUE REMAINING: ₹${remainingDue}`}
          </text>
        </svg>
      `;

      const buffer = await sharp(Buffer.from(svgTicket)).png().toBuffer();
      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to generate secure ticket image mapping' });
    }
  });

  app.post('/api/admin/verifyTicket', adminAuth, async (req, res) => {
    try {
      const { id } = req.body;
      const booking = await getBookingById(id);
      
      if (!booking) {
        return res.json({ valid: false, message: 'Ticket does not exist or invalid.' });
      }

      res.json({ valid: true, booking });
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify ticket.' });
    }
  });

  // Admin Dashboard API
  app.get('/api/admin/dashboard', adminAuth, async (req, res) => {
    try {
      const bookings = await getBookings();
      const totalBookings = bookings.length;
      const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0);
      const confirmedBookings = bookings.filter((b: any) => b.ticketStatus === 'Confirmed' || b.ticketStatus === 'Checked In').length;
      const pendingBookings = bookings.filter((b: any) => b.ticketStatus === 'Pending').length;

      res.json({
        success: true,
        stats: {
          totalBookings,
          totalRevenue,
          confirmedBookings,
          pendingBookings
        },
        recentBookings: bookings.slice(0, 10)
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve dashboard stats' });
    }
  });

  app.get(['/api/bookings', '/api/admin/bookings'], async (req, res) => {
    try {
      const activeSheetsUrl = await getActiveGoogleSheetsUrl();
      const cacheBustUrl = `${activeSheetsUrl}${activeSheetsUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      const response = await fetch(cacheBustUrl, { redirect: 'follow' });
      if (response.ok) {
        const text = await response.text();
        const trimmed = text.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            const json = JSON.parse(trimmed);
            return res.json(json);
          } catch (e) {
            console.warn('Google Apps script response was not valid JSON');
          }
        } else {
          console.warn('Google Apps script returned HTML instead of JSON');
        }
      }
      
      // Fallback if Apps Script returns non-ok status or non-JSON (e.g. HTML error)
      const all = await getBookings();
      res.json({ success: true, bookings: all });
    } catch (err) {
      console.warn('Google Sheet fetch error, using local database fallback');
      try {
        const all = await getBookings();
        res.json({ success: true, bookings: all });
      } catch (e) {
        res.status(500).json({ success: false, bookings: [], error: 'Failed to retrieve bookings' });
      }
    }
  });

  app.get('/api/bookings/export', adminAuth, async (req, res) => {
    try {
      const all = await getBookings();
      const bookings = all.filter((b: any) => b.source !== 'manual' && !b.id?.startsWith('JMB'));

      const formattedBookings = bookings.map((b: any) => {
        let formattedCreatedAt = b.createdAt;
        if (b.createdAt) {
          try {
            const d = new Date(b.createdAt);
            if (!isNaN(d.getTime())) {
              formattedCreatedAt = d.toISOString().split('T')[0];
            }
          } catch (e) {}
        }
        
        return {
          "Booking ID": b.id || '',
          "Booked At": formattedCreatedAt || '',
          "Customer Name": `${b.firstName || ''} ${b.lastName || ''}`.trim(),
          "Phone": b.phone || '',
          "Email": b.email || '',
          "Activity Date": b.date || '',
          "Activity Time": b.time || '',
          "Activities": Array.isArray(b.activities) ? b.activities.join(', ') : (b.activities || ''),
          "Guests": b.guests || '',
          "Total Amount": b.totalAmount || 0,
          "Advance Paid": b.advancePaid || 0,
          "Balance Paid": b.balancePaid || 0,
          "Remaining Due": b.remainingDue || 0,
          "Payment Status": b.paymentStatus || '',
          "Ticket Status": b.ticketStatus || '',
          "Special Request": b.specialRequest || ''
        };
      });

      const worksheet = xlsx.utils.json_to_sheet(formattedBookings);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Bookings');

      const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', 'attachment; filename="bookings.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(excelBuffer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to export bookings' });
    }
  });

  app.delete('/api/bookings/:id', adminAuth, async (req, res) => {
    try {
      await deleteBookingInDb(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete booking' });
    }
  });

  // ==========================================
  // MANUAL BOOKINGS (MANUALBOOK) ENDPOINTS
  // ==========================================

  // Create Manual Booking
  app.post('/api/manual-bookings', adminAuth, async (req, res) => {
    try {
      if (hasMultiplePackagesConflict(req.body.activities)) {
        return res.status(400).json({ error: 'Only one package can be selected per booking.' });
      }

      const bookingId = "JMB" + crypto.randomBytes(4).toString('hex').toUpperCase(); // JMB prefix for Joy Manual Booking
      
      const totalAmt = Number(req.body.totalAmount) || 0;
      const advPaid = Number(req.body.advancePaid) || 0;
      const balPaid = Number(req.body.balancePaid) || 0;
      const remDue = Math.max(0, totalAmt - advPaid - balPaid);

      let paymentStatus = 'Pending';
      if (remDue === 0 && totalAmt > 0) {
        paymentStatus = 'Completed';
      } else if (advPaid > 0 || balPaid > 0) {
        paymentStatus = 'Partial Paid';
      }

      const newBooking = { 
        id: bookingId, 
        firstName: req.body.firstName || '',
        lastName: req.body.lastName || '',
        phone: req.body.phone || '',
        email: req.body.email || '',
        date: req.body.date || '',
        time: req.body.time || '',
        guests: Number(req.body.guests) || 1,
        activities: req.body.activities || [],
        specialRequest: req.body.specialRequest || '',
        totalAmount: totalAmt,
        advancePaid: advPaid,
        balancePaid: balPaid,
        remainingDue: remDue,
        paymentStatus,
        ticketStatus: 'Pending',
        advancePaymentMode: req.body.advancePaymentMode || 'Cash',
        balancePaymentMode: req.body.balancePaymentMode || 'Cash',
        agentName: req.body.agentName || 'Counter Agent',
        notes: req.body.notes || '',
        createdAt: new Date().toISOString()
      };
      
      await saveManualBooking(newBooking);
      sendToGoogleSheets(newBooking).catch(err => console.error(`Async Google Sheets sync error for ${newBooking.id}:`, err));
      
      res.json({ success: true, booking: newBooking });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save manual booking' });
    }
  });

  // Get All Coupons
  app.get(['/api/coupons', '/api/admin/coupons'], adminAuth, async (req, res) => {
    try {
      if (pool) {
        try {
          const { rows } = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
          const dbCoupons = rows.map((r: any) => ({
            id: r.id,
            code: r.code,
            discountType: r.discount_type,
            discountValue: Number(r.discount_value),
            minBill: Number(r.min_bill),
            active: r.active,
            usageCount: Number(r.usage_count),
            createdAt: r.created_at
          }));
          return res.json(dbCoupons);
        } catch (e) {
          // fallback
        }
      }
      const coupons = safeReadJson(COUPONS_FILE, []);
      res.json(coupons);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve coupons' });
    }
  });

  // Create Coupon
  app.post('/api/coupons', adminAuth, async (req, res) => {
    try {
      const coupons = safeReadJson(COUPONS_FILE, []);
      const newCoupon = {
        id: `cp_${Date.now()}`,
        code: (req.body.code || '').toUpperCase().trim(),
        discountType: req.body.discountType || 'percentage',
        discountValue: Number(req.body.discountValue) || 0,
        minBill: Number(req.body.minBill) || 0,
        active: req.body.active !== undefined ? req.body.active : true,
        usageCount: 0,
        createdAt: new Date().toISOString()
      };
      coupons.unshift(newCoupon);
      safeWriteJson(COUPONS_FILE, coupons);
      res.json({ success: true, coupon: newCoupon });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create coupon' });
    }
  });

  // Update Coupon
  app.put('/api/coupons/:id', adminAuth, async (req, res) => {
    try {
      const coupons = safeReadJson(COUPONS_FILE, []);
      const idx = coupons.findIndex((c: any) => c.id === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Coupon not found' });
      }
      coupons[idx] = { ...coupons[idx], ...req.body };
      safeWriteJson(COUPONS_FILE, coupons);
      res.json({ success: true, coupon: coupons[idx] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update coupon' });
    }
  });

  // Delete Coupon
  app.delete('/api/coupons/:id', adminAuth, async (req, res) => {
    try {
      let coupons = safeReadJson(COUPONS_FILE, []);
      coupons = coupons.filter((c: any) => c.id !== req.params.id);
      safeWriteJson(COUPONS_FILE, coupons);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete coupon' });
    }
  });

  // Get All Manual Bookings
  app.get('/api/manual-bookings', adminAuth, async (req, res) => {
    try {
      const bList = await getManualBookings();
      const manualOnly = bList.filter((b: any) => b.source === 'manual' || b.id?.startsWith('JMB'));
      res.json(manualOnly);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve manual bookings' });
    }
  });

  // Edit Manual Booking
  app.put('/api/manual-bookings/:id', adminAuth, async (req, res) => {
    try {
      if (req.body.activities && hasMultiplePackagesConflict(req.body.activities)) {
        return res.status(400).json({ error: 'Only one package can be selected per booking.' });
      }

      const b = await getManualBookingById(req.params.id);
      if (!b) {
        return res.status(404).json({ error: 'Manual booking not found' });
      }

      const updatedBooking = { ...b, ...req.body };
      
      const advance = Number(updatedBooking.advancePaid) || 0;
      const balance = Number(updatedBooking.balancePaid) || 0;
      const total = Number(updatedBooking.totalAmount) || 0;
      
      updatedBooking.remainingDue = Math.max(0, total - advance - balance);
      
      if (updatedBooking.remainingDue === 0 && total > 0) {
        updatedBooking.paymentStatus = "Completed";
      } else if (advance > 0 || balance > 0) {
        updatedBooking.paymentStatus = "Partial Paid";
      } else {
        updatedBooking.paymentStatus = "Pending";
      }
      
      await updateManualBookingInDb(req.params.id, updatedBooking);
      sendToGoogleSheets(updatedBooking).catch(err => console.error(`Async Google Sheets sync error for ${updatedBooking.id}:`, err));

      res.json({ message: 'Manual booking updated', booking: updatedBooking });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update manual booking' });
    }
  });

  // Delete Manual Booking
  app.delete('/api/manual-bookings/:id', adminAuth, async (req, res) => {
    try {
      await deleteManualBookingInDb(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete manual booking' });
    }
  });

  // Get Manual Ticket details
  app.get('/api/manual-bookings/ticket/:id', async (req, res) => {
    try {
      const booking = await getManualBookingById(req.params.id);
      if (booking) {
        res.json(booking);
      } else {
        res.status(404).json({ error: 'Manual ticket not found' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Error fetching manual ticket' });
    }
  });

  // Export Manual Ticket custom stylized image using Sharp
  app.get('/api/manual-bookings/ticket/export/:id', async (req, res) => {
    try {
      const booking = await getManualBookingById(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: 'Manual booking ticket not found' });
      }

      const qrCodeBuffer = await QRCode.toBuffer(booking.id, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 140,
        color: { dark: '#091F44', light: '#FFFFFF' }
      });

      const logoBase64 = await getLogoBase64();

      const customerName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim();
      const formatAct = Array.isArray(booking.activities) ? booking.activities.join(', ') : String(booking.activities || '');
      const totalAmount = Number(booking.totalAmount) || 0;
      const advancePaid = Number(booking.advancePaid) || 0;
      const balancePaid = Number(booking.balancePaid) || 0;
      const remainingDue = booking.remainingDue !== undefined ? Number(booking.remainingDue) : Math.max(0, totalAmount - advancePaid - balancePaid);
      const isPaid = remainingDue === 0;

      // Create an ultra-premium, minimalist vector SVG for manual counter tickets with website brand colors
      const svgTicket = `
        <svg width="440" height="740" viewBox="0 0 440 740" xmlns="http://www.w3.org/2000/svg">
          <!-- Main Outer Card Frame -->
          <rect width="440" height="740" rx="28" fill="#FFFFFF" stroke="#004E98" stroke-width="4"/>
          
          <!-- Premium Deep Navy Header Banner -->
          <path d="M 0 28 A 28 28 0 0 1 28 0 L 412 0 A 28 28 0 0 1 440 28 L 440 125 L 0 125 Z" fill="#091F44"/>
          <!-- Sky Blue Accent Line -->
          <rect x="0" y="123" width="440" height="4" fill="#00A6FB"/>
          
          <!-- Company Logo Frame & Image -->
          <rect x="190" y="12" width="60" height="60" rx="16" fill="#FFFFFF" fill-opacity="0.15" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="1.5"/>
          ${logoBase64 ? `<image x="195" y="17" width="50" height="50" href="data:image/png;base64,${logoBase64}"/>` : ''}

          <text x="220" y="90" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">JOY WATER SPORTS</text>
          <text x="220" y="110" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="800" fill="#00A6FB" text-anchor="middle" letter-spacing="1.5">COUNTER WALK-IN • DESK ENTRY VOUCHER</text>
          
          <!-- Ticket Type Badge -->
          <rect x="135" y="132" width="170" height="26" rx="13" fill="#F0F9FF" stroke="#00A6FB" stroke-width="1.2"/>
          <text x="220" y="149" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="900" fill="#004E98" text-anchor="middle" letter-spacing="1">WALK-IN ADMISSION PASS</text>
          
          <!-- QR Code Container -->
          <rect x="135" y="170" width="170" height="170" rx="20" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
          <image x="145" y="180" width="150" height="150" href="data:image/png;base64,${qrCodeBuffer.toString('base64')}"/>
          
          <text x="220" y="358" font-family="Helvetica, Arial, sans-serif" font-size="9" font-weight="700" fill="#004E98" text-anchor="middle">SCAN AT BEACH ENTRY COUNTER FOR Instant CHECK-IN</text>
          
          <!-- Dashed Divider -->
          <line x1="28" y1="375" x2="412" y2="375" stroke="#CBD5E1" stroke-dasharray="6,6" stroke-width="2"/>
          
          <!-- Booking Meta Details -->
          <text x="32" y="405" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="800" fill="#94A3B8" letter-spacing="1">TICKET CODE</text>
          <text x="408" y="405" font-family="Courier, monospace" font-size="14" font-weight="900" fill="#004E98" text-anchor="end">#${booking.id}</text>
          
          <text x="32" y="435" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="800" fill="#94A3B8" letter-spacing="1">GUEST NAME</text>
          <text x="408" y="435" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="800" fill="#091F44" text-anchor="end">${customerName}</text>

          <text x="32" y="465" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="800" fill="#94A3B8" letter-spacing="1">PHONE</text>
          <text x="408" y="465" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="800" fill="#091F44" text-anchor="end">${booking.phone || 'N/A'}</text>
          
          <text x="32" y="495" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="800" fill="#94A3B8" letter-spacing="1">EVENT SCHEDULE</text>
          <text x="408" y="495" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="800" fill="#091F44" text-anchor="end">${booking.date} @ ${booking.time}</text>
          
          <text x="32" y="525" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="800" fill="#94A3B8" letter-spacing="1">ACTIVITIES</text>
          <text x="408" y="525" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="800" fill="#004E98" text-anchor="end">${formatAct.length > 32 ? formatAct.substring(0, 29) + '...' : formatAct}</text>

          <text x="32" y="555" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="800" fill="#94A3B8" letter-spacing="1">DESK AGENT</text>
          <text x="408" y="555" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="800" fill="#475569" text-anchor="end">${booking.agentName || 'Counter Desk'}</text>
          
          <!-- Financial Breakdown Card Box -->
          <rect x="28" y="572" width="384" height="116" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
          
          <text x="44" y="594" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="800" fill="#64748B">Total Bill Amount</text>
          <text x="396" y="594" font-family="Courier, monospace" font-size="13" font-weight="900" fill="#091F44" text-anchor="end">₹${totalAmount}</text>
          
          <text x="44" y="616" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="800" fill="#64748B">Advance Collection</text>
          <text x="396" y="616" font-family="Courier, monospace" font-size="12" font-weight="800" fill="#004E98" text-anchor="end">₹${advancePaid}</text>
          
          <text x="44" y="638" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="800" fill="#64748B">Balance Collected</text>
          <text x="396" y="638" font-family="Courier, monospace" font-size="12" font-weight="800" fill="#16A34A" text-anchor="end">₹${balancePaid}</text>
          
          <line x1="44" y1="648" x2="396" y2="648" stroke="#CBD5E1" stroke-width="1"/>
          
          <text x="44" y="668" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="900" fill="#091F44">Remaining Balance Due</text>
          <text x="396" y="668" font-family="Courier, monospace" font-size="15" font-weight="900" fill="${remainingDue > 0 ? '#DC2626' : '#16A34A'}" text-anchor="end">₹${remainingDue}</text>
          
          <!-- Payment Status Bar Footer -->
          <rect x="28" y="698" width="384" height="34" rx="12" fill="${isPaid ? '#10B981' : '#F59E0B'}"/>
          <text x="220" y="720" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
             ${isPaid ? '✓ FULLY PAID • WALK-IN APPROVED' : `⏳ COUNTER DUE REMAINING: ₹${remainingDue}`}
          </text>
        </svg>
      `;

      const buffer = await sharp(Buffer.from(svgTicket)).png().toBuffer();
      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to generate manual ticket voucher' });
    }
  });

  // Verify and Check In Manual Ticket via Scanner
  app.post('/api/admin/verifyManualTicket', adminAuth, async (req, res) => {
    try {
      const { id } = req.body;
      const booking = await getManualBookingById(id);
      
      if (!booking) {
        return res.json({ valid: false, message: 'Manual ticket does not exist or invalid.' });
      }

      res.json({ valid: true, booking });
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify manual ticket.' });
    }
  });

  // Export Manual Bookings Excel for administrative audit (WITHOUT Google Sheet sync!)
  app.get('/api/manual-bookings/export', adminAuth, async (req, res) => {
    try {
      const bookings = await getManualBookings();

      const formattedBookings = bookings.map((b: any) => {
        let formattedCreatedAt = b.createdAt;
        if (b.createdAt) {
          try {
            const d = new Date(b.createdAt);
            if (!isNaN(d.getTime())) {
              formattedCreatedAt = d.toISOString().split('T')[0];
            }
          } catch (e) {}
        }
        
        return {
          "Ticket ID (Manual)": b.id || '',
          "Created At": formattedCreatedAt || '',
          "Client Name": `${b.firstName || ''} ${b.lastName || ''}`.trim(),
          "Phone": b.phone || '',
          "Email": b.email || '',
          "Date": b.date || '',
          "Time": b.time || '',
          "Activities Ordered": Array.isArray(b.activities) ? b.activities.join(', ') : (b.activities || ''),
          "Guests": b.guests || 1,
          "Handled By Agent": b.agentName || '',
          "Total Amount": b.totalAmount || 0,
          "Advance Paid": b.advancePaid || 0,
          "Balance Paid": b.balancePaid || 0,
          "Remaining Due": b.remainingDue || 0,
          "Payment Status": b.paymentStatus || '',
          "Ticket Status": b.ticketStatus || '',
          "Staff / Agent Notes": b.notes || ''
        };
      });

      const worksheet = xlsx.utils.json_to_sheet(formattedBookings);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Manual Bookings');

      const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', 'attachment; filename="manual_bookings_ledgers.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(excelBuffer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to export manual bookings' });
    }
  });

  // Public API: Get Google Form Embed URL for booking section
  app.get('/api/config/google-form', async (req, res) => {
    try {
      const customUrl = await getAdminConfig('google_form_url');
      const defaultUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeyzQnJPV6b1g3OZ41RvtEkx-olXP-ZsRP54WkppoteANxZ6w/viewform?embedded=true';
      res.json({ url: customUrl || defaultUrl });
    } catch (e) {
      res.json({ url: 'https://docs.google.com/forms/d/e/1FAIpQLSeyzQnJPV6b1g3OZ41RvtEkx-olXP-ZsRP54WkppoteANxZ6w/viewform?embedded=true' });
    }
  });

  // Admin API: Get active Google Sheets Webhook Configuration
  app.get('/api/admin/sheets-config', adminAuth, async (req, res) => {
    try {
      const customUrl = await getAdminConfig('google_sheets_url');
      const activeUrl = customUrl || process.env.GOOGLE_SHEETS_URL || '';
      res.json({
        url: activeUrl,
        isCustom: !!customUrl,
        isConfigured: !!activeUrl,
        targetEmail: 'joywatersportsadmin@gmail.com'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sheets configuration' });
    }
  });

  // Admin API: Update Google Sheets Webhook URL (Supports optional admin password re-auth)
  app.post('/api/admin/sheets-config', adminAuth, async (req, res) => {
    try {
      const { url, password } = req.body;
      
      if (password) {
        const adminUser = await getAdminUser('admin');
        if (adminUser && adminUser.password_hash) {
          const valid = await bcrypt.compare(password, adminUser.password_hash);
          if (!valid) {
            return res.status(401).json({ error: 'Re-authentication failed: Invalid admin password.' });
          }
        }
      }

      const cleanUrl = (url || '').trim();
      await setAdminConfig('google_sheets_url', cleanUrl);
      console.log(`✅ [Google Sheets Config] Updated webhook URL to: ${cleanUrl || '(Default/Empty)'}`);
      
      if (cleanUrl) {
        retryFailedSheetSyncs().catch(err => console.error("Auto-retry after URL update failed:", err));
      }

      res.json({ success: true, url: cleanUrl });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update sheets configuration' });
    }
  });

  // Admin API: Get active Google Form Embed Configuration
  app.get('/api/admin/google-form-config', adminAuth, async (req, res) => {
    try {
      const customUrl = await getAdminConfig('google_form_url');
      const defaultUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeyzQnJPV6b1g3OZ41RvtEkx-olXP-ZsRP54WkppoteANxZ6w/viewform?embedded=true';
      res.json({
        url: customUrl || defaultUrl,
        isCustom: !!customUrl
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch google form configuration' });
    }
  });

  // Admin API: Update Google Form Embed URL
  app.post('/api/admin/google-form-config', adminAuth, async (req, res) => {
    try {
      const { url } = req.body;
      const cleanUrl = (url || '').trim();
      await setAdminConfig('google_form_url', cleanUrl);
      console.log(`✅ [Google Form Config] Updated embed URL to: ${cleanUrl || '(Default/Empty)'}`);
      res.json({ success: true, url: cleanUrl });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update google form configuration' });
    }
  });

  // Admin API: Trigger Test Ping to Google Sheets
  app.post('/api/admin/test-sheets', adminAuth, async (req, res) => {
    try {
      const targetUrl = await getActiveGoogleSheetsUrl();
      if (!targetUrl) {
        return res.status(400).json({ success: false, message: 'Google Sheets Webhook URL is not configured.' });
      }

      const testPayload = {
        bookingId: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
        bookedAt: new Date().toLocaleString('en-GB'),
        customerName: 'Joy Water Sports Test Admin',
        phone: '+919876543210',
        email: 'joywatersportsadmin@gmail.com',
        date: new Date().toISOString().split('T')[0],
        time: '10:00 AM',
        activities: 'Jet Ski, Parasailing (Test)',
        guests: 2,
        totalAmount: 1500,
        advancePaid: 500,
        balancePaid: 0,
        remainingDue: 1000,
        paymentStatus: 'Test',
        ticketStatus: 'Confirmed',
        paymentMode: 'Online Test',
        specialRequest: 'Google Sheets test connection from Admin Panel',
        createdAt: new Date().toISOString()
      };

      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
        redirect: 'follow'
      });

      const respText = await resp.text();

      if (respText.includes('Script function not found: doPost')) {
        return res.json({
          success: false,
          status: resp.status,
          message: `Google Apps Script error: 'Script function not found: doPost'. Please replace the code in your Google Apps Script editor with the provided snippet, click Save (💾), and create a New Deployment.`
        });
      }

      if (respText.includes('Authorization is required') || respText.includes('Need permission')) {
        return res.json({
          success: false,
          status: resp.status,
          message: `Google Apps Script permissions error. Make sure to set 'Who has access' to 'Anyone' when deploying the Web App.`
        });
      }

      const isSuccess = resp.ok && !respText.toLowerCase().includes('error');

      res.json({
        success: isSuccess,
        status: resp.status,
        statusText: resp.statusText,
        message: isSuccess ? 'Test row successfully sent to your Google Sheet!' : 'Received non-OK response from sheet webhook.'
      });
    } catch (error: any) {
      console.error('[ADMIN SHEETS TEST ERROR]', error);
      res.status(500).json({ success: false, message: 'Failed to reach Google Sheets Webhook' });
    }
  });

  // Admin API: Clear all test data and history (Bookings, Waivers, Sync logs, Users)
  app.post('/api/admin/clear-all-data', adminAuth, async (req, res) => {
    try {
      const jsonFilesToEmpty = [
        BOOKINGS_FILE,
        MANUAL_BOOKINGS_FILE,
        path.join(DATA_DIR, 'pending_bookings.json'),
        WAIVER_AGREEMENTS_FILE,
        USERS_FILE
      ];

      for (const filePath of jsonFilesToEmpty) {
        try {
          safeWriteJson(filePath, []);
        } catch (e) {
          console.error(`Error emptying ${filePath}:`, e);
        }
      }

      if (pool) {
        await pool.query('TRUNCATE TABLE bookings CASCADE');
        await pool.query('TRUNCATE TABLE waiver_agreements CASCADE');
        await pool.query('TRUNCATE TABLE sheet_sync_queue CASCADE');
        await pool.query('TRUNCATE TABLE sheet_sync_logs CASCADE');
        await pool.query('TRUNCATE TABLE users CASCADE');
      }

      console.log("✅ Admin cleared all test data and history from local storage and database.");
      res.json({ success: true, message: 'All test data and history cleared successfully.' });
    } catch (err: any) {
      console.error("Failed to clear data:", err);
      res.status(500).json({ error: 'Failed to clear test data and history.' });
    }
  });

  // Admin API: Push all existing bookings to Google Sheets
  app.post('/api/admin/sync-all-sheets', adminAuth, async (req, res) => {
    try {
      const targetUrl = await getActiveGoogleSheetsUrl();
      if (!targetUrl) {
        return res.status(400).json({ success: false, message: 'Google Sheets Webhook URL is not configured.' });
      }

      const combined = await getBookings();

      if (combined.length === 0) {
        return res.json({ success: true, count: 0, message: 'No bookings found in database to sync.' });
      }

      let successCount = 0;
      let failCount = 0;
      for (const b of combined) {
        try {
          const ok = await sendToGoogleSheets(b);
          if (ok) successCount++;
          else failCount++;
        } catch (e) {
          failCount++;
          console.error(`Failed to sync booking ${b.id}:`, e);
        }
      }

      res.json({
        success: true,
        count: successCount,
        failed: failCount,
        total: combined.length,
        message: `Processed ${combined.length} bookings (${successCount} synced to sheet, ${failCount} queued for retry).`
      });
    } catch (error: any) {
      console.error('[ADMIN SYNC ALL SHEETS ERROR]', error);
      res.status(500).json({ success: false, message: 'Failed to sync existing bookings' });
    }
  });

  // Admin API: Get Google Sheets Sync Health and Queue Status
  app.get('/api/admin/sheets-sync-status', adminAuth, async (req, res) => {
    try {
      const lastSuccessfulSync = await getAdminConfig('last_successful_sync_time');
      let pendingCount = 0;
      let failedCount = 0;
      let totalQueue = 0;
      let recentLogs: any[] = [];

      if (pool) {
        try {
          const queueRes = await pool.query(`
            SELECT 
              COUNT(*) FILTER (WHERE synced = FALSE) as pending_count,
              COUNT(*) FILTER (WHERE synced = FALSE AND attempt_count > 0) as failed_count,
              COUNT(*) as total_queue
            FROM sheet_sync_queue
          `);
          pendingCount = parseInt(queueRes.rows[0]?.pending_count || '0', 10);
          failedCount = parseInt(queueRes.rows[0]?.failed_count || '0', 10);
          totalQueue = parseInt(queueRes.rows[0]?.total_queue || '0', 10);

          const logsRes = await pool.query(`
            SELECT booking_id, status, error_message, timestamp 
            FROM sheet_sync_logs 
            ORDER BY timestamp DESC 
            LIMIT 10
          `);
          recentLogs = logsRes.rows.map(r => ({
            bookingId: r.booking_id,
            status: r.status,
            errorMessage: r.error_message,
            timestamp: r.timestamp
          }));
        } catch (e) {
          console.error("Error fetching sheets sync status from DB:", e);
        }
      } else {
        const queueFile = path.join(DATA_DIR, 'sheet_sync_queue.json');
        const queue = safeReadJson(queueFile, []);
        pendingCount = queue.filter((q: any) => !q.synced).length;
        failedCount = queue.filter((q: any) => !q.synced && (q.attemptCount || 0) > 0).length;
        totalQueue = queue.length;

        const logsFile = path.join(DATA_DIR, 'sheet_sync_logs.json');
        recentLogs = safeReadJson(logsFile, []).slice(0, 10);
      }

      res.json({
        lastSuccessfulSync,
        pendingCount,
        failedCount,
        totalQueue,
        recentLogs
      });
    } catch (err: any) {
      console.error('[ADMIN SHEETS SYNC STATUS ERROR]', err);
      res.status(500).json({ error: 'Failed to fetch sheets sync status' });
    }
  });

  // Admin API: Manually trigger retry job for failed Google Sheets syncs
  app.post('/api/admin/retry-sheets-sync', adminAuth, async (req, res) => {
    try {
      const result = await retryFailedSheetSyncs();
      res.json({ success: true, result });
    } catch (err: any) {
      console.error('[ADMIN RETRY SHEETS SYNC ERROR]', err);
      res.status(500).json({ error: 'Failed to retry sheets sync' });
    }
  });

  // Admin API: Get full Google Sheets sync attempt logs
  app.get('/api/admin/sheets-sync-logs', adminAuth, async (req, res) => {
    try {
      if (pool) {
        const logsRes = await pool.query(`
          SELECT booking_id, status, error_message, timestamp 
          FROM sheet_sync_logs 
          ORDER BY timestamp DESC 
          LIMIT 50
        `);
        return res.json(logsRes.rows.map(r => ({
          bookingId: r.booking_id,
          status: r.status,
          errorMessage: r.error_message,
          timestamp: r.timestamp
        })));
      } else {
        const logsFile = path.join(DATA_DIR, 'sheet_sync_logs.json');
        return res.json(safeReadJson(logsFile, []).slice(0, 50));
      }
    } catch (err: any) {
      console.error('[ADMIN SHEETS SYNC LOGS ERROR]', err);
      res.status(500).json({ error: 'Failed to fetch sheets sync logs' });
    }
  });

  // Admin API: Reconcile and flush offline queued bookings to Neon PostgreSQL
  app.post('/api/admin/reconcile-pending', adminAuth, async (req, res) => {
    try {
      const result = await reconcilePendingBookings();
      res.json({ success: true, result });
    } catch (err: any) {
      console.error('[ADMIN RECONCILE PENDING ERROR]', err);
      res.status(500).json({ error: 'Failed to reconcile pending bookings' });
    }
  });

  // Admin API: Get status of offline queued bookings
  app.get('/api/admin/pending-status', adminAuth, async (req, res) => {
    try {
      const pendingFile = path.join(DATA_DIR, 'pending_bookings.json');
      const pendingList = safeReadJson(pendingFile, []);
      const unsynced = pendingList.filter((p: any) => !p.synced);
      res.json({
        pendingCount: unsynced.length,
        totalQueue: pendingList.length
      });
    } catch (err: any) {
      console.error('[ADMIN PENDING STATUS ERROR]', err);
      res.status(500).json({ error: 'Failed to fetch pending queue status' });
    }
  });

  // Neon Auth API: Get / Proxy JWKS configuration
  app.get('/api/neon/jwks', async (req, res) => {
    try {
      const jwksUrl = process.env.NEON_AUTH_JWKS || 'https://ep-summer-smoke-ax9zx3tb.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json';
      const response = await fetch(jwksUrl);
      if (response.ok) {
        const data = await response.json();
        return res.json({ success: true, jwksUrl, jwks: data });
      }
      res.json({ success: false, jwksUrl, error: `HTTP ${response.status}` });
    } catch (err: any) {
      console.error('[NEON JWKS ERROR]', err);
      res.status(500).json({ success: false, error: 'Failed to fetch authorization configuration.' });
    }
  });

  // Neon API: Test storing and reading booking data
  app.all('/api/neon/test-store', async (req, res) => {
    try {
      const testId = `TEST-${Date.now().toString().slice(-6)}`;
      const sampleBooking = {
        id: testId,
        firstName: 'Test',
        lastName: 'User',
        phone: '9876543210',
        email: 'test@example.com',
        date: new Date().toISOString().split('T')[0],
        time: '10:00 AM',
        guests: 2,
        activities: [{ name: 'Scuba Diving', price: 1500, count: 2 }],
        specialRequest: 'Neon database test store',
        totalAmount: 3000,
        advancePaid: 1000,
        balancePaid: 0,
        remainingDue: 2000,
        paymentStatus: 'Partial',
        ticketStatus: 'Confirmed',
        advancePaymentMode: 'UPI',
        balancePaymentMode: 'Cash',
        source: 'manual',
        createdBy: 'System Test',
        notes: 'Testing data storage persistence',
        createdAt: new Date().toISOString()
      };

      await saveBooking(sampleBooking);
      const fetched = await getBookingById(testId);

      res.json({
        success: true,
        message: 'Data successfully stored and verified in storage engine!',
        savedBooking: fetched,
        dbStatus: pool ? 'Connected (PostgreSQL / Neon)' : 'Local Disk Backup Active'
      });
    } catch (err: any) {
      console.error('[NEON TEST STORE ERROR]', err);
      res.status(500).json({ success: false, error: 'Failed to store test record in database.' });
    }
  });

  // Explicit API 404 JSON fallback handler for any unhandled /api/* requests
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'Requested API endpoint not found.' });
  });

  // Global Express Error Handling Middleware (Catches all unhandled middleware & route errors)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Log complete error info on server side for debugging (never sent to client)
    console.error('[SERVER UNHANDLED EXCEPTION]', err);

    if (res.headersSent) {
      return next(err);
    }

    const statusCode = typeof err?.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600
      ? err.statusCode
      : (typeof err?.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500);

    let clientMessage = "Something went wrong. Please try again later.";
    if (statusCode === 400) clientMessage = "Invalid request payload or parameters.";
    else if (statusCode === 401) clientMessage = "Authentication required. Please log in.";
    else if (statusCode === 403) clientMessage = "Access denied. You do not have permission.";
    else if (statusCode === 404) clientMessage = "The requested resource was not found.";
    else if (statusCode === 429) clientMessage = "Too many requests. Please slow down and try again.";
    else if (statusCode === 502 || statusCode === 503) clientMessage = "Service temporarily unavailable. Please try again later.";

    res.status(statusCode).json({
      success: false,
      error: clientMessage
    });
  });

async function startServer() {
  // Initialize database connection asynchronously in background so Express routes attach synchronously
  initDatabase().catch((err) => {
    console.error("Database connection failed during initialization:", err);
  });

  const PORT = 3000;

  // On non-Vercel environment (local dev or container), setup Vite/Static fallback & start listener
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', async () => {
      const sheetsUrl = await getActiveGoogleSheetsUrl();
      const declarationSheetsUrl = await getActiveDeclarationSheetsUrl();
      const userLoginSheetsUrl = await getActiveUserLoginSheetsUrl();
      console.log(`\n========================================`);
      console.log(`🚀 Full-stack Server running on http://localhost:${PORT}`);
      console.log(`📊 PostgreSQL DB Connection: ${pool ? 'CONNECTED ✅' : 'NOT CONNECTED (Using Local JSON Backup) ⚠️'}`);
      console.log(`📊 Bookings Google Sheets Webhook (Sheet1): ${sheetsUrl ? 'ACTIVE ✅' : 'NOT CONFIGURED ⚠️'}`);
      console.log(`📝 Declaration Google Sheets Webhook (Declarations): ${declarationSheetsUrl ? 'ACTIVE ✅' : 'NOT CONFIGURED ⚠️'}`);
      console.log(`👤 User Login Data Sheets Webhook: ${userLoginSheetsUrl ? 'ACTIVE ✅' : 'NOT CONFIGURED ⚠️'}`);
      console.log(`🌐 Frontend Origin: CORS enabled for all origins`);
      console.log(`🔑 Admin Authentication: Using custom JWT & Password`);
      console.log(`========================================\n`);
    });

    // Schedule background retry jobs
    setInterval(() => {
      if (pool) {
        reconcilePendingBookings().catch(err => console.error("Periodic Neon DB sync error:", err));
      }
    }, 30 * 1000);

    setInterval(() => {
      retryFailedSheetSyncs().catch(err => console.error("Periodic sheet sync retry error:", err));
    }, 5 * 60 * 1000);
  }

  // Trigger immediate seed and retry on server startup
  setTimeout(async () => {
    try {
      await setAdminConfig('google_sheets_url', DEFAULT_GOOGLE_SHEETS_URL);
      await setAdminConfig('declaration_sheets_url', DEFAULT_DECLARATION_SHEETS_URL);
      await setAdminConfig('user_login_sheets_url', DEFAULT_USER_LOGIN_SHEETS_URL);
      console.log('✅ Google Sheets Webhook URLs initialized and active.');
    } catch (e) {}
    retryFailedSheetSyncs().catch(err => console.error("Initial boot sheet sync retry error:", err));
  }, 2000);
}

startServer();

