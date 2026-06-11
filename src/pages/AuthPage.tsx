import { logger } from '@/lib/logger';
import { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Check, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { StateInfo } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import IlpFooter from '@/components/IlpFooter';

declare global {
  interface Window {
    initSendOTP: (config: {
      widgetId: string
      tokenAuth: string
      exposeMethods?: boolean
      captchaRenderId?: string
      success?: (data: Record<string, unknown>) => void
      failure?: (error: unknown) => void
    }) => void
    sendOtp: (
      mobile: string,
      success: (data: Record<string, unknown>) => void,
      failure: (error: unknown) => void
    ) => void
    // verifyOtp takes the code the user typed and returns access-token on success
    verifyOtp: (
      otp: string,
      success: (data: Record<string, unknown>) => void,
      failure: (error: unknown) => void
    ) => void
    // retryOtp resends the OTP
    retryOtp: (callback: ((data: Record<string, unknown>) => void) | null) => void
  }
}

/**
 * Normalise a phone string to ASCII digits only.
 * Handles Unicode decimal digit blocks (Devanagari ०-९, Tamil ௦-௯,
 * Kannada ೦-೯, Arabic-Indic ٠-٩, etc.) so users on regional-language
 * mobile keyboards don't get spuriously rejected.
 */
function normalizeDigits(phone: string): string {
  return Array.from(phone)
    .map((ch) => {
      const n = ch.codePointAt(0) ?? NaN;
      // Fast-path: ASCII digit
      if (n >= 0x30 && n <= 0x39) return ch;
      // Unicode Nd (decimal digit) category — convert to ASCII equivalent
      const numericValue = Number(ch);
      if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 9) return String(numericValue);
      return ch; // keep as-is so \D strips it below
    })
    .join('')
    .replace(/\D/g, '');
}

function toE164Indian(phone: string): string {
  const digits = normalizeDigits(phone);
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+91${digits.slice(-10)}`; // best-effort fallback
}

function isValidE164(phone: string): boolean {
  // Normalise Unicode decimal digits to ASCII before checking, so users on
  // regional-language keyboards (Devanagari, Tamil, Kannada, Arabic-Indic, …)
  // are not incorrectly rejected.
  const digits = normalizeDigits(phone);
  // Accept: bare 10 digits | 0+10 digits (STD-style) | 91+10 digits (country code without +) | +91+10 digits
  return (
    digits.length === 10 ||
    (digits.length === 11 && digits.startsWith('0')) ||
    (digits.length === 12 && digits.startsWith('91'))
  );
}

function sendOtpWithTimeout(
  mobile: string,
  onSuccess: (data: Record<string, unknown>) => void,
  onFailure: () => void,
  timeoutMs = 15000,
) {
  if (typeof window.sendOtp !== 'function') { onFailure(); return; }
  let settled = false;
  const timer = setTimeout(() => {
    if (!settled) { settled = true; onFailure(); }
  }, timeoutMs);
  window.sendOtp(
    mobile,
    (data) => { if (!settled) { settled = true; clearTimeout(timer); onSuccess(data); } },
    () => { if (!settled) { settled = true; clearTimeout(timer); onFailure(); } },
  );
}

/**
 * Wraps window.verifyOtp with a hard timeout so the UI never gets stuck in
 * "Verifying..." if MSG91's SDK silently drops a callback (network issue, SDK bug).
 */
function verifyOtpWithTimeout(
  otp: string,
  onSuccess: (data: Record<string, unknown>) => void,
  onFailure: (error: unknown) => void,
  timeoutMs = 30000,
) {
  if (typeof window.verifyOtp !== 'function') {
    onFailure(new Error('OTP service not available'));
    return;
  }
  let settled = false;
  const timer = setTimeout(() => {
    if (!settled) {
      settled = true;
      onFailure(new Error('OTP verification timed out'));
    }
  }, timeoutMs);
  window.verifyOtp(
    otp,
    (data) => { if (!settled) { settled = true; clearTimeout(timer); onSuccess(data); } },
    (err) => { if (!settled) { settled = true; clearTimeout(timer); onFailure(err); } },
  );
}

// Must match the expiry configured in the MSG91 widget dashboard (default: 15 min)
const OTP_EXPIRY_SECONDS = 60;

function passwordStrength(pw: string): { label: string; color: string } {
  if (pw.length === 0) return { label: '', color: '' };
  if (pw.length < 6) return { label: 'Too short', color: 'text-red-500' };

  // 1. Complexity Criteria Checks
  const hasUppercase = /[A-Z]/.test(pw);
  const hasLowercase = /[a-z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);

  // Variety score (0 to 4)
  let varietyCount = 0;
  if (hasUppercase) varietyCount++;
  if (hasLowercase) varietyCount++;
  if (hasDigit) varietyCount++;
  if (hasSpecial) varietyCount++;

  // 2. Predictable / Common Patterns Detection
  const isAllSame = pw.split('').every(c => c === pw[0]);

  // Sequential characters of length 4 or more (e.g. "1234", "abcd", "dcba")
  let hasLongSequence = false;
  const lowerPw = pw.toLowerCase();
  for (let i = 0; i < lowerPw.length - 3; i++) {
    const c1 = lowerPw.charCodeAt(i);
    const c2 = lowerPw.charCodeAt(i + 1);
    const c3 = lowerPw.charCodeAt(i + 2);
    const c4 = lowerPw.charCodeAt(i + 3);
    if ((c2 === c1 + 1 && c3 === c2 + 1 && c4 === c3 + 1) ||
      (c2 === c1 - 1 && c3 === c2 - 1 && c4 === c3 - 1)) {
      hasLongSequence = true;
      break;
    }
  }

  // Common predictable passwords (case-insensitive)
  const commonPasswords = [
    'password', 'admin', '123456', '12345678', '123456789', 'welcome', 'qwerty',
    'pass123', 'p@ssword', 'letmein', 'password123', 'admin123'
  ];
  const isCommon = commonPasswords.some(common => lowerPw.includes(common));

  // 3. Scoring & Threshold Conditions
  // Under 8 characters is always Weak
  if (pw.length < 8) {
    return { label: 'Weak', color: 'text-red-500' };
  }

  // Identical characters, common passwords, or long sequences are always Weak
  if (isAllSame || isCommon || hasLongSequence) {
    return { label: 'Weak', color: 'text-red-500' };
  }

  // If variety is very low (only 1 category, or only 2 categories and length < 10)
  if (varietyCount <= 1 || (varietyCount === 2 && pw.length < 10)) {
    return { label: 'Weak', color: 'text-red-500' };
  }

  // Strong criteria:
  // Must be at least 8 characters.
  // Must satisfy at least 3 variety conditions AND must include both uppercase and lowercase,
  // OR satisfy all 4 variety conditions.
  // AND must not have major predictable structures.
  const hasBothCases = hasUppercase && hasLowercase;
  const isStrong = pw.length >= 8 && (
    (varietyCount === 4) ||
    (varietyCount === 3 && hasBothCases) ||
    (varietyCount === 3 && pw.length >= 10)
  );

  if (isStrong) {
    return { label: 'Strong', color: 'text-green-600' };
  }

  // Medium criteria: if it is not Weak and not Strong, it is Medium
  return { label: 'Medium', color: 'text-amber-600' };
}

function PasswordStrengthWidget({ value }: { value: string }) {
  if (!value) return <p className="text-xs text-muted-foreground mt-1">At least 6 characters (8+ recommended for strength)</p>;

  const strength = passwordStrength(value);

  const criteria = [
    { id: 'length', label: 'At least 8 characters', met: value.length >= 8 },
    { id: 'lowercase', label: 'One lowercase letter (a-z)', met: /[a-z]/.test(value) },
    { id: 'uppercase', label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(value) },
    { id: 'number', label: 'One number (0-9)', met: /\d/.test(value) },
    { id: 'special', label: 'One special character (e.g. @, #, $, !)', met: /[^A-Za-z0-9]/.test(value) },
  ];

  return (
    <div className="mt-2 p-3 bg-muted/30 border rounded-lg space-y-2.5 animate-in fade-in-50 duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">Password Strength:</span>
        <span className={`text-xs font-bold ${strength.color}`}>{strength.label}</span>
      </div>

      {/* Visual meter */}
      <div className="flex gap-1.5">
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.label === 'Too short' || strength.label === 'Weak' ? 'bg-red-500' :
            strength.label === 'Medium' ? 'bg-amber-500' : 'bg-green-600'
          }`} />
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.label === 'Too short' || strength.label === 'Weak' ? 'bg-gray-200' :
            strength.label === 'Medium' ? 'bg-amber-500' : 'bg-green-600'
          }`} />
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.label === 'Too short' || strength.label === 'Weak' || strength.label === 'Medium' ? 'bg-gray-200' :
            'bg-green-600'
          }`} />
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-muted/50">
        {criteria.map((item) => (
          <div key={item.id} className="flex items-center gap-1.5">
            {item.met ? (
              <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
            )}
            <span className={`text-[11px] transition-colors duration-200 ${item.met ? 'text-green-700 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
// Must match the OTP length configured in the MSG91 widget dashboard (set via VITE_MSG91_OTP_LENGTH)
const OTP_LENGTH = Number(import.meta.env.VITE_MSG91_OTP_LENGTH) || 4;

// Defined outside AuthPage so useRef is stable across parent re-renders
function OtpScreen({
  phone,
  otpValue,
  onOtpChange,
  onVerify,
  onResend,
  onBack,
  verifyLoading,
  resendCooldown,
  otpLength = OTP_LENGTH,
  initialTimeLeft = OTP_EXPIRY_SECONDS,
}: {
  phone: string
  otpValue: string
  onOtpChange: (v: string) => void
  onVerify: (e: React.FormEvent) => void
  onResend: () => void
  onBack?: () => void
  verifyLoading: boolean
  resendCooldown: number
  otpLength?: number
  initialTimeLeft?: number
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array.from({ length: otpLength }, () => null));

  // G10: initialise from parent-supplied timestamp so the countdown is accurate after tab switches
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []); // runs once on mount, resets on remount via key prop

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const chars = Array.from({ length: otpLength }, (_, i) => otpValue[i] ?? '');
    chars[index] = digit;
    onOtpChange(chars.join(''));
    if (digit && index < otpLength - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !(otpValue[index] ?? '') && index > 0) {
      const chars = Array.from({ length: otpLength }, (_, i) => otpValue[i] ?? '');
      chars[index - 1] = '';
      onOtpChange(chars.join(''));
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, otpLength);
    if (!pasted) return;
    onOtpChange(pasted);
    inputRefs.current[Math.min(pasted.length, otpLength - 1)]?.focus();
  };

  // Derived display state
  const isExpired = timeLeft === 0;
  const expiryPercent = Math.round((timeLeft / initialTimeLeft) * 100);
  const expiryColor =
    expiryPercent > 50 ? 'bg-green-500' :
      expiryPercent > 20 ? 'bg-amber-500' :
        'bg-red-500';
  const expiryTextColor =
    expiryPercent > 50 ? 'text-green-700' :
      expiryPercent > 20 ? 'text-amber-700' :
        'text-red-600';

  return (
    <form onSubmit={onVerify} className="space-y-5">

      {/* Phone hint */}
      <p className="text-sm text-muted-foreground text-center">
        Enter the {otpLength}-digit OTP sent to{' '}
        <span className="font-semibold text-foreground">{toE164Indian(phone)}</span>
      </p>

      {/* OTP digit inputs */}
      <div className="flex justify-center gap-2 sm:gap-3">
        {Array.from({ length: otpLength }, (_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            aria-label={`OTP digit ${i + 1}`}
            value={otpValue[i] ?? ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border-2 border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-shadow"
          />
        ))}
      </div>

      {/* ── Timer section ─────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 space-y-2.5">

        {/* OTP Expiry */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {/* clock icon */}
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              OTP expires in
            </span>
            {isExpired ? (
              <span className="text-red-600 font-semibold">Expired</span>
            ) : (
              <span className={`font-bold tabular-nums text-sm ${expiryTextColor}`}>{formatTime(timeLeft)}</span>
            )}
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${isExpired ? 'bg-red-500 w-0' : expiryColor}`}
              style={{ width: `${expiryPercent}%` }}
            />
          </div>
          {isExpired && (
            <p className="text-xs text-red-600 font-medium text-center pt-0.5">
              OTP has expired — please request a new one below.
            </p>
          )}
        </div>
      </div>

      {/* Verify button */}
      <Button
        type="submit"
        className="w-full"
        disabled={verifyLoading || otpValue.length < otpLength || isExpired}
      >
        {verifyLoading ? 'Verifying…' : 'Verify OTP'}
      </Button>

      {/* Resend button */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onResend}
        disabled={verifyLoading || resendCooldown > 0}
      >
        {resendCooldown > 0
          ? `Resend OTP — available in ${resendCooldown}s`
          : 'Resend OTP'}
      </Button>

      {onBack && (
        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={onBack}
          disabled={verifyLoading}
        >
          ← Change number
        </Button>
      )}
    </form>
  );
}


export default function AuthPage({ isTeacherOnly = false }: { isTeacherOnly?: boolean }) {
  logger.log('AuthPage: Component rendering', { isTeacherOnly });

  const { user, userProfile, signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('tab') === 'signup' || location.state?.defaultTab === 'signup') {
      setActiveTab('signup');
    } else {
      setActiveTab('signin');
    }
  }, [location]);

  const strings: Record<string, string> = {
    welcome: 'Welcome',
    signInTab: 'Sign In',
    signUpTab: 'Sign Up',
    mobileNumber: 'Mobile Number',
    password: 'Password',
    signInBtn: 'Sign In',
    fullName: 'Full Name',
    createPassword: 'Create a password',
    state: 'State *',
    createAccount: 'Create Account',
    preferredLanguage: 'Preferred language',
  };
  const t = (k: string) => strings[k] || k;

  const [signInForm, setSignInForm] = useState({ phone: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({
    role: (isTeacherOnly ? 'teacher' : 'student') as 'teacher' | 'student',
    phone: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    stateId: '',
    grade: '',
    preferredLanguage: 'en' as 'en' | 'kn' | 'ta' | 'hi'
  });

  useEffect(() => {
    setSignUpForm(prev => ({
      ...prev,
      role: isTeacherOnly ? 'teacher' : 'student'
    }));
  }, [isTeacherOnly]);
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [statesLoadError, setStatesLoadError] = useState(false);

  // Client-side sign-in rate limiting: lock after 5 consecutive failures
  const [signInFailCount, setSignInFailCount] = useState(0);
  const [signInLockCountdown, setSignInLockCountdown] = useState(0);
  const signInLockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSignInLockout = () => {
    setSignInLockCountdown(60);
    if (signInLockTimerRef.current) clearInterval(signInLockTimerRef.current);
    signInLockTimerRef.current = setInterval(() => {
      setSignInLockCountdown(prev => {
        if (prev <= 1) {
          clearInterval(signInLockTimerRef.current!);
          signInLockTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Sign Up OTP step: 'form' shows the registration form, 'otp' shows the OTP input
  const [signUpStep, setSignUpStep] = useState<'form' | 'otp'>('form');
  const [signUpOtp, setSignUpOtp] = useState('');

  const [signInMode, setSignInMode] = useState<'signin' | 'firstlogin'>('signin');
  // First Login steps: phone → otp → setpassword
  const [firstLoginStep, setFirstLoginStep] = useState<'phone' | 'otp' | 'setpassword'>('phone');
  const [firstLoginForm, setFirstLoginForm] = useState({ phone: '', newPassword: '', confirmPassword: '' });
  const [firstLoginOtp, setFirstLoginOtp] = useState('');
  const [otpSentCount, setOtpSentCount] = useState(0);

  const signUpAccessTokenRef = useRef<string | null>(null);
  const firstLoginAccessTokenRef = useRef<string | null>(null);
  const msg91MobileRef = useRef<string>('');
  // G10: track when OTP was dispatched so OtpScreen initialises its countdown accurately on remount
  const otpSentAtRef = useRef<number | null>(null);

  const [signUpResendCooldown, setSignUpResendCooldown] = useState(0);
  const [firstLoginResendCooldown, setFirstLoginResendCooldown] = useState(0);

  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showFirstLoginNewPassword, setShowFirstLoginNewPassword] = useState(false);
  const [showFirstLoginConfirmPassword, setShowFirstLoginConfirmPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const signUpCooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firstLoginCooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSignUpCooldown = () => {
    setSignUpResendCooldown(30);
    if (signUpCooldownTimerRef.current) clearInterval(signUpCooldownTimerRef.current);
    signUpCooldownTimerRef.current = setInterval(() => {
      setSignUpResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(signUpCooldownTimerRef.current!);
          signUpCooldownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startFirstLoginCooldown = () => {
    setFirstLoginResendCooldown(30);
    if (firstLoginCooldownTimerRef.current) clearInterval(firstLoginCooldownTimerRef.current);
    firstLoginCooldownTimerRef.current = setInterval(() => {
      setFirstLoginResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(firstLoginCooldownTimerRef.current!);
          firstLoginCooldownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (signUpCooldownTimerRef.current) clearInterval(signUpCooldownTimerRef.current);
      if (firstLoginCooldownTimerRef.current) clearInterval(firstLoginCooldownTimerRef.current);
      if (signInLockTimerRef.current) clearInterval(signInLockTimerRef.current);
    };
  }, []);

  useEffect(() => {
    logger.log('AuthPage: useEffect triggered, calling loadStates');
    loadStates();
  }, []);

  // Load MSG91 OTP widget script and initialise with widget credentials
  useEffect(() => {
    const rawWidgetId = import.meta.env.VITE_MSG91_WIDGET_ID as string;
    const rawTokenAuth = import.meta.env.VITE_MSG91_TOKEN_AUTH as string;
    const widgetId = rawWidgetId?.trim().replace(/^["']|["']$/g, '');
    const tokenAuth = rawTokenAuth?.trim().replace(/^["']|["']$/g, '');
    if (!widgetId || !tokenAuth) {
      logger.error('MSG91 credentials missing! widgetId:', !!widgetId, 'tokenAuth:', !!tokenAuth);
      return;
    }

    const doInit = () => {
      if (!window.initSendOTP) {
        logger.error('window.initSendOTP not found during doInit');
        return;
      }
      try {
        logger.log('Calling initSendOTP with cleaned credentials...', {
          widgetIdLength: widgetId.length,
          tokenAuthLength: tokenAuth.length,
          widgetIdFirstChars: widgetId.slice(0, 4)
        });
        window.initSendOTP({
          widgetId,
          tokenAuth,
          exposeMethods: true,
          captchaRenderId: '',        // G1: suppress the built-in MSG91 captcha/popup
          success: (data: unknown) => {
            logger.log('MSG91 widget success callback triggered:', JSON.stringify(data));
          },
          failure: (error: unknown) => {
            logger.error('MSG91 widget failure callback triggered:', JSON.stringify(error));
          },
        });
      } catch (err) {
        logger.error('MSG91 initSendOTP threw:', err);
      }
    };

    // G5: MSG91 registers globals as both non-configurable AND non-writable, so both `delete`
    // and assignment throw TypeError in strict mode (ES-module bundles). Swallow both silently —
    // the globals persist but MSG91 re-initialises them on the next mount anyway.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const cleanupGlobals = () => {
      (['initSendOTP', 'sendOtp', 'verifyOtp', 'retryOtp'] as const).forEach((key) => {
        try { delete w[key]; } catch { /* non-configurable — best-effort */ }
        try { w[key] = undefined; } catch { /* non-writable — best-effort */ }
      });
    };

    // G4: check existing script tag — it may still be loading even if the tag is in the DOM
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://verify.msg91.com/otp-provider.js"]');
    if (existing) {
      if (window.initSendOTP) {
        doInit();  // already loaded, reinit immediately
      } else {
        // G4: script tag present but still loading — defer init until it fires.
        // Return a cleanup that removes the listener if the component unmounts first.
        existing.addEventListener('load', doInit, { once: true });
        return () => {
          existing.removeEventListener('load', doInit);
        };
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://verify.msg91.com/otp-provider.js';
    script.async = true;
    script.onload = () => {
      logger.log('MSG91 script loaded, initialising widget');
      doInit();
    };
    // G3: surface CDN failures early so developers can diagnose
    script.onerror = () => {
      logger.error('MSG91 OTP provider script failed to load — OTP will be unavailable');
    };
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
      cleanupGlobals();
    };
  }, []);

  const loadStates = async () => {
    logger.log('Loading states...');
    setLoadingStates(true);
    setStatesLoadError(false);
    try {
      let { data, error } = await supabase
        .from('states')
        .select('id, state_name, state_code, org_id, orgs(name)')
        .order('state_name');
      if (error) {
        logger.warn('Full state query failed, retrying with basic fields:', error);
        const retry = await supabase
          .from('states')
          .select('id, state_name, org_id, orgs(name)')
          .order('state_name');
        data = retry.data as any[] | null;
        error = retry.error as any;
      }
      if (error) {
        logger.error('State query failed after retry:', error);
        setStates([]);
        setStatesLoadError(true);
        return;
      }
      const rawStates = (data || []).filter((s: any) => s && s.id && s.state_name);
      const uniqueStates = Array.from(new Map(rawStates.map((s: any) => [s.id, s])).values());
      const statesData = uniqueStates.map((state: any) => ({
        state_id: String(state.id),
        state_name: String(state.state_name),
        state_code: String((state as any).state_code || ''),
        org_name: String((state as any).orgs?.name || '')
      }));
      setStates(statesData);
    } catch (error) {
      logger.error('Error loading states:', error);
      setStates([]);
      setStatesLoadError(true);
    } finally {
      setLoadingStates(false);
    }
  };

  useEffect(() => {
    if (user && userProfile) {
      logger.log('AuthPage: User and profile available, redirecting...', {
        role: userProfile.role,
        userId: user.id
      });
    }
  }, [user, userProfile]);

  if (user && userProfile) {
    const activeLang = (typeof window !== 'undefined' ? localStorage.getItem('lang') : null) || userProfile.preferred_language || 'en';
    const redirectPath = userProfile.role === 'admin' ? `/admin?lang=${activeLang}`
      : userProfile.role === 'teacher' ? `/teacher?lang=${activeLang}`
        : `/student?lang=${activeLang}`;
    logger.log('AuthPage: Redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signInLockCountdown > 0) return;
    if (!isValidE164(signInForm.phone)) {
      toast({ title: 'Sign In Failed', description: 'Please enter a valid 10-digit mobile number.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await signIn(toE164Indian(signInForm.phone), signInForm.password);
    setLoading(false);
    if (error) {
      logger.error('Sign in error:', error);
      const nextCount = signInFailCount + 1;
      setSignInFailCount(nextCount);
      if (nextCount >= 5) {
        setSignInFailCount(0);
        startSignInLockout();
        toast({ title: 'Too many failed attempts', description: 'Please wait 60 seconds before trying again.', variant: 'destructive' });
      }
    } else {
      setSignInFailCount(0);
    }
  };

  // Step 1 of Sign Up: validate form, dispatch OTP, show OTP input screen
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const trimmedName = signUpForm.fullName.trim();
    if (!trimmedName) {
      toast({ title: 'Sign Up Failed', description: 'Please enter your full name.', variant: 'destructive' });
      setLoading(false);
      return;
    }
    const nameRegex = /^[a-zA-Z\u0C80-\u0CFF\u0B80-\u0BFF\u0900-\u097F\s''-]+$/;
    if (!nameRegex.test(trimmedName)) {
      toast({ title: 'Sign Up Failed', description: 'Full name should only contain letters and spaces.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (!signUpForm.stateId) {
      toast({ title: 'Sign Up Failed', description: 'Please select your state.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (!isValidE164(signUpForm.phone)) {
      toast({ title: 'Sign Up Failed', description: 'Please enter a 10-digit mobile number', variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (signUpForm.password.length < 6) {
      toast({ title: 'Sign Up Failed', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (signUpForm.password !== signUpForm.confirmPassword) {
      toast({ title: 'Sign Up Failed', description: 'Passwords do not match.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (signUpForm.role === 'student' && !signUpForm.grade) {
      toast({ title: 'Sign Up Failed', description: 'Please select your grade.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (typeof window.sendOtp !== 'function') {
      toast({ title: 'OTP Unavailable', description: 'OTP service unavailable. Please refresh and try again.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const normalizedPhone = toE164Indian(signUpForm.phone);

    try {
      // Secure server-side check for duplicate mobile number using existing set-first-password API
      const { error: checkError } = await supabase.functions.invoke('set-first-password', {
        body: {
          mobile: normalizedPhone,
          newPassword: signUpForm.password || 'dummy_password_for_existence_check',
          access_token: 'dummy_token_for_existence_check'
        }
      });

      if (checkError) {
        const status = (checkError as any).status || (checkError as any).context?.status;
        if (status) {
          if (status === 404) {
            // User does not exist, safe to proceed
            logger.log('Pre-signup duplicate mobile check: user does not exist (OK)');
          } else {
            // Any other HTTP status (400, 401, 403, etc.) means user exists!
            toast({
              title: 'Already Registered',
              description: 'This mobile number is already registered. Please sign in instead.',
              variant: 'destructive',
            });
            setLoading(false);
            return;
          }
        } else {
          // Network error or other non-HTTP error, log and fallback gracefully
          logger.error('Network or system error during pre-signup duplicate mobile check:', checkError);
        }
      } else {
        // If it succeeded (200), it also means the user exists!
        toast({
          title: 'Already Registered',
          description: 'This mobile number is already registered. Please sign in instead.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
    } catch (err) {
      // Log the unexpected error but do not block signup (graceful fallback)
      logger.error('Unexpected error during pre-signup duplicate mobile check:', err);
    }
    // MSG91 expects 91XXXXXXXXXX (no '+')
    const msg91Mobile = normalizedPhone.replace('+', '');
    msg91MobileRef.current = msg91Mobile;
    sendOtpWithTimeout(
      msg91Mobile,
      (data) => {
        logger.log('MSG91 sendOtp success:', JSON.stringify(data));
        otpSentAtRef.current = Date.now();
        setSignUpOtp('');
        setSignUpStep('otp');
        setOtpSentCount(c => c + 1);
        startSignUpCooldown();
        setLoading(false);
      },
      () => {
        logger.error('MSG91 sendOtp failed or timed out');
        toast({
          title: 'Failed to send OTP',
          description: 'Could not send OTP to this number. Please check the number and try again.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    );
  };

  // Step 2 of Sign Up: verify the OTP the user typed, then create the account
  const handleSignUpVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const normalizedPhone = toE164Indian(signUpForm.phone);

    // verifyOtpWithTimeout guards against MSG91 SDK silently dropping the callback,
    // which would otherwise leave the UI locked in "Verifying..." forever.
    verifyOtpWithTimeout(
      signUpOtp,
      async (data: Record<string, unknown>) => {
        // Wrap entire async flow in try/catch/finally so setLoading(false) is
        // always called and unexpected throws surface as a toast.
        try {
          logger.log('MSG91 sign up verifyOtp success raw data:', JSON.stringify(data));
          // MSG91 may return the token under different key names depending on plan/version
          signUpAccessTokenRef.current = (
            (data?.['access-token'] as string) ||
            (data?.['access_token'] as string) ||
            (data?.['accessToken'] as string) ||
            (data?.['token'] as string) ||
            (typeof data?.['message'] === 'string' && data['message'].startsWith('eyJ') ? data['message'] : '') ||
            ''
          );

          if (!signUpAccessTokenRef.current) {
            logger.error('No token in MSG91 sign up verifyOtp data:', JSON.stringify(data));
            toast({
              title: 'Verification Error',
              description: `OTP verified but no access token was returned (keys: ${Object.keys(data || {}).join(', ')}). Please try again.`,
              variant: 'destructive',
            });
            return;
          }

          if (signUpForm.role === 'student') {
            // Student self-registration via create-student-self-register Edge Function
            const { data: fnData, error } = await supabase.functions.invoke('create-student-self-register', {
              body: {
                fullName: signUpForm.fullName,
                phone: normalizedPhone,
                password: signUpForm.password,
                grade: signUpForm.grade,
                stateId: signUpForm.stateId,
                preferredLanguage: signUpForm.preferredLanguage,
                accessToken: signUpAccessTokenRef.current ?? '',
              },
            });

            if (error || fnData?.error) {
              let msg = fnData?.error || 'Could not create account. Please try again.';
              if (error) {
                if (error instanceof FunctionsHttpError) {
                  try {
                    const body = await error.context.json();
                    msg = body.error || msg;
                  } catch {
                    try {
                      const text = await error.context.text();
                      msg = text || msg;
                    } catch { }
                  }
                } else {
                  msg = error.message || msg;
                }
              }
              logger.error('Student sign up error:', msg);
              toast({ title: 'Sign Up Failed', description: msg, variant: 'destructive' });
              return;
            }

            // G12: clear sensitive state now that the token has been consumed
            signUpAccessTokenRef.current = null;
            setSignUpForm(prev => ({ ...prev, password: '', confirmPassword: '' }));

            // Sign in immediately after successful registration
            const { error: studentSignInError } = await signIn(normalizedPhone, signUpForm.password);
            if (studentSignInError) {
              toast({ title: 'Account created', description: 'Please sign in with your mobile number and password.', variant: 'default' });
            }
            return;
          }

          // Teacher self-registration via create-teacher Edge Function
          const { data: fnData, error } = await supabase.functions.invoke('create-teacher', {
            body: {
              fullName: signUpForm.fullName,
              phone: normalizedPhone,
              password: signUpForm.password,
              stateId: signUpForm.stateId,
              preferredLanguage: signUpForm.preferredLanguage,
              accessToken: signUpAccessTokenRef.current ?? '',
            },
          });

          if (error || fnData?.error) {
            let msg = fnData?.error || 'Could not create account. Please try again.';
            if (error) {
              if (error instanceof FunctionsHttpError) {
                try {
                  const body = await error.context.json();
                  msg = body.error || msg;
                } catch {
                  try {
                    const text = await error.context.text();
                    msg = text || msg;
                  } catch { }
                }
              } else {
                msg = error.message || msg;
              }
            }
            logger.error('Teacher sign up error:', msg);
            toast({ title: 'Sign Up Failed', description: msg, variant: 'destructive' });
            return;
          }

          // G12: clear sensitive state now that the token has been consumed
          signUpAccessTokenRef.current = null;
          setSignUpForm(prev => ({ ...prev, password: '', confirmPassword: '' }));

          // Sign in immediately after successful registration
          const { error: signInError } = await signIn(normalizedPhone, signUpForm.password);
          if (signInError) {
            toast({ title: 'Account created', description: 'Please sign in with your mobile number and password.', variant: 'default' });
          }
        } catch (err) {
          logger.error('Unexpected error after OTP verify (sign up):', err);
          toast({ title: 'Unexpected Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
        } finally {
          setLoading(false);
        }
      },
      (_error: unknown) => {
        const isTimeout = _error instanceof Error && _error.message.includes('timed out');
        toast({
          title: isTimeout ? 'Verification Timed Out' : 'OTP Verification Failed',
          description: isTimeout
            ? 'The verification request took too long. Please check your connection and try again.'
            : 'The OTP entered is incorrect or has expired. Please try again or request a new one.',
          variant: 'destructive',
        });
        setLoading(false);
      },
    );
  };

  // Step 1 of First Login: validate phone, dispatch OTP, show OTP input screen
  const handleFirstLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidE164(firstLoginForm.phone)) {
      toast({ title: 'Invalid Mobile', description: 'Please enter a 10-digit mobile number.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const normalizedPhone = toE164Indian(firstLoginForm.phone);
    const msg91Mobile = normalizedPhone.replace('+', '');
    msg91MobileRef.current = msg91Mobile;
    sendOtpWithTimeout(
      msg91Mobile,
      (data) => {
        logger.log('MSG91 sendOtp success:', JSON.stringify(data));
        otpSentAtRef.current = Date.now();
        setFirstLoginOtp('');
        setFirstLoginStep('otp');
        setOtpSentCount(c => c + 1);
        startFirstLoginCooldown();
        setLoading(false);
      },
      () => {
        logger.error('MSG91 sendOtp failed or timed out');
        toast({
          title: 'Failed to send OTP',
          description: 'Could not send OTP to this number. Please check the number and try again.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    );
  };

  // Step 2 of First Login: verify OTP, then show password setup screen
  const handleFirstLoginVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // verifyOtpWithTimeout guards against MSG91 SDK silently dropping the callback,
    // which would otherwise leave the UI locked in "Verifying..." forever.
    verifyOtpWithTimeout(
      firstLoginOtp,
      async (data: Record<string, unknown>) => {
        try {
          logger.log('MSG91 first login verifyOtp success raw data:', JSON.stringify(data));
          firstLoginAccessTokenRef.current = (
            (data?.['access-token'] as string) ||
            (data?.['access_token'] as string) ||
            (data?.['accessToken'] as string) ||
            (data?.['token'] as string) ||
            (typeof data?.['message'] === 'string' && data['message'].startsWith('eyJ') ? data['message'] : '') ||
            ''
          );

          if (!firstLoginAccessTokenRef.current) {
            logger.error('No token in MSG91 first login verifyOtp data:', JSON.stringify(data));
            toast({
              title: 'Verification Error',
              description: `OTP verified but no access token was returned (keys: ${Object.keys(data || {}).join(', ')}). Please try again.`,
              variant: 'destructive',
            });
            return;
          }

          setFirstLoginStep('setpassword');
        } catch (err) {
          logger.error('Unexpected error after OTP verify (first login):', err);
          toast({ title: 'Unexpected Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
        } finally {
          setLoading(false);
        }
      },
      (_error: unknown) => {
        const isTimeout = _error instanceof Error && _error.message.includes('timed out');
        toast({
          title: isTimeout ? 'Verification Timed Out' : 'OTP Verification Failed',
          description: isTimeout
            ? 'The verification request took too long. Please check your connection and try again.'
            : 'The OTP entered is incorrect or has expired. Please try again or request a new one.',
          variant: 'destructive',
        });
        setLoading(false);
      },
    );
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstLoginForm.newPassword) {
      toast({ title: 'Password Required', description: 'Please enter a new password.', variant: 'destructive' });
      return;
    }

    if (firstLoginForm.newPassword.length < 6) {
      toast({ title: 'Password Too Short', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    if (firstLoginForm.newPassword !== firstLoginForm.confirmPassword) {
      toast({ title: 'Password Mismatch', description: 'Passwords do not match. Please try again.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const normalizedPhone = toE164Indian(firstLoginForm.phone);

    const { data, error } = await supabase.functions.invoke('set-first-password', {
      body: {
        mobile: normalizedPhone,
        newPassword: firstLoginForm.newPassword,
        access_token: firstLoginAccessTokenRef.current ?? '',
      },
    });

    if (error || data?.error) {
      let msg = data?.error || 'Could not set password. Please try again.';
      if (error) {
        if (error instanceof FunctionsHttpError) {
          try {
            const body = await error.context.json();
            msg = body.error || msg;
          } catch {
            try {
              const text = await error.context.text();
              msg = text || msg;
            } catch { }
          }
        } else {
          msg = error.message || msg;
        }
      }
      logger.error('First login set-password error:', msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // G12: clear sensitive state now that the token has been consumed
    firstLoginAccessTokenRef.current = null;
    const { error: signInError } = await signIn(normalizedPhone, firstLoginForm.newPassword);
    setLoading(false);
    if (signInError) {
      setFirstLoginForm(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
      toast({ title: 'Password set', description: 'Please sign in with your mobile number and new password.', variant: 'default' });
    }
  };

  const phoneError = signUpForm.phone && !isValidE164(signUpForm.phone)
    ? 'Please enter a 10-digit mobile number'
    : '';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 dark:bg-slate-950 relative overflow-hidden">
      {/* Ambient background glows to highlight the card */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-accent/10 blur-[150px] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className={`w-full transition-all duration-300 ${activeTab === 'signup' ? 'max-w-md md:max-w-2xl' : 'max-w-md'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-4 text-center md:text-left mb-6">
            <div className="mx-auto md:mx-0 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md border border-border overflow-hidden shrink-0">
              <img src="/logo/ILP-new-logo.jpeg" alt="logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 select-none">
                Career Compass
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">an <span className="font-semibold text-primary">India Literacy Project</span> initiative</p>
              {/* <p className="text-xs text-muted-foreground/80 mt-1 uppercase tracking-wide">Navigate your career journey</p> */}
            </div>
          </div>

          <Card className="shadow-2xl border border-border/80 bg-background/90 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardContent className="pt-6">
              {/* Dynamic Card Heading */}
              <div className="text-center mb-6 pb-4 border-b border-border/50">
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  {activeTab === 'signin'
                    ? 'Sign In'
                    : (isTeacherOnly ? 'Teacher Registration' : 'Student Registration')}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeTab === 'signin'
                    ? 'Sign in to access your dashboard'
                    : (isTeacherOnly
                      ? 'Fill in the details below to create your teacher account'
                      : 'Fill in the details below to create your student learning account')}
                </p>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')} className="w-full">
                <div className="flex justify-center mb-6">
                  <TabsList className="grid grid-cols-2 bg-muted p-1 border border-border/40 rounded-xl w-full max-w-xs h-10">
                    <TabsTrigger
                      value="signin"
                      className="rounded-lg py-1.5 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                      {t('signInTab')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="rounded-lg py-1.5 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                      {isTeacherOnly ? 'Teacher Signup' : 'Student Signup'}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="signin">
                  {signInMode === 'signin' ? (
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-phone">{t('mobileNumber')}</Label>
                        <Input
                          id="signin-phone"
                          type="tel"
                          placeholder="10-digit mobile number"
                          value={signInForm.phone}
                          onChange={(e) => setSignInForm({ ...signInForm, phone: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">{t('password')}</Label>
                        <div className="relative">
                          <Input
                            id="signin-password"
                            type={showSignInPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={signInForm.password}
                            onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                            className="pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignInPassword(!showSignInPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                          >
                            {showSignInPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={loading || signInLockCountdown > 0}>
                        {loading ? 'Signing In...' : signInLockCountdown > 0 ? `Too many attempts — wait ${signInLockCountdown}s` : t('signInBtn')}
                      </Button>
                      <p className="text-center text-sm text-muted-foreground">
                        Account set up by your teacher?{' '}
                        <button
                          type="button"
                          className="underline text-foreground hover:text-primary transition-colors"
                          onClick={() => { setSignInMode('firstlogin'); setFirstLoginStep('phone'); firstLoginAccessTokenRef.current = null; msg91MobileRef.current = ''; }}
                        >
                          Set up your password
                        </button>
                      </p>
                    </form>
                  ) : firstLoginStep === 'phone' ? (
                    <form onSubmit={handleFirstLoginOtp} className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Verify your mobile number to set or reset your password.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="firstlogin-phone">{t('mobileNumber')}</Label>
                        <Input
                          id="firstlogin-phone"
                          type="tel"
                          placeholder="10-digit mobile number"
                          value={firstLoginForm.phone}
                          onChange={(e) => setFirstLoginForm({ ...firstLoginForm, phone: e.target.value })}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Sending OTP...' : 'Verify Mobile'}
                      </Button>
                      <p className="text-center text-sm text-muted-foreground">
                        Already have a password?{' '}
                        <button
                          type="button"
                          className="underline text-foreground hover:text-primary transition-colors"
                          onClick={() => { setSignInMode('signin'); setFirstLoginStep('phone'); firstLoginAccessTokenRef.current = null; msg91MobileRef.current = ''; }}
                        >
                          Sign in
                        </button>
                      </p>
                    </form>
                  ) : firstLoginStep === 'otp' ? (
                    <OtpScreen
                      key={otpSentCount}
                      phone={firstLoginForm.phone}
                      otpValue={firstLoginOtp}
                      onOtpChange={setFirstLoginOtp}
                      onVerify={handleFirstLoginVerifyOtp}
                      resendCooldown={firstLoginResendCooldown}
                      initialTimeLeft={otpSentAtRef.current ? Math.max(0, OTP_EXPIRY_SECONDS - Math.floor((Date.now() - otpSentAtRef.current) / 1000)) : OTP_EXPIRY_SECONDS}
                      onBack={() => { setFirstLoginStep('phone'); firstLoginAccessTokenRef.current = null; msg91MobileRef.current = ''; }}
                      onResend={() => {
                        // G6: retryOtp re-sends on the same MSG91 session (correct API for resend)
                        if (!msg91MobileRef.current) return;
                        if (typeof window.retryOtp !== 'function') {
                          toast({ title: 'OTP Unavailable', description: 'OTP service unavailable. Please refresh and try again.', variant: 'destructive' });
                          return;
                        }
                        otpSentAtRef.current = Date.now();
                        setFirstLoginOtp('');
                        setOtpSentCount(c => c + 1);
                        startFirstLoginCooldown();
                        window.retryOtp(() => {
                          logger.log('MSG91 retryOtp callback (first login)');
                          toast({ title: 'OTP Resent', description: 'A new OTP has been sent to your mobile number.' });
                        });
                      }}
                      verifyLoading={loading}
                    />
                  ) : (
                    <form onSubmit={handleSetPassword} className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Mobile verified: <span className="font-medium">{toE164Indian(firstLoginForm.phone)}</span>
                      </p>
                      {/* G17: warn that the OTP session has a limited lifetime so the user sets the password promptly */}
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                        Your OTP session expires in 15 minutes — please set your password now.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="firstlogin-newpassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="firstlogin-newpassword"
                            type={showFirstLoginNewPassword ? "text" : "password"}
                            autoComplete="new-password"
                            minLength={6}
                            placeholder="Create a password"
                            value={firstLoginForm.newPassword}
                            onChange={(e) => setFirstLoginForm({ ...firstLoginForm, newPassword: e.target.value })}
                            className="pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowFirstLoginNewPassword(!showFirstLoginNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                          >
                            {showFirstLoginNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <PasswordStrengthWidget value={firstLoginForm.newPassword} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firstlogin-confirmpassword">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="firstlogin-confirmpassword"
                            type={showFirstLoginConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Confirm your password"
                            value={firstLoginForm.confirmPassword}
                            onChange={(e) => setFirstLoginForm({ ...firstLoginForm, confirmPassword: e.target.value })}
                            className="pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowFirstLoginConfirmPassword(!showFirstLoginConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                          >
                            {showFirstLoginConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Setting Password...' : 'Set Password & Login'}
                      </Button>
                    </form>
                  )}
                </TabsContent>

                <TabsContent value="signup">
                  {signUpStep === 'otp' ? (
                    <OtpScreen
                      key={otpSentCount}
                      phone={signUpForm.phone}
                      otpValue={signUpOtp}
                      onOtpChange={setSignUpOtp}
                      onVerify={handleSignUpVerifyOtp}
                      resendCooldown={signUpResendCooldown}
                      initialTimeLeft={otpSentAtRef.current ? Math.max(0, OTP_EXPIRY_SECONDS - Math.floor((Date.now() - otpSentAtRef.current) / 1000)) : OTP_EXPIRY_SECONDS}
                      onBack={() => { setSignUpStep('form'); signUpAccessTokenRef.current = null; msg91MobileRef.current = ''; }}
                      onResend={() => {
                        // G6: retryOtp re-sends on the same MSG91 session (correct API for resend)
                        if (!msg91MobileRef.current) return;
                        if (typeof window.retryOtp !== 'function') {
                          toast({ title: 'OTP Unavailable', description: 'OTP service unavailable. Please refresh and try again.', variant: 'destructive' });
                          return;
                        }
                        otpSentAtRef.current = Date.now();
                        setSignUpOtp('');
                        setOtpSentCount(c => c + 1);
                        startSignUpCooldown();
                        window.retryOtp(() => {
                          logger.log('MSG91 retryOtp callback (sign up)');
                          toast({ title: 'OTP Resent', description: 'A new OTP has been sent to your mobile number.' });
                        });
                      }}
                      verifyLoading={loading}
                    />
                  ) : (
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 md:space-y-0">
                        {/* Full Name */}
                        <div className="space-y-2">
                          <Label htmlFor="signup-name">{t('fullName')}</Label>
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Enter your full name"
                            value={signUpForm.fullName}
                            onChange={(e) => setSignUpForm({ ...signUpForm, fullName: e.target.value.trimStart() })}
                            required
                          />
                        </div>

                        {/* Mobile Number */}
                        <div className="space-y-2">
                          <Label htmlFor="signup-phone">{t('mobileNumber')}</Label>
                          <Input
                            id="signup-phone"
                            type="tel"
                            placeholder="10-digit mobile number"
                            value={signUpForm.phone}
                            onChange={(e) => setSignUpForm({ ...signUpForm, phone: e.target.value })}
                            className={phoneError ? 'border-red-400' : ''}
                            required
                          />
                          {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">{t('password')}</Label>
                          <div className="relative">
                            <Input
                              id="signup-password"
                              type={showSignUpPassword ? "text" : "password"}
                              autoComplete="new-password"
                              minLength={6}
                              placeholder={t('createPassword')}
                              value={signUpForm.password}
                              onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                              className="pr-10"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                            >
                              {showSignUpPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                          <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                          <div className="relative">
                            <Input
                              id="signup-confirm-password"
                              type={showSignUpConfirmPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="Re-enter your password"
                              value={signUpForm.confirmPassword}
                              onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                              className="pr-10"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                            >
                              {showSignUpConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {signUpForm.confirmPassword.length > 0 && signUpForm.password !== signUpForm.confirmPassword && (
                            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                          )}
                        </div>

                        {/* Password Strength Widget - spans full width on desktop */}
                        <div className="col-span-1 md:col-span-2">
                          <PasswordStrengthWidget value={signUpForm.password} />
                        </div>

                        {/* State Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="state">{t('state')}</Label>
                          {statesLoadError ? (
                            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center justify-between">
                              <span>Could not load states.</span>
                              <button
                                type="button"
                                className="underline text-sm font-medium ml-2"
                                onClick={loadStates}
                              >
                                Retry
                              </button>
                            </div>
                          ) : (
                            <Select
                              value={signUpForm.stateId}
                              onValueChange={(value) => setSignUpForm({ ...signUpForm, stateId: value })}
                              disabled={loadingStates}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={loadingStates ? "Loading states..." : "Select your state"} />
                              </SelectTrigger>
                              <SelectContent>
                                {states.length === 0 ? (
                                  loadingStates ? null : (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">No states available</div>
                                  )
                                ) : (
                                  states.map((state) => (
                                    <SelectItem key={state.state_id} value={state.state_id}>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{state.state_name}</span>
                                        <span className="text-xs text-muted-foreground">{state.state_code}</span>
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        {/* Grade picker (if student) OR Preferred Language (if teacher) */}
                        {signUpForm.role === 'student' ? (
                          <div className="space-y-2">
                            <Label htmlFor="grade">Grade *</Label>
                            <Select
                              value={signUpForm.grade}
                              onValueChange={(value) => setSignUpForm({ ...signUpForm, grade: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select your grade" />
                              </SelectTrigger>
                              <SelectContent>
                                {['8', '9', '10', '11', '12'].map((g) => (
                                  <SelectItem key={g} value={g}>Class {g}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="preferred-language">{t('preferredLanguage')}</Label>
                            <Select
                              value={signUpForm.preferredLanguage}
                              onValueChange={(value: 'en' | 'kn' | 'ta' | 'hi') => setSignUpForm({ ...signUpForm, preferredLanguage: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="kn">Kannada</SelectItem>
                                <SelectItem value="ta">Tamil</SelectItem>
                                <SelectItem value="hi">Hindi</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Preferred Language for student - spans 2 columns */}
                        {signUpForm.role === 'student' && (
                          <div className="space-y-2 col-span-1 md:col-span-2">
                            <Label htmlFor="preferred-language">{t('preferredLanguage')}</Label>
                            <Select
                              value={signUpForm.preferredLanguage}
                              onValueChange={(value: 'en' | 'kn' | 'ta' | 'hi') => setSignUpForm({ ...signUpForm, preferredLanguage: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="kn">Kannada</SelectItem>
                                <SelectItem value="ta">Tamil</SelectItem>
                                <SelectItem value="hi">Hindi</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>



                      <div className="max-w-md mx-auto space-y-4 pt-4">
                        <Button type="submit" className="w-full shadow-md" disabled={loading}>
                          {loading ? 'Sending OTP...' : (isTeacherOnly ? 'Teacher Signup' : 'Student Signup')}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                          {isTeacherOnly ? (
                            <>
                              Are you a student?{' '}
                              <button
                                type="button"
                                className="underline text-foreground hover:text-primary transition-colors font-medium"
                                onClick={() => navigate('/auth', { state: { defaultTab: 'signup' } })}
                              >
                                Student Signup
                              </button>
                            </>
                          ) : (
                            <>
                              Are you a teacher?{' '}
                              <button
                                type="button"
                                className="underline text-foreground hover:text-primary transition-colors font-medium"
                                onClick={() => navigate('/auth/teacher', { state: { defaultTab: 'signup' } })}
                              >
                                Teacher Signup
                              </button>
                            </>
                          )}
                        </p>
                      </div>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      <IlpFooter />
    </div>
  );
}
