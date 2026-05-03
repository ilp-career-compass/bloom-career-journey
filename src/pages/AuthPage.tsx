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
  return /^\+91\d{10}$/.test(phone) || /^\d{10}$/.test(phone);
}

// Defined outside AuthPage so useRef is stable across parent re-renders
function OtpScreen({
  phone,
  otpValue,
  onOtpChange,
  onVerify,
  verifyLoading,
}: {
  phone: string
  otpValue: string
  onOtpChange: (v: string) => void
  onVerify: (e: React.FormEvent) => void
  verifyLoading: boolean
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const chars = Array.from({ length: 4 }, (_, i) => otpValue[i] ?? '');
    chars[index] = digit;
    onOtpChange(chars.join(''));
    if (digit && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !(otpValue[index] ?? '') && index > 0) {
      const chars = Array.from({ length: 4 }, (_, i) => otpValue[i] ?? '');
      chars[index - 1] = '';
      onOtpChange(chars.join(''));
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    onOtpChange(pasted);
    inputRefs.current[Math.min(pasted.length, 3)]?.focus();
  };

  return (
    <form onSubmit={onVerify} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter the 4-digit OTP sent to{' '}
        <span className="font-medium">{toE164Indian(phone)}</span>
      </p>
      <div className="flex justify-center gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={otpValue[i] ?? ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className="w-12 h-12 text-center text-lg font-semibold border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          />
        ))}
      </div>
      <Button type="submit" className="w-full" disabled={verifyLoading || otpValue.length < 4}>
        {verifyLoading ? 'Verifying...' : 'Verify OTP'}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => window.retryOtp(null)}
        disabled={verifyLoading}
      >
        Resend OTP
      </Button>
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
    fullName: '',
    stateId: '',
    grade: '',
    preferredLanguage: 'en' as 'en' | 'kn' | 'ta' | 'hi'
  });
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);

  // Sign Up OTP step: 'form' shows the registration form, 'otp' shows the OTP input
  const [signUpStep, setSignUpStep] = useState<'form' | 'otp'>('form');
  const [signUpOtp, setSignUpOtp] = useState('');

  const [signInMode, setSignInMode] = useState<'signin' | 'firstlogin'>('signin');
  // First Login steps: phone → otp → setpassword
  const [firstLoginStep, setFirstLoginStep] = useState<'phone' | 'otp' | 'setpassword'>('phone');
  const [firstLoginForm, setFirstLoginForm] = useState({ phone: '', newPassword: '', confirmPassword: '' });
  const [firstLoginOtp, setFirstLoginOtp] = useState('');

  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    logger.log('AuthPage: useEffect triggered, calling loadStates');
    loadStates();
  }, []);

  // Load MSG91 OTP widget script and initialise with widget credentials
  useEffect(() => {
    const widgetId = import.meta.env.VITE_MSG91_WIDGET_ID as string;
    const tokenAuth = import.meta.env.VITE_MSG91_TOKEN_AUTH as string;
    if (!widgetId || !tokenAuth) return;

    const script = document.createElement('script');
    script.src = 'https://verify.msg91.com/otp-provider.js';
    script.async = true;
    script.onload = () => {
      console.log('MSG91 init config:', { widgetId, tokenAuth, hasWidgetId: !!widgetId, hasTokenAuth: !!tokenAuth });
      try {
        window.initSendOTP({
          widgetId,
          tokenAuth,
          exposeMethods: true,
          success: (data: unknown) => {
            console.log('MSG91 widget init success:', data);
          },
          failure: (error: unknown) => {
            console.log('MSG91 widget init failure:', error);
          },
        });
      } catch (err) {
        console.error('MSG91 initSendOTP threw:', err);
      }
    };
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  const loadStates = async () => {
    logger.log('Loading states...');
    setLoadingStates(true);
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
        setStates([
          { state_id: 'fallback-1', state_name: 'ILP-Tamil Nadu', state_code: 'ILP-TN', org_name: 'ILP Foundation' },
          { state_id: 'fallback-2', state_name: 'ILP-Telangana', state_code: 'ILP-TG', org_name: 'ILP Foundation' },
          { state_id: 'fallback-3', state_name: 'ILP-Karnataka', state_code: 'ILP-KA', org_name: 'ILP Foundation' },
          { state_id: 'fallback-4', state_name: 'ILP-Maharashtra', state_code: 'ILP-MH', org_name: 'ILP Foundation' },
        ]);
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
    const redirectPath = userProfile.role === 'admin' ? '/admin'
      : userProfile.role === 'teacher' ? '/teacher'
        : `/student?lang=${userProfile.preferred_language || 'en'}`;
    logger.log('AuthPage: Redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(toE164Indian(signInForm.phone), signInForm.password);
    setLoading(false);
    if (error) {
      logger.error('Sign in error:', error);
      toast({ title: 'Sign In Failed', description: error.message || 'Invalid mobile number or password. Please try again.', variant: 'destructive' });
    }
  };

  // Step 1 of Sign Up: validate form, dispatch OTP, show OTP input screen
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

    // MSG91 expects 91XXXXXXXXXX (no '+')
    const msg91Mobile = toE164Indian(signUpForm.phone).replace('+', '');
    window.sendOtp(
      msg91Mobile,
      (data) => {
        logger.log('MSG91 sendOtp success:', JSON.stringify(data));
        setSignUpOtp('');
        setSignUpStep('otp');
        setLoading(false);
      },
      (error) => {
        logger.error('MSG91 sendOtp failed:', JSON.stringify(error));
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
        console.log('MSG91 verifyOtp raw data:', JSON.stringify(data));
        logger.log('MSG91 verifyOtp success data:', JSON.stringify(data));
        // MSG91 may return the token under different key names depending on the plan/version
        accessTokenRef.current = (
          (data?.['access-token'] as string) ||
          (data?.['access_token'] as string) ||
          (data?.['accessToken'] as string) ||
          (data?.['token'] as string) ||
          (data?.['message'] as string) ||
          ''
        );

        if (!accessTokenRef.current) {
          toast({
            title: 'Verification Error',
            description: 'OTP verified but no access token was returned. Please try again.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        console.log('Sending accessToken to Edge Function:', accessTokenRef.current?.substring(0, 50) + '...');
        console.log('Supabase anon key present:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

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
              accessToken: accessTokenRef.current ?? '',
            },
          });

          if (error || fnData?.error) {
            console.error('Edge Function error:', error);
            const msg = fnData?.error || error?.message || 'Could not create account. Please try again.';
            logger.error('Student sign up error:', msg);
            toast({ title: 'Sign Up Failed', description: msg, variant: 'destructive' });
            setLoading(false);
            return;
          }

          // Sign in immediately after successful registration
          const { error: signInError } = await signIn(normalizedPhone, signUpForm.password);
          setLoading(false);
          if (signInError) {
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
            accessToken: accessTokenRef.current ?? '',
          },
        });

        if (error || fnData?.error) {
          console.error('Edge Function error:', error);
          const msg = fnData?.error || error?.message || 'Could not create account. Please try again.';
          logger.error('Teacher sign up error:', msg);
          toast({ title: 'Sign Up Failed', description: msg, variant: 'destructive' });
          setLoading(false);
          return;
        }

        // Sign in immediately after successful registration
        const { error: signInError } = await signIn(normalizedPhone, signUpForm.password);
        setLoading(false);
        if (signInError) {
          toast({ title: 'Account created', description: 'Please sign in with your mobile number and password.', variant: 'default' });
        }
      },
      (_error: unknown) => {
        toast({
          title: 'OTP Verification Failed',
          description: 'The OTP you entered is incorrect. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    );
  };

  // Step 1 of First Login: validate phone, dispatch OTP, show OTP input screen
  const handleFirstLoginOtp = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidE164(firstLoginForm.phone)) {
      toast({ title: 'Invalid Mobile', description: 'Please enter a 10-digit mobile number.', variant: 'destructive' });
      return;
    }

    if (typeof window.sendOtp !== 'function') {
      toast({ title: 'OTP Unavailable', description: 'OTP service unavailable. Please refresh and try again.', variant: 'destructive' });
      return;
    }

    const msg91Mobile = toE164Indian(firstLoginForm.phone).replace('+', '');
    window.sendOtp(
      msg91Mobile,
      (data) => {
        logger.log('MSG91 sendOtp success:', JSON.stringify(data));
        setFirstLoginOtp('');
        setFirstLoginStep('otp');
      },
      (error) => {
        logger.error('MSG91 sendOtp failed:', JSON.stringify(error));
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
        console.log('MSG91 verifyOtp raw data:', JSON.stringify(data));
        logger.log('MSG91 verifyOtp success data:', JSON.stringify(data));
        accessTokenRef.current = (
          (data?.['access-token'] as string) ||
          (data?.['access_token'] as string) ||
          (data?.['accessToken'] as string) ||
          (data?.['token'] as string) ||
          (data?.['message'] as string) ||
          ''
        );

        if (!accessTokenRef.current) {
          toast({
            title: 'Verification Error',
            description: 'OTP verified but no access token was returned. Please try again.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        console.log('First Login accessToken:', accessTokenRef.current?.substring(0, 50) + '...');
        setFirstLoginStep('setpassword');
        setLoading(false);
      },
      (_error: unknown) => {
        toast({
          title: 'OTP Verification Failed',
          description: 'The OTP you entered is incorrect. Please try again.',
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
        access_token: accessTokenRef.current ?? '',
      },
    });

    if (error || data?.error) {
      const msg = data?.error || error?.message || 'Could not set password. Please try again.';
      logger.error('First login set-password error:', msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { error: signInError } = await signIn(normalizedPhone, firstLoginForm.newPassword);
    setLoading(false);
    if (signInError) {
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
                {/* Sign In / First Login mode toggle */}
                <div className="flex rounded-lg border overflow-hidden mb-4">
                  <button
                    type="button"
                    onClick={() => { setSignInMode('signin'); setFirstLoginStep('phone'); }}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${signInMode === 'signin' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSignInMode('firstlogin'); setFirstLoginStep('phone'); }}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${signInMode === 'firstlogin' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                  >
                    First Login
                  </button>
                </div>

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
                        placeholder="Enter your password"
                        value={signInForm.password}
                        onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Signing In...' : t('signInBtn')}
                    </Button>
                  </form>
                ) : firstLoginStep === 'phone' ? (
                  <form onSubmit={handleFirstLoginOtp} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      First time? Verify your mobile number to set a password.
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
                  </form>
                ) : firstLoginStep === 'otp' ? (
                  <OtpScreen
                    phone={firstLoginForm.phone}
                    otpValue={firstLoginOtp}
                    onOtpChange={setFirstLoginOtp}
                    onVerify={handleFirstLoginVerifyOtp}
                    verifyLoading={loading}
                  />
                ) : (
                  <form onSubmit={handleSetPassword} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Mobile verified: <span className="font-medium">{toE164Indian(firstLoginForm.phone)}</span>
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="firstlogin-newpassword">New Password</Label>
                      <Input
                        id="firstlogin-newpassword"
                        type="password"
                        placeholder="Create a password"
                        value={firstLoginForm.newPassword}
                        onChange={(e) => setFirstLoginForm({ ...firstLoginForm, newPassword: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstlogin-confirmpassword">Confirm Password</Label>
                      <Input
                        id="firstlogin-confirmpassword"
                        type="password"
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
                    phone={signUpForm.phone}
                    otpValue={signUpOtp}
                    onOtpChange={setSignUpOtp}
                    onVerify={handleSignUpVerifyOtp}
                    verifyLoading={loading}
                  />
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    {/* Role toggle */}
                    <div className="flex rounded-lg border overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setSignUpForm({ ...signUpForm, role: 'teacher', grade: '' })}
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
                        onChange={(e) => setSignUpForm({ ...signUpForm, fullName: e.target.value })}
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
                        placeholder={t('createPassword')}
                        value={signUpForm.password}
                        onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                        required
                      />
                    </div>
                    {/* State Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="state">{t('state')}</Label>
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
                            <>
                              {loadingStates ? null : (
                                <div className="px-3 py-2 text-sm text-muted-foreground">No states available</div>
                              )}
                            </>
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
