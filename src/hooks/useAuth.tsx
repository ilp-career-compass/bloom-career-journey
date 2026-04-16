import { logger } from '@/lib/logger';
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface AuthUser extends User {
  user_metadata: {
    mobile?: string;
    full_name?: string;
    role?: 'admin' | 'teacher' | 'student';
  };
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (phone: string, password: string) => Promise<{ error: any }>;
  signUp: (
    phone: string,
    password: string,
    fullName: string,
    role: 'teacher' | 'student',
    stateId: string,
    preferredLanguage?: 'en' | 'kn' | 'ta' | 'hi'
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userProfile: any;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  const fetchingProfileRef = useRef<string | null>(null);
  const hasAuthStateRef = useRef(false);
  const authSubscriptionRef = useRef<any>(null);

  logger.log('AuthProvider initialized');

  useEffect(() => {
    logger.log('AuthProvider useEffect running');

    let lastEventTime = 0;
    let lastEventType = '';

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const now = Date.now();

        logger.log('🔔 Auth event:', event, '| hasAuthStateRef:', hasAuthStateRef.current);

        if (hasAuthStateRef.current && event !== 'SIGNED_OUT') {
          logger.log(`🛑 Already authenticated - ignoring ${event} event completely`);
          return;
        }

        if (event === lastEventType && (now - lastEventTime) < 100) {
          logger.log(`⏭️ Ignoring duplicate ${event} event within 100ms`);
          return;
        }

        lastEventTime = now;
        lastEventType = event;

        logger.log('Auth state change:', event, session?.user?.id);

        if (event === 'TOKEN_REFRESHED') {
          logger.log('🔄 Token refreshed event received');
          if (hasAuthStateRef.current) {
            logger.log('✅ Already authenticated, ignoring TOKEN_REFRESHED completely');
            return;
          }
          if (session) {
            setSession(session);
            if (session.user) {
              setUser(session.user as AuthUser);
            }
          }
          return;
        }

        if (event === 'SIGNED_IN') {
          logger.log('✅ SIGNED_IN event, setting up auth state');
          setSession(session);
          setUser(session?.user as AuthUser || null);

          if (session?.user) {
            setTimeout(() => {
              fetchUserProfile(session.user.id, session.user as AuthUser);
            }, 0);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          logger.log('❌ SIGNED_OUT event, clearing auth state');
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        } else {
          logger.log(`⏭️ Ignoring ${event} event - not SIGNED_IN or SIGNED_OUT`);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      logger.log('Initial session check:', session?.user?.id);

      setSession(session);
      setUser(session?.user as AuthUser || null);

      if (session?.user) {
        fetchUserProfile(session.user.id, session.user as AuthUser);
      }
      setLoading(false);
    });

    authSubscriptionRef.current = subscription;
    logger.log('📡 Auth subscription created and stored in ref');

    return () => {
      logger.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    logger.log('🔄 userProfile state changed:', userProfile);
    logger.log('🔄 Current user state:', user);
    logger.log('🔄 Loading state:', loading);

    const hasValidAuth = user !== null && userProfile !== null;
    const wasAuthenticated = hasAuthStateRef.current;
    hasAuthStateRef.current = hasValidAuth;
    logger.log('🔄 hasAuthStateRef updated to:', hasValidAuth);

    if (hasValidAuth && !wasAuthenticated && authSubscriptionRef.current) {
      logger.log('🔒 UNSUBSCRIBING from Supabase auth listener - we have valid auth');
      authSubscriptionRef.current.unsubscribe();
      authSubscriptionRef.current = null;
    }
  }, [userProfile, user, loading]);

  const fetchUserProfile = async (userId: string, userOverride?: AuthUser, forceRefresh?: boolean) => {
    try {
      logger.log('🔍 Fetching user profile for:', userId, forceRefresh ? '(force refresh)' : '');

      if (!forceRefresh) {
        if (fetchingProfileRef.current === userId) {
          logger.log('⏭️ Already fetching profile for this user, skipping duplicate fetch');
          return;
        }

        if (userProfile && userProfile.id === userId) {
          logger.log('✅ Profile already exists for this user, skipping refetch');
          return;
        }
      }

      fetchingProfileRef.current = userId;

      // Fetch profile from users table (works for all roles after phone signIn)
      logger.log('🔄 Fetching fresh profile data from database...');
      const { data: freshProfile, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!dbError && freshProfile) {
        logger.log('✅ Fresh profile data loaded from database:', freshProfile);

        // Fetch role-specific data
        try {
          if (freshProfile.role === 'student') {
            const { data: studentData, error: studentError } = await supabase
              .from('students')
              .select('*')
              .eq('user_id', userId)
              .single();

            if (studentError) {
              logger.warn('Could not fetch student data:', studentError);
              setUserProfile({ ...freshProfile, role: 'student', studentProfile: null });
            } else {
              logger.log('Student data fetched successfully:', studentData);
              setUserProfile({ ...freshProfile, role: 'student', studentProfile: studentData });
            }
          } else if (freshProfile.role === 'teacher') {
            const { data: teacherData, error: teacherError } = await supabase
              .from('teachers')
              .select('*')
              .eq('user_id', userId)
              .single();

            if (teacherError) {
              logger.warn('Could not fetch teacher data:', teacherError);
              setUserProfile({ ...freshProfile, role: 'teacher', teacherProfile: null });
            } else {
              logger.log('Teacher data fetched successfully:', teacherData);
              setUserProfile({ ...freshProfile, role: 'teacher', teacherProfile: teacherData });
            }
          } else {
            setUserProfile(freshProfile);
          }
        } catch (roleDataError) {
          logger.warn('Error fetching role-specific data:', roleDataError);
          setUserProfile(freshProfile);
        }

        fetchingProfileRef.current = null;
        return;
      }

      // Fallback: derive from auth metadata
      logger.log('⚠️ Database fetch failed, falling back to auth metadata');
      const currentUser = userOverride || user;

      if (currentUser && currentUser.user_metadata?.role) {
        const derivedRole = currentUser.user_metadata.role;
        const baseProfile: any = {
          id: userId,
          full_name: currentUser.user_metadata.full_name,
          mobile: currentUser.user_metadata.mobile,
          role: derivedRole,
          state_id: null
        };

        setUserProfile(baseProfile);
        logger.log('✅ Profile set from auth metadata:', baseProfile);

        try {
          if (derivedRole === 'student') {
            const { data: studentData } = await supabase
              .from('students')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();
            if (studentData) setUserProfile((prev: any) => ({ ...prev, studentProfile: studentData }));
          } else if (derivedRole === 'teacher') {
            const { data: teacherData } = await supabase
              .from('teachers')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();
            if (teacherData) setUserProfile((prev: any) => ({ ...prev, teacherProfile: teacherData }));
          }
        } catch { }
      }

      fetchingProfileRef.current = null;
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      const fallbackProfile = { id: userId, role: 'unknown' };
      setUserProfile(fallbackProfile);
      logger.log('Fallback userProfile set due to error:', fallbackProfile);
    } finally {
      fetchingProfileRef.current = null;
    }
  };

  const signIn = async (phone: string, password: string) => {
    try {
      logger.log('🔐 Sign in attempt for phone:', phone);

      const lang = (typeof window !== 'undefined' ? localStorage.getItem('lang') : null) || 'en';

      const signInSuccessToasts: Record<string, { title: string; description: string }> = {
        en: { title: 'Sign in successful! ✨', description: 'Welcome back!' },
        ta: { title: 'வெற்றிகரமாக உள்நுழைந்தீர்கள்! ✨', description: 'மீண்டும் வரவேற்கிறோம்!' },
        kn: { title: 'ಯಶಸ್ವಿಯಾಗಿ ಸೈನ್ ಇನ್ ಆಗಿದೆ! ✨', description: 'ಮತ್ತೆ ಸ್ವಾಗತ!' },
        hi: { title: 'सफलतापूर्वक साइन इन! ✨', description: 'वापस स्वागत है!' },
      };
      const signInFailToasts: Record<string, { title: string }> = {
        en: { title: 'Sign In Failed' },
        ta: { title: 'உள்நுழைவு தோல்வியடைந்தது' },
        kn: { title: 'ಸೈನ್ ಇನ್ ವಿಫಲವಾಗಿದೆ' },
        hi: { title: 'साइन इन विफल' },
      };

      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        phone: phone.trim(),
        password,
      });

      if (error) {
        logger.error('❌ Sign in error:', error);
        const failMsg = signInFailToasts[lang] || signInFailToasts['en'];
        toast({
          title: failMsg.title,
          description: error.message || "Invalid mobile number or password",
          variant: "destructive",
        });
        return { error };
      }

      if (signInData?.user) {
        logger.log('✅ Supabase Auth successful:', signInData.user);
        setUser(signInData.user as AuthUser);
        await fetchUserProfile(signInData.user.id, signInData.user as AuthUser);
        const successMsg = signInSuccessToasts[lang] || signInSuccessToasts['en'];
        toast({ title: successMsg.title, description: successMsg.description });
        return { error: null };
      }

      return { error: new Error('Sign in failed') };
    } catch (error) {
      logger.error('❌ Sign in error:', error);
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (
    phone: string,
    password: string,
    fullName: string,
    role: 'teacher' | 'student',
    stateId: string,
    preferredLanguage: 'en' | 'kn' | 'ta' | 'hi' = 'en'
  ) => {
    try {
      logger.log('Starting signUp process:', { phone, fullName, role, stateId, preferredLanguage });

      // Check if phone already exists
      const { data: existingUser, error: mobileCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('mobile', phone)
        .maybeSingle();

      if (mobileCheckError) {
        logger.error('Error checking mobile:', mobileCheckError);
        return { error: { message: 'Failed to check mobile availability' } };
      }

      if (existingUser) {
        return { error: { message: 'Mobile number already registered' } };
      }

      // Create Supabase auth user with phone
      logger.log('Creating Supabase auth user with phone:', phone);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        phone,
        password,
        options: {
          data: {
            mobile: phone,
            full_name: fullName,
            role,
            preferred_language: preferredLanguage,
          }
        }
      });

      if (authError) {
        logger.error('Supabase auth error:', authError);
        toast({
          title: 'Registration failed',
          description: authError.message,
          variant: 'destructive',
        });
        return { error: authError };
      }

      logger.log('Supabase auth user created:', authData.user?.id);

      if (authData.user) {
        // Insert into public.users
        const { error: userInsertError } = await supabase.from('users').insert({
          id: authData.user.id,
          full_name: fullName,
          mobile: phone,
          role,
          state_id: stateId,
          preferred_language: preferredLanguage || 'en',
          password_hash: 'managed_by_supabase_auth',
        });

        if (userInsertError) {
          logger.error('Error creating user profile:', userInsertError);
          toast({
            title: 'Registration failed',
            description: 'Failed to create user profile. Please contact support.',
            variant: 'destructive',
          });
          return { error: userInsertError };
        }

        // Create role-specific profile
        if (role === 'student') {
          const { error: studentError } = await supabase
            .from('students')
            .insert({
              user_id: authData.user.id,
              class_id: null,
              teacher_id: null,
              enrollment_status: 'pending',
            });

          if (studentError) {
            logger.error('Error creating student profile:', studentError);
            // Non-fatal: account is created, student profile can be set up by teacher
          }
        }

        // Auto sign-in
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));

          const { error: signInError } = await supabase.auth.signInWithPassword({ phone, password });

          if (signInError) {
            logger.error('Auto sign-in failed:', signInError);
            toast({
              title: 'Registration successful',
              description: `Welcome to CareerCompass, ${fullName}! Please sign in with your mobile number and password.`,
            });
          } else {
            logger.log('Auto sign-in successful');
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session?.user) {
              const authUser = sessionData.session.user as AuthUser;
              setUser(authUser);
              setSession(sessionData.session);
              await fetchUserProfile(authUser.id, authUser);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            toast({
              title: 'Registration successful',
              description: `Welcome to CareerCompass, ${fullName}! You're now signed in.`,
            });
          }
        } catch (signInError) {
          logger.error('Auto sign-in error:', signInError);
          toast({
            title: 'Registration successful',
            description: `Welcome to CareerCompass, ${fullName}! Please sign in manually.`,
          });
        }
      }

      return { error: null };
    } catch (error) {
      logger.error('SignUp error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    // Best-effort Supabase sign out — don't gate local cleanup on this
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error('Supabase signOut error (non-blocking):', error.message);
    }

    // Always clear local auth state regardless of Supabase result
    setUser(null);
    setSession(null);
    setUserProfile(null);
    setLoading(false);
  };

  const refreshUserProfile = async () => {
    if (user?.id) {
      logger.log('🔄 Refreshing user profile from database...');
      try {
        await fetchUserProfile(user.id, undefined, true);
        logger.log('✅ User profile refreshed successfully');
      } catch (error) {
        logger.error('Error refreshing user profile:', error);
      }
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    userProfile,
    refreshUserProfile,
  };

  logger.log('AuthProvider rendering with value:', {
    user: !!user,
    loading,
    userProfile: userProfile ? {
      id: userProfile.id,
      role: userProfile.role,
      hasStudentProfile: !!userProfile.studentProfile,
      hasTeacherProfile: !!userProfile.teacherProfile
    } : null
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
