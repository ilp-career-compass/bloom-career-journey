import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  session: Session | null
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: any }>;
  signUp: (
    mobile: string | null, 
    email: string, 
    password: string, 
    fullName: string, 
    role: 'teacher' | 'student',
    schoolId: string,
    classId?: string,
    gender?: 'male' | 'female'
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userProfile: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  console.log('AuthProvider initialized');

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
      console.log('Creating user profile for:', userData.id);
      
      // Start with minimal payload
      let minimalPayload = {
        id: userData.id,
        password_hash: userData.password_hash || 'handled_by_auth',
        role: userData.role,
        full_name: userData.full_name,
        email: userData.email,
        mobile: userData.mobile,
        school_id: userData.school_id || null,
      };

      // 1) First attempt with full payload
      let { error: insertError } = await supabase.from('users').insert(minimalPayload);
      if (!insertError) {
        console.log('User profile created successfully on first attempt');
        return { success: true, error: null };
      }

      // 2) If foreign key violation (23503) for school_id, retry without it
      const { code, message } = insertError as any;
      if (code === '23503' && message.includes('school_id')) {
        console.warn('Retrying insert without school_id due to FK violation');
        /* remove school_id for retry */
        delete minimalPayload.school_id;
        const retry = await supabase.from('users').insert(minimalPayload);
        if (!retry.error) {
          console.log('User profile created successfully on retry without school_id');
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
          school_id: userData.school_id || null,
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
            school_id: userData.school_id || null,
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

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      console.log('Current user state:', user);
      console.log('User metadata:', user?.user_metadata);
      
      // For custom authenticated students, we already have the user data
      // from the authenticate_student function, so we can create the profile directly
      if (user && user.user_metadata?.role === 'student') {
        console.log('Using existing student data from authentication');
        const studentProfile = {
          id: userId,
          full_name: user.user_metadata.full_name,
          email: user.user_metadata.email,
          mobile: user.user_metadata.mobile,
          role: 'student',
          school_id: null, // Will be fetched from students table
          studentProfile: null // Will be fetched below
        };
        
        // Set the basic profile first
        setUserProfile(studentProfile);
        console.log('Student profile set from auth data:', studentProfile);
        
        // Now try to fetch additional student data (this might fail due to RLS, but that's okay)
        try {
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (!studentError && studentData) {
            console.log('Additional student data fetched:', studentData);
            const enhancedProfile = { ...studentProfile, studentProfile: studentData };
            setUserProfile(enhancedProfile);
            console.log('Enhanced student profile set:', enhancedProfile);
          } else {
            console.log('No additional student data available (RLS restriction expected):', studentError);
          }
        } catch (roleDataError) {
          console.log('Expected RLS restriction on students table:', roleDataError);
        }
        
        return; // Exit early for custom authenticated students
      }
      
      // Original logic for Supabase Auth users (teachers/admins)
      console.log('Fetching profile for Supabase Auth user');
      
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
    }
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      console.log('SignIn attempt with identifier:', identifier);
      
      // First, try to authenticate using our custom student authentication system
      try {
        const { data: customAuthData, error: customAuthError } = await supabase
          .rpc('authenticate_student', {
            identifier: identifier,
            password: password
          });
        
        if (!customAuthError && customAuthData && customAuthData.length > 0) {
          const studentUser = customAuthData[0];
          console.log('Custom authentication successful for student:', studentUser);
          
          // Create a mock Supabase user object for the student
          const mockUser: AuthUser = {
            id: studentUser.user_id,
            email: studentUser.email || undefined,
            phone: studentUser.mobile || undefined,
            user_metadata: {
              full_name: studentUser.full_name,
              role: studentUser.role,
              mobile: studentUser.mobile,
              email: studentUser.email
            }
          } as AuthUser;
          
          // Set the user and fetch profile using the actual user_id from database
          setUser(mockUser);
          console.log('Mock user set:', mockUser);
          await fetchUserProfile(studentUser.user_id); // Use user_id from function result
          console.log('User profile fetched, current userProfile state should be updated');
          
          toast({
            title: "Sign in successful! ✨",
            description: `Welcome back, ${studentUser.full_name}!`,
          });
          
          return { error: null };
        }
      } catch (customAuthError) {
        console.log('Custom authentication failed, trying Supabase Auth:', customAuthError);
      }
      
      // Fallback to Supabase Auth for teachers and admins
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

      console.log('Attempting sign in with email:', emailForAuth);

      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: emailForAuth,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        toast({
          title: "Sign in failed",
          description: error.message || "Invalid email/mobile or password",
          variant: "destructive",
        });
        return { error };
      }

      if (signInData?.user) {
        console.log('Supabase Auth successful:', signInData.user);
        setUser(signInData.user);
        await fetchUserProfile(signInData.user.id);
        
        toast({
          title: "Sign in successful! ✨",
          description: "Welcome back!",
        });
        
        return { error: null };
      }

      return { error: new Error('Sign in failed') };
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign in failed",
        description: error.message || "An unexpected error occurred",
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
    schoolId: string,
    classId?: string,
    gender?: 'male' | 'female'
  ) => {
    try {
      console.log('SignUp attempt for:', { mobile, email, fullName, role, schoolId, classId, gender });
      
      // Create user in Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            mobile: mobile,
            school_id: schoolId
          }
        }
      });

      if (signUpError) {
        console.error('SignUp error:', signUpError);
        toast({
          title: "Sign up failed",
          description: signUpError.message || "Failed to create account",
          variant: "destructive",
        });
        return { error: signUpError };
      }

      if (signUpData?.user) {
        console.log('User created in Supabase Auth:', signUpData.user.id);
        
        // Create user profile in our custom users table
        const profileResult = await createUserProfile({
          id: signUpData.user.id,
          role: role,
          full_name: fullName,
          email: email,
          mobile: mobile,
          school_id: schoolId,
          password_hash: 'handled_by_auth'
        });

        if (!profileResult.success) {
          console.error('Failed to create user profile:', profileResult.error);
          // Don't fail the signup if profile creation fails
        }

        // Create role-specific profile
        try {
          if (role === 'teacher') {
            const { error: teacherError } = await supabase
              .from('teachers')
              .insert({
                user_id: signUpData.user.id,
                school_id: schoolId
              });
            
            if (teacherError) {
              console.error('Failed to create teacher profile:', teacherError);
            }
          } else if (role === 'student' && classId) {
            const { error: studentError } = await supabase
              .from('students')
              .insert({
                user_id: signUpData.user.id,
                class_id: classId,
                enrollment_status: 'active'
              });
            
            if (studentError) {
              console.error('Failed to create student profile:', studentError);
            }
          }
        } catch (roleError) {
          console.error('Error creating role-specific profile:', roleError);
        }

        toast({
          title: "Account created! ✨",
          description: "Please check your email to verify your account.",
        });

        return { error: null };
      }

      return { error: new Error('Sign up failed') };
    } catch (error: any) {
      console.error('SignUp error:', error);
      toast({
        title: "Sign up failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: "An error occurred while signing out.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log('AuthProvider useEffect running');
    
    // Test database connection
    testDatabase();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user as AuthUser || null);
        
        if (session?.user) {
          // Fetch user profile data
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user as AuthUser || null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  console.log('AuthProvider rendering with value:', { user, loading, userProfile });

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      userProfile
    }}>
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
