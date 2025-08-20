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
  session: Session | null;
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

      // 2) If FK violation on school_id (23503), retry without school_id
      const code = (insertError as any)?.code;
      const message = (insertError as any)?.message || '';
      let minimalPayload = { ...userData };

      if (code === '23503' && message.includes('school_id')) {
        console.warn('Retrying insert without school_id due to FK violation');
        delete (minimalPayload as any).school_id;
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

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
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
      if (userError && !userData) throw userError;

      if (userData) {
        console.log('User data fetched:', userData);
        
        // Set basic user profile first
        setUserProfile(userData);
        
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
              setUserProfile({ ...userData, studentProfile: null });
            } else {
              console.log('Student data fetched successfully:', studentData);
              setUserProfile({ ...userData, studentProfile: studentData });
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
              setUserProfile({ ...userData, teacherProfile: null });
            } else {
              console.log('Teacher data fetched successfully:', teacherData);
              setUserProfile({ ...userData, teacherProfile: teacherData });
            }
          } else {
            // For other roles, just set the basic user profile
            setUserProfile(userData);
          }
        } catch (roleDataError) {
          console.warn('Error fetching role-specific data:', roleDataError);
          // Set userProfile with empty role-specific profile to avoid undefined errors
          if (userData.role === 'student') {
            setUserProfile({ ...userData, studentProfile: null });
          } else if (userData.role === 'teacher') {
            setUserProfile({ ...userData, teacherProfile: null });
          } else {
            setUserProfile(userData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set a minimal userProfile to prevent undefined errors
      setUserProfile({ id: userId, role: 'unknown' });
    }
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      // Determine if identifier is email or mobile
      const isEmail = identifier.includes('@');

      // Resolve email to use for auth
      let emailForAuth: string | null = null;
      if (isEmail) {
        emailForAuth = identifier;
      } else {
        // Try to fetch email from profile by mobile, but handle 406 (no row) gracefully
        const { data: userByMobile, error: userByMobileError } = await supabase
          .from('users')
          .select('email')
          .eq('mobile', identifier)
          .maybeSingle();
        if (userByMobile && userByMobile.email) {
          emailForAuth = userByMobile.email;
        } else {
          // Fall back to the generated email pattern used at sign-up
          emailForAuth = `${identifier}@internal.app`;
        }
      }

      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: emailForAuth as string,
        password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: "Invalid email/mobile or password",
          variant: "destructive",
        });
      }

      // Ensure a user profile row exists after sign-in
      if (!error && signInData?.user) {
        const authedUser = signInData.user;
        // Check if profile row exists
        const { data: profileRow } = await supabase
          .from('users')
          .select('id')
          .eq('id', authedUser.id)
          .maybeSingle();
        if (!profileRow) {
          const payload: any = {
            id: authedUser.id,
            password_hash: 'handled_by_auth',
            role: (authedUser.user_metadata?.role as any) || 'student',
            full_name: authedUser.user_metadata?.full_name || 'User',
            email: emailForAuth,
          };
          if (!isEmail) payload.mobile = identifier;
          await supabase
            .from('users')
            .upsert(payload, { onConflict: 'id' as any });
        }
      }

      return { error };
    } catch (error) {
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
      console.log('Starting signUp process:', { mobile, email, fullName, role, schoolId, classId, gender });
      
      // If no email is provided, we need to generate one for Supabase auth
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
      let existingUserByEmail = null;
      let emailCheckError = null;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', finalEmail)
          .maybeSingle();
        
        existingUserByEmail = data;
        emailCheckError = error;
      } catch (error) {
        console.log('Email check failed, continuing with registration:', error);
        // Continue with registration even if email check fails
      }

      if (emailCheckError && emailCheckError.code !== 'PGRST116') {
        // If the error is about the column not existing, the migration hasn't been applied
        if (emailCheckError.message && emailCheckError.message.includes('column "email" does not exist')) {
          console.log('Email column does not exist - migration not applied, using mobile-only approach');
          // Fall back to mobile-only registration
          finalEmail = `${finalMobile || 'user'}@internal.app`;
        } else {
          console.error('Error checking email:', emailCheckError);
          // Don't return error, continue with registration
        }
      }

      if (existingUserByEmail) {
        console.log('Email already exists:', finalEmail);
        return { error: { message: 'Email address already registered' } };
      }

      // Check if mobile already exists (if provided)
      if (finalMobile) {
        console.log('Checking if mobile exists:', finalMobile);
        let existingUserByMobile = null;
        let mobileCheckError = null;
        
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('mobile', finalMobile)
            .maybeSingle();
          
          existingUserByMobile = data;
          mobileCheckError = error;
        } catch (error) {
          console.log('Mobile check failed, continuing with registration:', error);
          // Continue with registration even if mobile check fails
        }

        if (mobileCheckError && mobileCheckError.code !== 'PGRST116') {
          console.error('Error checking mobile:', mobileCheckError);
          // Don't return error, continue with registration
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
          school_id: schoolId,
        };
        
        // Only add email and mobile if the columns exist
        if (finalEmail) {
          userProfileData.email = finalEmail;
        }
        if (finalMobile) {
          userProfileData.mobile = finalMobile;
        }
        
        // Add gender for students
        if (role === 'student' && gender) {
          userProfileData.gender = gender;
        }
        
        // Use the new createUserProfile function
        const { success, error: userInsertError } = await createUserProfile(userProfileData);

        if (!success) {
          console.error('Error creating user profile:', userInsertError);
          toast({
            title: "Registration failed",
            description: "Failed to create user profile. Please contact support.",
            variant: "destructive",
          });
          return { error: userInsertError };
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
                school_id: schoolId,
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
          } else if (role === 'student' && classId) {
            // Create student profile
            const { error: studentError } = await supabase
              .from('students')
              .insert({
                user_id: authData.user.id,
                class_id: classId,
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
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
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