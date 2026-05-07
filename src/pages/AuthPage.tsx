import { logger } from '@/lib/logger';
import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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

function toE164Indian(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return phone;
}

function isValidE164(phone: string): boolean {
  // Accept: +91XXXXXXXXXX (E.164), bare 10 digits, or 91XXXXXXXXXX (12-digit without +)
  return /^\+91\d{10}$/.test(phone) || /^\d{10}$/.test(phone) || /^91\d{10}$/.test(phone);
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

// Must match the expiry configured in the MSG91 widget dashboard (default: 15 min)
const OTP_EXPIRY_SECONDS = 900;

function passwordStrength(pw: string): { label: string; color: string } {
  if (pw.length === 0) return { label: '', color: '' };
  if (pw.length < 6) return { label: 'Too short', color: 'text-red-500' };
  const hasLetter = /[a-zA-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const isAllSame = pw.split('').every(c => c === pw[0]);
  if (isAllSame || (!hasLetter && !hasDigit)) return { label: 'Very weak', color: 'text-red-500' };
  if (pw.length >= 8 && hasLetter && hasDigit) return { label: 'Strong', color: 'text-green-600' };
  return { label: 'Fair', color: 'text-yellow-600' };
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

  return (
    <form onSubmit={onVerify} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter the {otpLength}-digit OTP sent to{' '}
        <span className="font-medium">{toE164Indian(phone)}</span>
      </p>
      <div className="flex justify-center gap-3">
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
            className="w-12 h-12 text-center text-lg font-semibold border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          />
        ))}
      </div>
      <p className="text-sm text-center text-muted-foreground">
        {timeLeft > 0 ? (
          <>OTP expires in <span className="font-medium text-foreground">{formatTime(timeLeft)}</span></>
        ) : (
          <span className="text-destructive font-medium">OTP expired. Please request a new one.</span>
        )}
      </p>
      <Button type="submit" className="w-full" disabled={verifyLoading || otpValue.length < otpLength || timeLeft === 0}>
        {verifyLoading ? 'Verifying...' : 'Verify OTP'}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onResend}
        disabled={verifyLoading || resendCooldown > 0}
      >
        {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
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

export default function AuthPage() {
  logger.log('AuthPage: Component rendering');

  const { user, userProfile, signIn } = useAuth();
  const { toast } = useToast();

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
    role: 'teacher' as 'teacher' | 'student',
    phone: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    stateId: '',
    grade: '',
    preferredLanguage: 'en' as 'en' | 'kn' | 'ta' | 'hi'
  });
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
    const widgetId = import.meta.env.VITE_MSG91_WIDGET_ID as string;
    const tokenAuth = import.meta.env.VITE_MSG91_TOKEN_AUTH as string;
    if (!widgetId || !tokenAuth) return;

    const doInit = () => {
      if (!window.initSendOTP) return;
      try {
        window.initSendOTP({
          widgetId,
          tokenAuth,
          exposeMethods: true,
          captchaRenderId: '',        // G1: suppress the built-in MSG91 captcha/popup
          success: (_data: unknown) => {},
          failure: (_error: unknown) => {},
        });
      } catch (err) {
        logger.error('MSG91 initSendOTP threw:', err);
      }
    };

    // G4: check existing script tag — it may still be loading even if the tag is in the DOM
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://verify.msg91.com/otp-provider.js"]');
    if (existing) {
      if (window.initSendOTP) {
        doInit();  // already loaded, reinit immediately
      } else {
        // G4: script tag present but still loading — defer init until it fires
        existing.addEventListener('load', doInit, { once: true });
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
      // G5: remove window globals so stale MSG91 methods are not called after unmount/HMR
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      delete w.initSendOTP;
      delete w.sendOtp;
      delete w.verifyOtp;
      delete w.retryOtp;
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
    const lang = userProfile.preferred_language || 'en';
    const redirectPath = userProfile.role === 'admin' ? `/admin?lang=${lang}`
      : userProfile.role === 'teacher' ? `/teacher?lang=${lang}`
        : `/student?lang=${lang}`;
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

    // Pre-OTP duplicate check removed: it depended on anon RLS access to users.mobile which
    // is not guaranteed. The Edge Function (create-teacher / create-student-self-register) is
    // the authoritative gate for duplicate mobile detection.

    const normalizedPhone = toE164Indian(signUpForm.phone);
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

    if (typeof window.verifyOtp !== 'function') {
      toast({ title: 'OTP Unavailable', description: 'OTP service unavailable. Please refresh and try again.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const normalizedPhone = toE164Indian(signUpForm.phone);

    window.verifyOtp(
      signUpOtp,
      async (data: Record<string, unknown>) => {
        // G9: wrap the entire async callback in try/catch/finally so setLoading(false)
        // is always called and unexpected throws surface as a toast rather than a frozen UI.
        try {
          // MSG91 may return the token under different key names depending on the plan/version
          signUpAccessTokenRef.current = (
            (data?.['access-token'] as string) ||
            (data?.['access_token'] as string) ||
            (data?.['accessToken'] as string) ||
            (data?.['token'] as string) ||
            ''
          );

          if (!signUpAccessTokenRef.current) {
            toast({
              title: 'Verification Error',
              description: 'OTP verified but no access token was returned. Please try again.',
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
              const msg = fnData?.error || error?.message || 'Could not create account. Please try again.';
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
            const msg = fnData?.error || error?.message || 'Could not create account. Please try again.';
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
        toast({
          title: 'OTP Verification Failed',
          description: 'The OTP entered is incorrect or has expired. Please try again or request a new one.',
          variant: 'destructive',
        });
        setLoading(false);
      }
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

    if (typeof window.verifyOtp !== 'function') {
      toast({ title: 'OTP Unavailable', description: 'OTP service unavailable. Please refresh and try again.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    window.verifyOtp(
      firstLoginOtp,
      (data: Record<string, unknown>) => {
        firstLoginAccessTokenRef.current = (
          (data?.['access-token'] as string) ||
          (data?.['access_token'] as string) ||
          (data?.['accessToken'] as string) ||
          (data?.['token'] as string) ||
          ''
        );

        if (!firstLoginAccessTokenRef.current) {
          toast({
            title: 'Verification Error',
            description: 'OTP verified but no access token was returned. Please try again.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        setFirstLoginStep('setpassword');
        setLoading(false);
      },
      (_error: unknown) => {
        toast({
          title: 'OTP Verification Failed',
          description: 'The OTP entered is incorrect or has expired. Please try again or request a new one.',
          variant: 'destructive',
        });
        setLoading(false);
      }
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
      const msg = data?.error || error?.message || 'Could not set password. Please try again.';
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Career Compass</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">an <span className="font-semibold">India Literacy Project</span> initiative</p>
          <p className="text-muted-foreground mt-2">Navigate your career journey</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('welcome')}</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t('signInTab')}</TabsTrigger>
                <TabsTrigger value="signup">{t('signUpTab')}</TabsTrigger>
              </TabsList>

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
                      <Input
                        id="signin-password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={signInForm.password}
                        onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                        required
                      />
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
                      <Input
                        id="firstlogin-newpassword"
                        type="password"
                        autoComplete="new-password"
                        minLength={6}
                        placeholder="Create a password"
                        value={firstLoginForm.newPassword}
                        onChange={(e) => setFirstLoginForm({ ...firstLoginForm, newPassword: e.target.value })}
                        required
                      />
                      {firstLoginForm.newPassword.length > 0 && firstLoginForm.newPassword.length < 6 ? (
                        <p className="text-xs text-red-500">Password must be at least 6 characters</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">At least 6 characters</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstlogin-confirmpassword">Confirm Password</Label>
                      <Input
                        id="firstlogin-confirmpassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                        value={firstLoginForm.confirmPassword}
                        onChange={(e) => setFirstLoginForm({ ...firstLoginForm, confirmPassword: e.target.value })}
                        required
                      />
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
                    {/* Role toggle */}
                    <div className="flex rounded-lg border overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setSignUpForm({ ...signUpForm, role: 'teacher', grade: '', confirmPassword: '' })}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${signUpForm.role === 'teacher' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                      >
                        I am a Teacher
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignUpForm({ ...signUpForm, role: 'student' })}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${signUpForm.role === 'student' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                      >
                        I am a Student
                      </button>
                    </div>

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
                      {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t('password')}</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={6}
                        placeholder={t('createPassword')}
                        value={signUpForm.password}
                        onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                        required
                      />
                      {(() => {
                        const { label, color } = passwordStrength(signUpForm.password);
                        return label
                          ? <p className={`text-xs ${color}`}>{label}</p>
                          : <p className="text-xs text-muted-foreground">At least 6 characters</p>;
                      })()}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Re-enter your password"
                        value={signUpForm.confirmPassword}
                        onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                        required
                      />
                      {signUpForm.confirmPassword.length > 0 && signUpForm.password !== signUpForm.confirmPassword && (
                        <p className="text-xs text-red-500">Passwords do not match</p>
                      )}
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

                    {/* Grade picker — students only */}
                    {signUpForm.role === 'student' && (
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
                    )}

                    {/* Preferred Language */}
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

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Sending OTP...' : t('createAccount')}
                    </Button>
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
