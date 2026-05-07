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
  refreshingProfile: boolean;
  signIn: (phone: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userProfile: any;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingProfile, setRefreshingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  const fetchingProfileRef = useRef<string | null>(null);

  logger.log('AuthProvider initialized');

  useEffect(() => {
    logger.log('AuthProvider useEffect running');

    // Flag set to true once getSession() resolves — prevents the synthetic
    // SIGNED_IN that Supabase fires on page load from double-processing the
    // initial session (getSession already handles that path).
    let initialLoadDone = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.log('🔔 Auth event:', event, session?.user?.id);

        // Supabase fires SIGNED_IN immediately when a stored session is restored.
        // getSession() below is already handling that, so skip this duplicate.
        if (event === 'SIGNED_IN' && !initialLoadDone) {
          logger.log('⏭️ Skipping pre-load SIGNED_IN — getSession handles initial session');
          return;
        }

        if (event === 'SIGNED_IN') {
          setSession(session);
          setUser(session?.user as AuthUser || null);
          if (session?.user) {
            setTimeout(() => {
              fetchUserProfile(session.user.id, session.user as AuthUser);
            }, 0);
          }
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          // Keep React state in sync when Supabase silently refreshes the token
          if (session) {
            setSession(session);
            setUser(session.user as AuthUser);
          }
        } else if (event === 'USER_UPDATED') {
          // Re-fetch profile so any server-side changes are reflected in the UI
          if (session?.user) {
            fetchUserProfile(session.user.id, session.user as AuthUser, true);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      logger.log('Initial session check:', session?.user?.id);
      initialLoadDone = true;
      setSession(session);
      setUser(session?.user as AuthUser || null);
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user as AuthUser);
      }
      setLoading(false);
    });

    return () => {
      logger.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

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
        if (typeof window !== 'undefined' && freshProfile.preferred_language) {
          localStorage.setItem('lang', freshProfile.preferred_language);
        }

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
        const rawLang = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
        const cachedLang = (rawLang === 'en' || rawLang === 'kn' || rawLang === 'ta' || rawLang === 'hi') ? rawLang : 'en';
        const baseProfile: any = {
          id: userId,
          full_name: currentUser.user_metadata.full_name,
          mobile: currentUser.user_metadata.mobile,
          role: derivedRole,
          state_id: null,
          preferred_language: cachedLang,
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
      // Do not set a partial profile — keep userProfile null so ProtectedRoute redirects to /auth
    } finally {
      fetchingProfileRef.current = null;
    }
  };

  const signIn = async (phone: string, password: string) => {
    try {
      logger.log('🔐 Sign in attempt for phone:', phone);

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
        const failLang = (typeof window !== 'undefined' ? localStorage.getItem('lang') : null) || 'en';
        const failMsg = signInFailToasts[failLang] || signInFailToasts['en'];
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
        // fetchUserProfile writes the user's preferred_language to localStorage
        await fetchUserProfile(signInData.user.id, signInData.user as AuthUser);
        const successLang = (typeof window !== 'undefined' ? localStorage.getItem('lang') : null) || 'en';
        const successMsg = signInSuccessToasts[successLang] || signInSuccessToasts['en'];
        toast({ title: successMsg.title, description: successMsg.description });
        return { error: null };
      }

      return { error: new Error('Sign in failed') };
    } catch (error) {
      logger.error('❌ Sign in error:', error);
      const catchLang = (typeof window !== 'undefined' ? localStorage.getItem('lang') : null) || 'en';
      const catchTitles: Record<string, string> = {
        en: 'Sign in failed',
        kn: 'ಸೈನ್ ಇನ್ ವಿಫಲವಾಗಿದೆ',
        ta: 'உள்நுழைவு தோல்வியடைந்தது',
        hi: 'साइन इन विफल',
      };
      const catchDescs: Record<string, string> = {
        en: 'An unexpected error occurred. Please try again.',
        kn: 'ಅನಿರೀಕ್ಷಿತ ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
        ta: 'எதிர்பாராத பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.',
        hi: 'एक अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें।',
      };
      toast({
        title: catchTitles[catchLang] || catchTitles.en,
        description: catchDescs[catchLang] || catchDescs.en,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signOut = async () => {
    const signOutToasts: Record<string, string> = {
      en: 'Logged out successfully',
      kn: 'ಯಶಸ್ವಿಯಾಗಿ ಲಾಗ್ ಔಟ್ ಆಗಿದೆ',
      ta: 'வெளியேறிவிட்டீர்கள்',
      hi: 'सफलतापूर्वक लॉग आउट हो गए',
    };
    // Read lang before clearing state
    const outLang = (typeof window !== 'undefined' ? localStorage.getItem('lang') : null) || 'en';

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
    try { localStorage.removeItem('lang'); } catch { }

    toast({ title: signOutToasts[outLang] || signOutToasts.en });
  };

  const refreshUserProfile = async () => {
    if (user?.id) {
      logger.log('🔄 Refreshing user profile from database...');
      setRefreshingProfile(true);
      try {
        await fetchUserProfile(user.id, undefined, true);
        logger.log('✅ User profile refreshed successfully');
      } catch (error) {
        logger.error('Error refreshing user profile:', error);
      } finally {
        setRefreshingProfile(false);
      }
    }
  };

  const value = {
    user,
    session,
    loading,
    refreshingProfile,
    signIn,
    signOut,
    userProfile,
    refreshUserProfile,
  };

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
