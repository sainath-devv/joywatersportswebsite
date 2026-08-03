import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, ArrowRight, Eye, EyeOff, Phone, X, Check, ShieldCheck, Globe } from 'lucide-react';
import { setAccessToken } from '../../lib/auth';
import { useAuth } from '../../context/AuthContext';
import { formatSafeErrorMessage } from '../../lib/errorHandler';
import { 
  COUNTRY_LIST, 
  evaluatePasswordStrength, 
  validateAndFormatPhone,
  CountryInfo 
} from '../../lib/validation';
import { CountryCode } from 'libphonenumber-js';

interface UserLoginProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export default function UserLogin({ onSuccess, onCancel, isModal = false }: UserLoginProps = {}) {
  const { login: loginContext } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState<CountryCode>('IN');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordEvaluation = evaluatePasswordStrength(password);

  const validateForm = (): string | null => {
    if (!isLogin) {
      if (!firstName.trim()) return 'First name is required.';
      if (!lastName.trim()) return 'Last name is required.';
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
      
      // Password Strength Verification
      if (passwordEvaluation.score < 3) {
        return 'Password is too weak. Please complete all password security rules.';
      }

      // Phone Validation per country
      if (phone.trim()) {
        const phoneResult = validateAndFormatPhone(phone, countryCode);
        if (!phoneResult.isValid) {
          return phoneResult.error || `Invalid phone number for ${countryCode}.`;
        }
      }
    } else {
      if (!email.trim()) return 'Email or Mobile number is required.';
      if (!password) return 'Password is required.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      
      const body = isLogin 
        ? JSON.stringify({ email: email.trim(), password })
        : JSON.stringify({ 
            email: email.trim(), 
            password, 
            firstName: firstName.trim(), 
            lastName: lastName.trim(), 
            countryCode,
            phone: phone.trim() 
          });
      
      const xsrfMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (xsrfMatch) {
        headers['X-XSRF-TOKEN'] = xsrfMatch[1];
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: body,
      });

      let data: any = {};
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        if (!res.ok) {
          throw new Error('Service request failed. Please try again later.');
        }
        throw new Error('Something went wrong. Please try again later.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your details and try again.');
      }

      if (data.token) {
        setAccessToken(data.token);
      }

      const userObj = data.user || {};
      const userEmailVal = userObj.email || (email.includes('@') ? email : '');
      const userPhoneVal = userObj.phone || phone || (!email.includes('@') ? email : '');
      const userFirstNameVal = userObj.firstName || firstName || '';
      const userLastNameVal = userObj.lastName || lastName || '';
      
      const computedName = `${userFirstNameVal} ${userLastNameVal}`.trim() 
        || userObj.name 
        || (userEmailVal ? userEmailVal.split('@')[0] : '') 
        || userPhoneVal 
        || 'User';

      // Synchronize with global AuthContext
      loginContext({
        id: userObj.id,
        email: userEmailVal,
        phone: userPhoneVal,
        firstName: userFirstNameVal,
        lastName: userLastNameVal,
        name: computedName
      }, data.token);

      if (isLogin) {
        setSuccess('Login successful! Welcome back.');
      } else {
        setSuccess('Account created successfully! Welcome to Joy Water Sports.');
      }

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        if (!onSuccess) {
          navigate('/');
        }
      }, 1200);
    } catch (err: any) {
      setError(formatSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const formElement = (
    <div className={`w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-fade-in transition-all duration-300 ${
      isLogin ? 'max-w-md' : 'max-w-xl'
    }`}>
      <div className={`relative bg-gradient-to-r from-deep-blue to-ocean-blue px-6 sm:px-8 text-center transition-all duration-300 ${
        isLogin ? 'pt-8 pb-12 sm:pt-10 sm:pb-14' : 'pt-4 pb-10 sm:pt-5 sm:pb-11'
      }`}>
        {(isModal || onCancel) && (
          <button
            type="button"
            onClick={onCancel || (() => navigate('/'))}
            className="absolute top-4 right-4 z-50 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-[0]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-6 sm:h-8 object-cover">
            <path fill="#ffffff" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,176C672,171,768,181,864,197.3C960,213,1056,235,1152,234.7C1248,235,1344,213,1392,202.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
        <div className="relative z-10">
          <div className={`bg-white rounded-2xl flex items-center justify-center p-2 mx-auto shadow-md transition-all duration-300 ${
            isLogin ? 'w-16 h-16 sm:w-20 sm:h-20 mb-2 sm:mb-3' : 'w-11 h-11 sm:w-14 sm:h-14 mb-1 sm:mb-2'
          }`}>
            <img 
              src="https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx" 
              referrerPolicy="no-referrer"
              alt="Joy Water Sports Logo" 
              className="h-full w-full object-contain" 
            />
          </div>
          <h2 className={`font-display font-semibold text-white leading-tight mb-0.5 transition-all duration-300 ${
            isLogin ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-2xl'
          }`}>
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p className="text-white/80 text-[10px] sm:text-xs">
            {isLogin ? 'Login to manage your bookings' : 'Sign up to start your adventure'}
          </p>
        </div>
      </div>

      <div className={`px-5 sm:px-8 bg-white transition-all duration-300 ${isLogin ? 'py-6 sm:py-10' : 'py-3 sm:py-6'}`}>
        {error && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs sm:text-sm font-medium flex items-center gap-2 animate-fade-in">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 p-2.5 bg-green-50 border border-green-200 rounded-xl text-green-600 text-xs sm:text-sm font-medium flex items-center gap-2 animate-fade-in">
            <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {!isLogin ? (
            <div className="space-y-3 sm:space-y-4">
              {/* 2 column grid for fields to reduce vertical height */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-blue/70 mb-0.5 sm:mb-1 ml-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-ocean-blue focus:ring-4 focus:ring-ocean-blue/10 transition-all text-xs sm:text-sm"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-blue/70 mb-0.5 sm:mb-1 ml-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-ocean-blue focus:ring-4 focus:ring-ocean-blue/10 transition-all text-xs sm:text-sm"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-blue/70 mb-0.5 sm:mb-1 ml-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail size={14} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 sm:pl-10 sm:pr-4 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-ocean-blue focus:ring-4 focus:ring-ocean-blue/10 transition-all text-xs sm:text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-blue/70 mb-0.5 sm:mb-1 ml-1">Mobile Number</label>
                  <div className="flex gap-1.5">
                    {/* Country Code Dropdown */}
                    <div className="relative w-28 shrink-0">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value as CountryCode)}
                        className="w-full appearance-none pl-2 pr-5 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-ocean-blue text-xs font-medium cursor-pointer"
                      >
                        {COUNTRY_LIST.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.dialCode} ({c.code})
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-1.5 flex items-center pointer-events-none text-gray-400 text-[10px]">
                        ▼
                      </div>
                    </div>

                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                        <Phone size={14} />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-ocean-blue focus:ring-4 focus:ring-ocean-blue/10 transition-all text-xs sm:text-sm"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5 sm:mb-1 ml-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-blue/70">Password</label>
                  {password && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      passwordEvaluation.score >= 3 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                    }`}>
                      Strength: {passwordEvaluation.label}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={14} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8 pr-10 py-1.5 sm:pl-10 sm:pr-12 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-ocean-blue focus:ring-4 focus:ring-ocean-blue/10 transition-all text-xs sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* Password Strength Visual Meter */}
                {password && (
                  <div className="mt-2 space-y-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="grid grid-cols-4 gap-1 h-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full rounded-full transition-all duration-300 ${
                            step <= passwordEvaluation.score ? passwordEvaluation.color : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Interactive Requirement Checklist */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                      <div className={`flex items-center gap-1 ${passwordEvaluation.requirements.minLength ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                        <Check size={10} className={passwordEvaluation.requirements.minLength ? 'opacity-100' : 'opacity-30'} />
                        8+ Characters
                      </div>
                      <div className={`flex items-center gap-1 ${passwordEvaluation.requirements.hasUppercase ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                        <Check size={10} className={passwordEvaluation.requirements.hasUppercase ? 'opacity-100' : 'opacity-30'} />
                        Uppercase Letter
                      </div>
                      <div className={`flex items-center gap-1 ${passwordEvaluation.requirements.hasLowercase ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                        <Check size={10} className={passwordEvaluation.requirements.hasLowercase ? 'opacity-100' : 'opacity-30'} />
                        Lowercase Letter
                      </div>
                      <div className={`flex items-center gap-1 ${passwordEvaluation.requirements.hasNumber ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                        <Check size={10} className={passwordEvaluation.requirements.hasNumber ? 'opacity-100' : 'opacity-30'} />
                        Number (0-9)
                      </div>
                      <div className={`flex items-center gap-1 ${passwordEvaluation.requirements.hasSpecial ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                        <Check size={10} className={passwordEvaluation.requirements.hasSpecial ? 'opacity-100' : 'opacity-30'} />
                        Special Character (!@#$)
                      </div>
                      <div className={`flex items-center gap-1 ${passwordEvaluation.requirements.notCommon ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                        <Check size={10} className={passwordEvaluation.requirements.notCommon ? 'opacity-100' : 'opacity-30'} />
                        Not Common Password
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-blue/70 mb-1 ml-1">Email or Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-405">
                    <Mail size={14} />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 sm:pl-10 sm:pr-4 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-ocean-blue focus:ring-4 focus:ring-ocean-blue/10 transition-all text-xs sm:text-sm"
                    placeholder="you@example.com or +91..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-deep-blue/70 mb-1 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-405">
                    <Lock size={14} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8 pr-10 py-1.5 sm:pl-10 sm:pr-12 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-ocean-blue focus:ring-4 focus:ring-ocean-blue/10 transition-all text-xs sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-405 hover:text-gray-655"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-ocean-blue to-deep-blue text-white font-bold py-2.5 sm:py-3 rounded-xl shadow-lg shadow-ocean-blue/20 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center pt-3 border-t border-gray-100">
          <p className="text-[11px] sm:text-xs text-deep-blue/60 font-medium">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
                setPassword('');
              }}
              className="text-ocean-blue hover:text-deep-blue font-bold transition-colors ml-1 underline-offset-4 hover:underline"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onCancel || (() => navigate('/'))}
            className="text-[10px] sm:text-xs text-deep-blue/50 hover:text-ocean-blue transition-colors flex items-center justify-center gap-1 mx-auto font-medium"
          >
            {isModal ? '✕ Close Login' : '← Back to Home'}
          </button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto animate-fade-in-backdrop">
        <div className="w-full flex justify-center py-4 sm:py-8 my-auto">
          {formElement}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      {formElement}
    </div>
  );
}
