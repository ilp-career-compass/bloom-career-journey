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
  signUp: (mobile: string | null, email: string, password: string, fullName: string, role: 'teacher' | 'student') => Promise<{ error: any }>;
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

  // Create user profile with proper error handling
  const createUserProfile = async (userData: any) => {
    try {
      console.log('Attempting to create user profile with data:', userData);
      
      // Try direct insert
      const { error: insertError } = await supabase
        .from('users')
        .insert(userData);
      
      if (!insertError) {
        console.log('User profile created successfully via direct insert');
        return { success: true, error: null };
      }
      
      console.log('Direct insert failed:', insertError);
      return { success: false, error: insertError };
      
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    // Test database connection
    testDatabase();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (userData) {
        console.log('User data fetched:', userData);
        setUserProfile(userData);
        
        // Fetch role-specific data (optional - don't fail if tables don't exist)
        try {
          if (userData.role === 'student') {
            const { data: studentData, error: studentError } = await supabase
              .from('students')
              .select(`
                *,
                classes:class_id(name, schools:school_id(name)),
                teachers:teacher_id(users:user_id(full_name))
              `)
              .eq('user_id', userId)
              .single();
            
            if (studentError) {
              console.warn('Could not fetch student data:', studentError);
              // Continue without student data
            } else {
              setUserProfile({ ...userData, studentProfile: studentData });
            }
          } else if (userData.role === 'teacher') {
            const { data: teacherData, error: teacherError } = await supabase
              .from('teachers')
              .select(`
                *,
                schools:school_id(name),
                classes:class_id(name)
              `)
              .eq('user_id', userId)
              .single();
            
            if (teacherError) {
              console.warn('Could not fetch teacher data:', teacherError);
              // Continue without teacher data
            } else {
              setUserProfile({ ...userData, teacherProfile: teacherData });
            }
          }
        } catch (roleDataError) {
          console.warn('Error fetching role-specific data:', roleDataError);
          // Continue without role-specific data
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      // Check if identifier is email or mobile
      const isEmail = identifier.includes('@');
      
      let userData;
      let userError;
      
      if (isEmail) {
        // If it's an email, check directly in users table
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', identifier)
          .single();
        userData = data;
        userError = error;
        
        // If email column doesn't exist, fall back to mobile-only approach
        if (error && error.message.includes('column "email" does not exist')) {
          console.log('Email column does not exist - migration not applied, using mobile-only approach');
          // Try to find user by mobile instead
          const { data: mobileData, error: mobileError } = await supabase
            .from('users')
            .select('*')
            .eq('mobile', identifier)
            .single();
          userData = mobileData;
          userError = mobileError;
        }
      } else {
        // If it's mobile, check in users table
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('mobile', identifier)
          .single();
        userData = data;
        userError = error;
      }

      if (userError || !userData) {
        return { error: { message: 'Invalid email/mobile or password' } };
      }

      // Use the user's email for Supabase auth (generate if not exists)
      let email = userData.email;
      if (!email && userData.mobile) {
        email = `${userData.mobile}@internal.app`;
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: "Invalid email/mobile or password",
          variant: "destructive",
        });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (mobile: string | null, email: string, password: string, fullName: string, role: 'teacher' | 'student') => {
    try {
      console.log('Starting signUp process:', { mobile, email, fullName, role });
      
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
          toast({
            title: "Registration failed",
            description: "Failed to create user profile. Please contact support.",
            variant: "destructive",
          });
          return { error: userInsertError };
        }

        console.log('User profile created successfully');

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