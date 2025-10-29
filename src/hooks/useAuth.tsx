import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface AuthUser extends User {
  user_metadata: {
    mobile?: string;
    email?: string;
    full_name?: string;
    role?: 'admin' | 'teacher' | 'student';
  };
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: any }>;
  signUp: (
    mobile: string | null, 
    email: string, 
    password: string, 
    fullName: string, 
    role: 'teacher' | 'student',
    stateId: string,
    classId?: string
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
  const [isCustomAuth, setIsCustomAuth] = useState(false);
  const { toast} = useToast();
  
  // Use a ref to track if we're currently fetching a profile
  const fetchingProfileRef = useRef<string | null>(null);
  
  // Use a ref to track if we have a valid authenticated state
  const hasAuthStateRef = useRef(false);
  
  // Use a ref to store the subscription so we can unsubscribe when we have auth
  const authSubscriptionRef = useRef<any>(null);

  console.log('AuthProvider initialized');

  // Restore custom auth state from localStorage
  useEffect(() => {
    const savedCustomAuth = localStorage.getItem('customAuth');
    const savedUser = localStorage.getItem('customUser');
    const savedProfile = localStorage.getItem('customProfile');
    
    if (savedCustomAuth === 'true' && savedUser && savedProfile) {
      console.log('🔄 Restoring custom auth state from localStorage');
      try {
        const parsedUser = JSON.parse(savedUser);
        const parsedProfile = JSON.parse(savedProfile);
        
        setIsCustomAuth(true);
        setUser(parsedUser);
        setUserProfile(parsedProfile);
        
        // Also restore the mock session
        const mockSession = {
          user: parsedUser,
          access_token: 'custom-auth-token',
          refresh_token: 'custom-auth-refresh',
          expires_at: Date.now() + (24 * 60 * 60 * 1000),
          token_type: 'bearer'
        } as Session;
        setSession(mockSession);
        
        setLoading(false);
        console.log('✅ Custom auth state restored successfully');
      } catch (error) {
        console.error('❌ Failed to restore custom auth state:', error);
        // Clear invalid data
        localStorage.removeItem('customAuth');
        localStorage.removeItem('customUser');
        localStorage.removeItem('customProfile');
      }
    }
  }, []);

  // Monitor userProfile changes for debugging and update hasAuthStateRef
  useEffect(() => {
    console.log('🔄 userProfile state changed:', userProfile);
    console.log('🔄 Current user state:', user);
    console.log('🔄 Loading state:', loading);
    console.log('🔄 Custom auth state:', isCustomAuth);
    
    // Update the ref to track if we have valid auth state
    const hasValidAuth = user !== null && userProfile !== null;
    const wasAuthenticated = hasAuthStateRef.current;
    hasAuthStateRef.current = hasValidAuth;
    console.log('🔄 hasAuthStateRef updated to:', hasValidAuth);
    
    // CRITICAL: Unsubscribe from auth listener once we have valid auth
    // This prevents Supabase from interfering with our authenticated state
    if (hasValidAuth && !wasAuthenticated && authSubscriptionRef.current) {
      console.log('🔒 UNSUBSCRIBING from Supabase auth listener - we have valid auth');
      authSubscriptionRef.current.unsubscribe();
      authSubscriptionRef.current = null;
    }
  }, [userProfile, user, loading, isCustomAuth]);

  // Test database connection and migration
  const testDatabase = async () => {
    try {
      console.log('Testing database connection...');
      
      // Test basic connection
      const { data: basicTest, error: basicError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (basicError) {
        console.error('Basic database test failed:', basicError);
        return false;
      }
      
      console.log('Basic database connection successful');
      
      // Test if email column exists
      const { data: emailTest, error: emailError } = await supabase
        .from('users')
        .select('email')
        .limit(1);
      
      if (emailError) {
        console.error('Email column test failed:', emailError);
        console.log('This suggests the migration has not been applied');
        return false;
      }
      
      console.log('Email column exists - migration appears to be applied');
      
      // Test if mobile column allows nulls
      const { data: mobileTest, error: mobileError } = await supabase
        .from('users')
        .select('mobile')
        .limit(1);
      
      if (mobileError) {
        console.error('Mobile column test failed:', mobileError);
        return false;
      }
      
      console.log('Mobile column test successful');
      console.log('Database connection and migration test successful');
      return true;
    } catch (error) {
      console.error('Database test error:', error);
      return false;
    }
  };

  // Create user profile with robust retries and diagnostics
  const createUserProfile = async (userData: any) => {
    try {
      console.log('Attempting to create user profile with data:', userData);

      // 1) First attempt: full insert
      let { error: insertError } = await supabase.from('users').insert(userData);
      if (!insertError) {
        console.log('User profile created successfully via direct insert');
        return { success: true, error: null };
      }

      console.warn('Direct insert failed:', {
        code: (insertError as any)?.code,
        message: (insertError as any)?.message,
        details: (insertError as any)?.details,
        hint: (insertError as any)?.hint,
      });

      // 2) If FK violation on state_id (23503), retry without state_id (last resort)
      const code = (insertError as any)?.code;
      const message = (insertError as any)?.message || '';
      let minimalPayload = { ...userData } as any;

      if (code === '23503' && message.includes('state_id')) {
        console.warn('Retrying insert without state_id due to FK violation');
        /* remove state_id for retry */
        delete minimalPayload.state_id;
        const retry = await supabase.from('users').insert(minimalPayload);
        if (!retry.error) {
          console.log('User profile created successfully on retry without state_id');
          return { success: true, error: null };
        }
        insertError = retry.error;
      }

      // 3) If NOT NULL violation (23502) for optional fields, strip down to minimal payload
      if (code === '23502') {
        console.warn('Retrying insert with minimal payload due to NOT NULL violation');
        minimalPayload = {
          id: userData.id,
          password_hash: userData.password_hash || 'handled_by_auth',
          role: userData.role,
          full_name: userData.full_name,
          state_id: userData.state_id || null,
        };
        const retry = await supabase.from('users').insert(minimalPayload);
        if (!retry.error) {
          console.log('User profile created successfully with minimal payload');
          return { success: true, error: null };
        }
        insertError = retry.error;
      }

      // 4) As a last resort, upsert on conflict id (in case row was partially created elsewhere)
      console.warn('Final attempt: upsert on id');
      const upsert = await supabase
        .from('users')
        .upsert(
          {
            id: userData.id,
            password_hash: userData.password_hash || 'handled_by_auth',
            role: userData.role,
            full_name: userData.full_name,
            email: userData.email,
            mobile: userData.mobile,
            state_id: userData.state_id || null,
          },
          { onConflict: 'id' }
        );
      if (!upsert.error) {
        console.log('User profile upserted successfully');
        return { success: true, error: null };
      }

      console.error('All attempts to create user profile failed:', {
        code: (upsert.error as any)?.code || code,
        message: (upsert.error as any)?.message || message,
        details: (upsert.error as any)?.details,
        hint: (upsert.error as any)?.hint,
      });
      return { success: false, error: upsert.error || insertError };
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    console.log('AuthProvider useEffect running');
    
    // Check if we already restored custom auth from localStorage
    const hasCustomAuth = localStorage.getItem('customAuth') === 'true';
    if (hasCustomAuth) {
      console.log('⏭️ Skipping Supabase auth setup - custom auth already restored');
      return;
    }
    
    // Test database connection
    testDatabase();

    // Track the last event to prevent duplicates
    let lastEventTime = 0;
    let lastEventType = '';

    // Set up auth state listener and store it in ref
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const now = Date.now();
        
        console.log('🔔 Auth event:', event, '| hasAuthStateRef:', hasAuthStateRef.current);
        
        // CRITICAL: If we already have valid auth, ignore ALL events except explicit SIGNED_OUT
        if (hasAuthStateRef.current && event !== 'SIGNED_OUT') {
          console.log(`🛑 Already authenticated - ignoring ${event} event completely`);
          return;
        }
        
        // Ignore duplicate events within 100ms
        if (event === lastEventType && (now - lastEventTime) < 100) {
          console.log(`⏭️ Ignoring duplicate ${event} event within 100ms`);
          return;
        }
        
        lastEventTime = now;
        lastEventType = event;
        
        console.log('Auth state change:', event, session?.user?.id);
        
        // Don't interfere with custom authentication
        if (isCustomAuth) {
          console.log('🔄 Ignoring auth state change - custom auth in progress');
          return;
        }
        
        // Also check if we have a custom session
        if (session?.user?.user_metadata?.role === 'student' && !session?.user?.email?.includes('@')) {
          console.log('🔄 Ignoring auth state change - custom student session detected');
          return;
        }
        
        // Don't process SIGNED_OUT events if we have custom auth
        if (event === 'SIGNED_OUT' && isCustomAuth) {
          console.log('🔄 Ignoring SIGNED_OUT event - custom auth should stay active');
          return;
        }
        
        // For TOKEN_REFRESHED events, do ABSOLUTELY NOTHING if we already have user and profile
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed event received');
          // Check if we already have a valid authenticated state using ref (not closure)
          if (hasAuthStateRef.current) {
            console.log('✅ Already authenticated (hasAuthStateRef=true), ignoring TOKEN_REFRESHED completely');
            return;
          }
          // Only process if we don't have auth state yet
          console.log('⚠️ No auth state yet, updating session from TOKEN_REFRESHED');
          if (session) {
            setSession(session);
            if (session.user) {
              setUser(session.user as AuthUser);
            }
          }
          return;
        }
        
        // For all other events, only process SIGNED_IN
        if (event === 'SIGNED_IN') {
          console.log('✅ SIGNED_IN event, setting up auth state');
          setSession(session);
          setUser(session?.user as AuthUser || null);
          
          if (session?.user) {
            setTimeout(() => {
              fetchUserProfile(session.user.id, session.user as AuthUser);
            }, 0);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          console.log('❌ SIGNED_OUT event, clearing auth state');
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        } else {
          console.log(`⏭️ Ignoring ${event} event - not SIGNED_IN or SIGNED_OUT`);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      
      // Don't interfere with custom authentication
      if (isCustomAuth) {
        console.log('🔄 Ignoring initial session check - custom auth in progress');
        return;
      }
      
      // Also check if we have a custom session
      if (session?.user?.user_metadata?.role === 'student' && !session?.user?.email?.includes('@')) {
        console.log('🔄 Ignoring initial session check - custom student session detected');
        return;
      }
      
      setSession(session);
      setUser(session?.user as AuthUser || null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user as AuthUser);
      }
      setLoading(false);
    });
    
    // Store subscription in ref so we can unsubscribe it later
    authSubscriptionRef.current = subscription;
    console.log('📡 Auth subscription created and stored in ref');

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []); // Remove isCustomAuth dependency to prevent recreation

  const fetchUserProfile = async (userId: string, userOverride?: AuthUser) => {
    try {
      console.log('🔍 Fetching user profile for:', userId);
      
      // If we're already fetching this profile, don't fetch again
      if (fetchingProfileRef.current === userId) {
        console.log('⏭️ Already fetching profile for this user, skipping duplicate fetch');
        return;
      }
      
      // If we already have a profile for this user, don't fetch again
      if (userProfile && userProfile.id === userId) {
        console.log('✅ Profile already exists for this user, skipping refetch');
        return;
      }
      
      // Mark that we're fetching this profile
      fetchingProfileRef.current = userId;
      
      const currentUser = userOverride || user;
      console.log('Current user state:', currentUser);
      console.log('User metadata:', currentUser?.user_metadata);
      
      // For custom authenticated students, prioritize the auth metadata
      if (currentUser && currentUser.user_metadata?.role === 'student') {
        console.log('🎓 Custom student authentication detected, using auth metadata');
        
        const baseProfile: any = {
          id: userId,
          full_name: currentUser.user_metadata.full_name,
          email: currentUser.user_metadata.email,
          mobile: currentUser.user_metadata.mobile,
          role: 'student',
          state_id: null
        };
        
        setUserProfile(baseProfile);
        console.log('✅ Student profile set from auth metadata:', baseProfile);
        
        // Save profile to localStorage for persistence
        localStorage.setItem('customProfile', JSON.stringify(baseProfile));
        console.log('💾 Saved profile to localStorage');
        
        // Try to fetch student-specific data without blocking
        try {
          const { data: studentData } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (studentData) {
            const finalProfile = { ...baseProfile, studentProfile: studentData };
            setUserProfile(finalProfile);
            localStorage.setItem('customProfile', JSON.stringify(finalProfile));
            console.log('✅ Student profile updated with database data:', finalProfile);
            console.log('💾 Saved updated profile to localStorage');
          }
        } catch (error) {
          console.warn('Could not fetch student-specific data:', error);
        }
        
        // Ensure the profile is set before continuing
        console.log('🎓 Custom student profile setup complete');
        fetchingProfileRef.current = null; // Clear the fetching flag
        return;
      }
      
      // For regular Supabase Auth users (teachers/admins), fetch from users table
      console.log('🔄 Fetching fresh profile data from database...');
      const { data: freshProfile, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!dbError && freshProfile) {
        console.log('✅ Fresh profile data loaded from database:', freshProfile);
        setUserProfile(freshProfile);
        fetchingProfileRef.current = null; // Clear the fetching flag
        return;
      }
      
      // Fallback to auth data only if database fetch fails
      console.log('⚠️ Database fetch failed, falling back to auth data');
      
      // General fallback: derive role from auth metadata for all roles
      if (currentUser && currentUser.user_metadata?.role) {
        const derivedRole = currentUser.user_metadata.role;
        const baseProfile: any = {
          id: userId,
          full_name: currentUser.user_metadata.full_name,
          email: currentUser.user_metadata.email,
          mobile: currentUser.user_metadata.mobile,
          role: derivedRole,
          state_id: null
        };
        
        setUserProfile(baseProfile);
        console.log('✅ Profile set from auth metadata:', baseProfile);
        
        // Try to fetch role-specific records without blocking routing
        try {
          if (derivedRole === 'student') {
            const { data: studentData } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', userId)
              .maybeSingle();
            if (studentData) setUserProfile((prev:any) => ({ ...prev, studentProfile: studentData }));
          } else if (derivedRole === 'teacher') {
            const { data: teacherData } = await supabase
              .from('teachers')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();
            if (teacherData) setUserProfile((prev:any) => ({ ...prev, teacherProfile: teacherData }));
          }
        } catch {}
        fetchingProfileRef.current = null; // Clear the fetching flag
        return;
      }
      
      // Original logic for Supabase Auth users (teachers/admins)
      console.log('🔍 Fetching profile for Supabase Auth user (database query)');
      
      // Retry a few times because profile insert may race with auth state change
      let attempts = 0;
      let userData: any = null;
      let userError: any = null;
      while (attempts < 4) {
        const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
          .maybeSingle();
        userData = data;
        userError = error;
        console.log(`Attempt ${attempts + 1}:`, { data, error });
        if (userData) break;
        // If no row (PGRST116 / 406), wait and retry
        const code = (userError as any)?.code;
        if (code === 'PGRST116' || (userError && (userError as any).status === 406)) {
          attempts += 1;
          await new Promise(r => setTimeout(r, 500 * attempts));
          continue;
        }
        break;
      }
      if (userError && !userData) {
        console.error('All attempts failed, throwing error:', userError);
        throw userError;
      }

      if (userData) {
        console.log('User data fetched successfully:', userData);
        
        // Set basic user profile first
        setUserProfile(userData);
        console.log('Basic userProfile set:', userData);
        
        // Fetch role-specific data (optional - don't fail if tables don't exist)
        try {
        if (userData.role === 'student') {
            console.log('Fetching student profile data for user:', userId);
            const { data: studentData, error: studentError } = await supabase
            .from('students')
              .select('*')
            .eq('user_id', userId)
            .single();
          
            if (studentError) {
              console.warn('Could not fetch student data:', studentError);
              // Set userProfile with empty studentProfile to avoid undefined errors
              const finalProfile = { ...userData, role: 'student', studentProfile: null };
              setUserProfile(finalProfile);
              console.log('Final userProfile set (student, no profile):', finalProfile);
            } else {
              console.log('Student data fetched successfully:', studentData);
              const finalProfile = { ...userData, role: 'student', studentProfile: studentData };
              setUserProfile(finalProfile);
              console.log('Final userProfile set (student, with profile):', finalProfile);
            }
        } else if (userData.role === 'teacher') {
            console.log('Fetching teacher profile data for user:', userId);
            const { data: teacherData, error: teacherError } = await supabase
            .from('teachers')
              .select('*')
            .eq('user_id', userId)
            .single();
          
            if (teacherError) {
              console.warn('Could not fetch teacher data:', teacherError);
              // Set userProfile with empty teacherProfile to avoid undefined errors
              const finalProfile = { ...userData, role: 'teacher', teacherProfile: null };
              setUserProfile(finalProfile);
              console.log('Final userProfile set (teacher, no profile):', finalProfile);
            } else {
              console.log('Teacher data fetched successfully:', teacherData);
              const finalProfile = { ...userData, role: 'teacher', teacherProfile: teacherData };
              setUserProfile(finalProfile);
              console.log('Final userProfile set (teacher, with profile):', finalProfile);
            }
          } else {
            // For other roles, just set the basic user profile
            setUserProfile(userData);
            console.log('Final userProfile set (other role):', userData);
          }
        } catch (roleDataError) {
          console.warn('Error fetching role-specific data:', roleDataError);
          // Set userProfile with empty role-specific profile to avoid undefined errors
          if (userData.role === 'student') {
            const finalProfile = { ...userData, role: 'student', studentProfile: null };
            setUserProfile(finalProfile);
            console.log('Final userProfile set (student, error fallback):', finalProfile);
          } else if (userData.role === 'teacher') {
            const finalProfile = { ...userData, role: 'teacher', teacherProfile: null };
            setUserProfile(finalProfile);
            console.log('Final userProfile set (teacher, error fallback):', finalProfile);
          } else {
            setUserProfile(userData);
            console.log('Final userProfile set (other role, error fallback):', userData);
          }
        }
      } else {
        console.error('No user data found after all attempts');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set a minimal userProfile to prevent undefined errors
      const fallbackProfile = { id: userId, role: 'unknown' };
      setUserProfile(fallbackProfile);
      console.log('Fallback userProfile set due to error:', fallbackProfile);
    } finally {
      // Clear the fetching flag
      fetchingProfileRef.current = null;
    }
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      console.log('🔐 Sign in attempt for:', identifier);
      
      // Try Supabase Auth first (teachers/admins/students with email)
      // Determine if identifier is email or mobile
      const isEmail = identifier.includes('@');
      let emailForAuth: string;

      if (isEmail) {
        emailForAuth = identifier;
      } else {
        // For mobile numbers, try to find the user's email
        const { data: userByMobile, error: userByMobileError } = await supabase
          .from('users')
          .select('email')
          .eq('mobile', identifier)
          .maybeSingle();
        
        if (userByMobileError) {
          console.error('Error looking up user by mobile:', userByMobileError);
          // Fall back to generated email pattern
          emailForAuth = `${identifier}@internal.app`;
        } else if (userByMobile && userByMobile.email) {
          emailForAuth = userByMobile.email;
        } else {
          // Fall back to generated email pattern
          emailForAuth = `${identifier}@internal.app`;
        }
      }

      console.log('🔐 Attempting sign in with email:', emailForAuth);

      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: emailForAuth,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        toast({
          title: "Sign in failed",
          description: error.message || "Invalid email/mobile or password",
          variant: "destructive",
        });
        return { error };
      }

      if (signInData?.user) {
        console.log('✅ Supabase Auth successful:', signInData.user);
        setUser(signInData.user);
        await fetchUserProfile(signInData.user.id, signInData.user as AuthUser);
        
        toast({
          title: "Sign in successful! ✨",
          description: "Welcome back!",
        });
        
        return { error: null };
      }

      // If Supabase Auth failed, try custom student auth
      try {
        console.log('🔄 Attempting custom student authentication...');
        const idTrim = identifier.trim();
        const idForAuth = idTrim.includes('@') ? idTrim.toLowerCase() : idTrim;
        const pwd = password.trim();
        const { data: customAuthData } = await supabase
          .rpc('authenticate_student', { identifier: idForAuth, password: pwd });
        if (customAuthData && customAuthData.length > 0) {
          const studentUser = customAuthData[0];
          const mockUser: AuthUser = {
            id: studentUser.user_id,
            email: studentUser.email || undefined,
            phone: studentUser.mobile || undefined,
            user_metadata: {
              full_name: studentUser.full_name,
              role: 'student',
              mobile: studentUser.mobile,
              email: studentUser.email
            }
          } as AuthUser;
          const mockSession = {
            user: mockUser,
            access_token: 'custom-auth-token',
            refresh_token: 'custom-auth-refresh',
            expires_at: Date.now() + (24 * 60 * 60 * 1000),
            token_type: 'bearer'
          } as Session;
          setUser(mockUser);
          setSession(mockSession);
          setIsCustomAuth(true);
          
          // Fetch profile and wait for it to complete
          await fetchUserProfile(studentUser.user_id, mockUser);
          
          // Ensure loading is set to false after profile is fetched
          setLoading(false);
          
          // Save custom auth state to localStorage
          // Note: We need to save the profile in fetchUserProfile after it's set
          localStorage.setItem('customAuth', 'true');
          localStorage.setItem('customUser', JSON.stringify(mockUser));
          
          console.log('🎓 Custom student authentication complete - user and profile set');
          toast({ title: 'Sign in successful! ✨', description: `Welcome back, ${studentUser.full_name}!` });
          return { error: null };
        }
      } catch {}

      return { error: new Error('Sign in failed') };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (
    mobile: string | null, 
    email: string, 
    password: string, 
    fullName: string, 
    role: 'teacher' | 'student',
    stateId: string,
    classId?: string
  ) => {
    try {
      console.log('Starting signUp process:', { mobile, email, fullName, role, stateId, classId });

      // Enforce class selection for students at the API layer too
      if (role === 'student' && !classId) {
        const err = { message: 'Class selection is required for student registration' } as any;
        console.error('SignUp blocked:', err);
        return { error: err };
      }
      
      // Handle email/mobile logic
      let finalEmail = email;
      let finalMobile = mobile;
      
      if (!email && mobile) {
        // If only mobile is provided, generate an email for Supabase auth
        finalEmail = `${mobile}@internal.app`;
        console.log('Generated email for mobile:', finalEmail);
      } else if (!mobile && email) {
        // If only email is provided, mobile is null
        finalMobile = null;
        console.log('Using provided email:', finalEmail);
      }

      // Check if email already exists
      console.log('Checking if email exists:', finalEmail);
      const { data: existingUserByEmail, error: emailCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('email', finalEmail)
        .maybeSingle();
      
      if (emailCheckError) {
        console.error('Error checking email:', emailCheckError);
        return { error: { message: 'Failed to check email availability' } };
      }

      if (existingUserByEmail) {
        console.log('Email already exists:', finalEmail);
        return { error: { message: 'Email address already registered' } };
      }

      // Check if mobile already exists (if provided)
      if (finalMobile) {
        console.log('Checking if mobile exists:', finalMobile);
        const { data: existingUserByMobile, error: mobileCheckError } = await supabase
          .from('users')
          .select('id')
          .eq('mobile', finalMobile)
          .maybeSingle();
        
        if (mobileCheckError) {
          console.error('Error checking mobile:', mobileCheckError);
          return { error: { message: 'Failed to check mobile availability' } };
        }

        if (existingUserByMobile) {
          console.log('Mobile already exists:', finalMobile);
          return { error: { message: 'Mobile number already registered' } };
        }
      }

      // Create Supabase auth user
      console.log('Creating Supabase auth user with email:', finalEmail);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: finalEmail,
        password,
        options: {
          data: {
            mobile: finalMobile,
            email: finalEmail,
            full_name: fullName,
            role,
          }
        }
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        toast({
          title: "Registration failed",
          description: authError.message,
          variant: "destructive",
        });
        return { error: authError };
      }

      console.log('Supabase auth user created:', authData.user?.id);

      if (authData.user) {
        // Insert into custom users table
        console.log('Inserting user profile into database');
        const userProfileData: any = {
            id: authData.user.id,
            password_hash: 'handled_by_auth',
            role,
            full_name: fullName,
          state_id: stateId,
        };
        
        // Only add email and mobile if the columns exist
        if (finalEmail) {
          userProfileData.email = finalEmail;
        }
        if (finalMobile) {
          userProfileData.mobile = finalMobile;
        }
        
        
        // Use the new createUserProfile function
        const { success, error: userInsertError } = await createUserProfile(userProfileData);

        if (!success) {
          console.error('Error creating user profile:', userInsertError);
          
          // Verify if the profile was actually created despite the error
          console.log('Verifying if user profile exists despite error...');
          const { data: existingProfile, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('id', authData.user.id)
            .maybeSingle();
          
          if (existingProfile) {
            console.log('✅ User profile exists despite error - continuing with registration');
            // Profile exists, so we can continue
          } else {
            // Profile truly doesn't exist
            console.error('❌ User profile truly does not exist');
            toast({
              title: "Registration failed",
              description: "Failed to create user profile. Please contact support.",
              variant: "destructive",
            });
            return { error: userInsertError };
          }
        }

        console.log('User profile created successfully');

        // Create role-specific profile (teacher or student)
        try {
          if (role === 'teacher') {
            // Create teacher profile
            const { error: teacherError } = await supabase
              .from('teachers')
              .insert({
                user_id: authData.user.id,
                state_id: stateId,
                is_active: true,
                joining_date: new Date().toISOString(),
              });

            if (teacherError) {
              console.error('Error creating teacher profile:', teacherError);
              toast({
                title: "Registration warning",
                description: "Account created but teacher profile setup failed. Please contact support.",
                variant: "destructive",
              });
            }
          } else if (role === 'student') {
            // Create student profile (class is optional in Phase 1)
            const { error: studentError } = await supabase
              .from('students')
              .insert({
                user_id: authData.user.id,
                class_id: classId || null,
                teacher_id: null, // Will be assigned by admin/teacher later
                enrollment_date: new Date().toISOString(),
                enrollment_status: 'pending',
              });

            if (studentError) {
              console.error('Error creating student profile:', studentError);
              toast({
                title: "Registration warning",
                description: "Account created but student profile setup failed. Please contact support.",
                variant: "destructive",
              });
            }
          }
        } catch (profileError) {
          console.error('Error creating role profile:', profileError);
          // Don't fail registration for profile creation errors
        }

        // For Phase 1: Bypass email confirmation and sign in immediately
        try {
          console.log('Attempting auto sign-in');
          // Wait a moment for the user profile to be fully created
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: finalEmail,
            password,
          });
          
          if (signInError) {
            console.error('Auto sign-in failed:', signInError);
            // Even if auto sign-in fails, registration was successful
            toast({
              title: "Registration successful",
              description: `Welcome to CareerCompass, ${fullName}! Please sign in manually.`,
            });
          } else {
            console.log('Auto sign-in successful');
            
            // CRITICAL: Manually fetch user profile since our auth listener might be blocked
            // Get the current session to fetch the user
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session?.user) {
              console.log('📥 Manually fetching user profile after registration');
              await fetchUserProfile(sessionData.session.user.id, sessionData.session.user as AuthUser);
            }
            
            // Auto sign-in successful
            toast({
              title: "Registration successful",
              description: `Welcome to CareerCompass, ${fullName}! You're now signed in.`,
            });
          }
        } catch (signInError) {
          console.error('Auto sign-in error:', signInError);
        toast({
          title: "Registration successful",
            description: `Welcome to CareerCompass, ${fullName}! Please sign in manually.`,
        });
        }
      }

      return { error: null };
    } catch (error) {
      console.error('SignUp error:', error);
      return { error };
    }
  };



  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Reset all auth state
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setIsCustomAuth(false);
      setLoading(false);
      
      // Clear localStorage
      localStorage.removeItem('customAuth');
      localStorage.removeItem('customUser');
      localStorage.removeItem('customProfile');
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    }
  };

  const refreshUserProfile = async () => {
    if (user?.id) {
      console.log('🔄 Refreshing user profile from database...');
      try {
        // Use the same fetchUserProfile function to ensure consistency
        await fetchUserProfile(user.id);
        console.log('✅ User profile refreshed successfully');
      } catch (error) {
        console.error('Error refreshing user profile:', error);
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

  console.log('AuthProvider rendering with value:', { 
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