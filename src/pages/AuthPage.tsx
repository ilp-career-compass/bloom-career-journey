import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Users, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StateInfo, SchoolClass } from '@/integrations/supabase/types';
import { useLocation } from 'react-router-dom';

export default function AuthPage() {
  console.log('AuthPage: Component rendering');
  
  const { user, userProfile, signIn, signUp } = useAuth();
  const location = useLocation();
  // Auth page always displays in English (registration and login must be in English)
  const lang = 'en' as const;

  // Auth page always displays in English - strings simplified to single language
  const strings: Record<string, string> = {
    welcome: 'Welcome',
    signInTab: 'Sign In',
    signUpTab: 'Sign Up',
    emailOrMobile: 'Email or Mobile Number',
    password: 'Password',
    signInBtn: 'Sign In',
    fullName: 'Full Name',
    emailOrMobile2: 'Email Address / Mobile Number',
    createPassword: 'Create a password',
    role: 'Role',
    state: 'State *',
    class: 'Class *',
    createAccount: 'Create Account',
    student: 'Student',
    teacher: 'Teacher',
    preferredLanguage: 'Preferred language',
  };
  const t = (k: string) => strings[k] || k;
  const [signInForm, setSignInForm] = useState({ identifier: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({ 
    identifier: '', 
    password: '', 
    fullName: '', 
    role: 'student' as 'teacher' | 'student',
    stateId: '',
    classId: '',
    preferredLanguage: 'en' as 'en' | 'kn' | 'ta'
  });
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);

  // Load states on component mount
  useEffect(() => {
    console.log('AuthPage: useEffect triggered, calling loadStates');
    loadStates();
  }, []);

  // Load classes when state is selected
  useEffect(() => {
    if (signUpForm.stateId) {
      loadClasses(signUpForm.stateId);
    } else {
      setClasses([]);
    }
  }, [signUpForm.stateId]);

  // Load states from database
  const loadStates = async () => {
    console.log('Loading states...');
    setLoadingStates(true);
    try {
      // Attempt 1: Full query with organization data
      let { data, error } = await supabase
        .from('states')
        .select('id, state_name, state_code, org_id, orgs(name)')
        .order('state_name');
      if (error) {
        console.warn('Full state query failed, retrying with basic fields:', error);
        // Attempt 2: Basic fields only
        const retry = await supabase
          .from('states')
          .select('id, state_name, org_id, orgs(name)')
          .order('state_name');
        data = retry.data as any[] | null;
        error = retry.error as any;
      }
      if (error) {
        console.error('State query failed after retry:', error);
        console.log('🔄 States table may not exist, using fallback data');
        // As a final fallback, populate a comprehensive list so the page works
        setStates([
          { state_id: 'fallback-1', state_name: 'ILP-Tamil Nadu', state_code: 'ILP-TN', org_name: 'ILP Foundation' },
          { state_id: 'fallback-2', state_name: 'ILP-Telangana', state_code: 'ILP-TG', org_name: 'ILP Foundation' },
          { state_id: 'fallback-3', state_name: 'ILP-Karnataka', state_code: 'ILP-KA', org_name: 'ILP Foundation' },
          { state_id: 'fallback-4', state_name: 'ILP-Maharashtra', state_code: 'ILP-MH', org_name: 'ILP Foundation' },
        ]);
        return;
      }
      console.log('Raw states data received:', data);
      const rawStates = (data || []).filter((s: any) => s && s.id && s.state_name);
      console.log('Filtered states:', rawStates);
      const uniqueStates = Array.from(new Map(rawStates.map((s: any) => [s.id, s])).values());
      const statesData = uniqueStates.map((state: any) => ({
        state_id: String(state.id),
        state_name: String(state.state_name),
        state_code: String((state as any).state_code || ''),
        org_name: String((state as any).orgs?.name || '')
      }));
      console.log('Final states data:', statesData);
      setStates(statesData);
    } catch (error) {
      console.error('Error loading states:', error);
      setStates([]);
    } finally {
      setLoadingStates(false);
    }
  };

  // Load classes for selected state
  const loadClasses = async (stateId: string) => {
    try {
      console.log('Loading classes for state:', stateId);
      
      // Check if it's a fallback state
      if (stateId.startsWith('fallback-')) {
        console.log('🔄 Using fallback classes for fallback state');
        const fallbackClasses = [
          { class_id: 'fallback-class-1', class_name: 'Class 8' },
          { class_id: 'fallback-class-2', class_name: 'Class 9' },
          { class_id: 'fallback-class-3', class_name: 'Class 10' },
          { class_id: 'fallback-class-4', class_name: 'Class 11' },
          { class_id: 'fallback-class-5', class_name: 'Class 12' },
        ];
        setClasses(fallbackClasses);
        return;
      }
      
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('state_id', stateId)
        .order('name');
      
      if (error) {
        console.error('Error loading classes:', error);
        setClasses([]);
        return;
      }
      
      console.log('Classes data received:', data);
      const rawClasses = (data || []).filter((r: any) => r && r.id && r.name);
      const uniqueClasses = Array.from(new Map(rawClasses.map((r: any) => [r.id, r])).values());
      const classesData = uniqueClasses.map((row: any) => ({
        class_id: String(row.id),
        class_name: String(row.name),
      }));
      
      console.log('Processed classes data:', classesData);
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (user && userProfile) {
      console.log('AuthPage: User and profile available, redirecting...', {
        role: userProfile.role,
        userId: user.id
      });
      // This effect will trigger a re-render with Navigate component
    }
  }, [user, userProfile]);

  if (user && userProfile) {
    const redirectPath = userProfile.role === 'admin' ? '/admin' 
                        : userProfile.role === 'teacher' ? '/teacher'
                        : `/student?lang=${userProfile.preferred_language || 'en'}`;
    console.log('AuthPage: Redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(signInForm.identifier, signInForm.password);
    setLoading(false);
    if (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate required fields based on role
    if (!signUpForm.stateId) {
      console.error('State selection is required');
      setLoading(false);
      return;
    }
    
    if (signUpForm.role === 'student' && !signUpForm.classId) {
      console.error('Class selection is required for students');
      setLoading(false);
      return;
    }
    
    // Determine if identifier is email or mobile
    const isEmail = signUpForm.identifier.includes('@');
    const email = isEmail ? signUpForm.identifier : null;
    const mobile = !isEmail ? signUpForm.identifier : null;
    
    const { error } = await signUp(
      mobile, 
      email, 
      signUpForm.password, 
      signUpForm.fullName, 
      signUpForm.role,
      signUpForm.stateId,
      signUpForm.classId,
      signUpForm.preferredLanguage
    );
    setLoading(false);
    if (error) {
      console.error('Sign up error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">CareerCompass</h1>
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
                    <Label htmlFor="signin-identifier">{t('emailOrMobile')}</Label>
                    <Input
                      id="signin-identifier"
                      type="text"
                      placeholder="Enter your email or mobile number"
                      value={signInForm.identifier}
                      onChange={(e) => setSignInForm({ ...signInForm, identifier: e.target.value })}
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
                    <Label htmlFor="signup-identifier">{t('emailOrMobile2')}</Label>
                    <Input
                      id="signup-identifier"
                      type="text"
                      placeholder="Enter your email address or mobile number"
                      value={signUpForm.identifier}
                      onChange={(e) => setSignUpForm({ ...signUpForm, identifier: e.target.value })}
                      required
                    />
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
                  <div className="space-y-2">
                    <Label htmlFor="role">{t('role')}</Label>
                    <Select value={signUpForm.role} onValueChange={(value: 'teacher' | 'student') => setSignUpForm({ ...signUpForm, role: value, classId: '', stateId: '' })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            {t('student')}
                          </div>
                        </SelectItem>
                        <SelectItem value="teacher">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {t('teacher')}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* State Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="state">{t('state')}</Label>
                    <Select 
                      value={signUpForm.stateId} 
                      onValueChange={(value) => setSignUpForm({ ...signUpForm, stateId: value, classId: '' })}
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

                  {/* Class Selection - Only for Students */}
                  {signUpForm.role === 'student' && (
                    <div className="space-y-2">
                      <Label htmlFor="class">{t('class')}</Label>
                      <Select 
                        value={signUpForm.classId} 
                        onValueChange={(value) => setSignUpForm({ ...signUpForm, classId: value })}
                        disabled={!signUpForm.stateId || classes.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={!signUpForm.stateId ? "Select state first" : classes.length === 0 ? "No classes available" : "Select your class"} />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((classItem) => (
                            <SelectItem key={classItem.class_id} value={classItem.class_id}>
                              {classItem.class_name}
                            </SelectItem>
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
                      onValueChange={(value: 'en' | 'kn' | 'ta') => setSignUpForm({ ...signUpForm, preferredLanguage: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="kn">Kannada</SelectItem>
                        <SelectItem value="ta">Tamil</SelectItem>
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
  );
}