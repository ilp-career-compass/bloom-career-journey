import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
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

function toE164Indian(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return phone;
}

function isValidE164(phone: string): boolean {
  return /^\+91\d{10}$/.test(phone) || /^\d{10}$/.test(phone);
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

  useEffect(() => {
    logger.log('AuthPage: useEffect triggered, calling loadStates');
    loadStates();
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

  const handleSignUp = async (e: React.FormEvent) => {
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

    if (signUpForm.role === 'student') {
      if (!signUpForm.grade) {
        toast({ title: 'Sign Up Failed', description: 'Please select your grade.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Student self-registration via create-student-self-register Edge Function
      const normalizedPhone = toE164Indian(signUpForm.phone);
      const { data, error } = await supabase.functions.invoke('create-student-self-register', {
        body: {
          fullName: signUpForm.fullName,
          phone: normalizedPhone,
          password: signUpForm.password,
          grade: signUpForm.grade,
          stateId: signUpForm.stateId,
          preferredLanguage: signUpForm.preferredLanguage,
        },
      });

      if (error || data?.error) {
        const msg = data?.error || error?.message || 'Could not create account. Please try again.';
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
    const normalizedPhone = toE164Indian(signUpForm.phone);
    const { data, error } = await supabase.functions.invoke('create-teacher', {
      body: {
        fullName: signUpForm.fullName,
        phone: normalizedPhone,
        password: signUpForm.password,
        stateId: signUpForm.stateId,
        preferredLanguage: signUpForm.preferredLanguage,
      },
    });

    if (error || data?.error) {
      const msg = data?.error || error?.message || 'Could not create account. Please try again.';
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
              </TabsContent>

              <TabsContent value="signup">
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
                    {loading ? 'Creating Account...' : t('createAccount')}
                  </Button>
                </form>
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
