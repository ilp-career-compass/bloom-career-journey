import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  signIn: (mobile: string, password: string) => Promise<{ error: any }>;
  signUp: (mobile: string, password: string, fullName: string, role: 'teacher' | 'student') => Promise<{ error: any }>;
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

  useEffect(() => {
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
        setUserProfile(userData);
        
        // Fetch role-specific data
        if (userData.role === 'student') {
          const { data: studentData } = await supabase
            .from('students')
            .select(`
              *,
              classes:class_id(name, schools:school_id(name)),
              teachers:teacher_id(users:user_id(full_name))
            `)
            .eq('user_id', userId)
            .single();
          
          setUserProfile({ ...userData, studentProfile: studentData });
        } else if (userData.role === 'teacher') {
          const { data: teacherData } = await supabase
            .from('teachers')
            .select(`
              *,
              schools:school_id(name),
              classes:class_id(name)
            `)
            .eq('user_id', userId)
            .single();
          
          setUserProfile({ ...userData, teacherProfile: teacherData });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signIn = async (mobile: string, password: string) => {
    try {
      // First get user data to check if they exist
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('mobile', mobile)
        .single();

      if (userError || !userData) {
        return { error: { message: 'Invalid mobile number or password' } };
      }

      // Use email format for Supabase auth (mobile@internal.app)
      const email = `${mobile}@internal.app`;
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: "Invalid mobile number or password",
          variant: "destructive",
        });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (mobile: string, password: string, fullName: string, role: 'teacher' | 'student') => {
    try {
      // Check if mobile already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('mobile')
        .eq('mobile', mobile)
        .single();

      if (existingUser) {
        return { error: { message: 'Mobile number already registered' } };
      }

      // Use email format for Supabase auth (mobile@internal.app)
      const email = `${mobile}@internal.app`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            mobile,
            full_name: fullName,
            role,
          }
        }
      });

      if (authError) {
        toast({
          title: "Registration failed",
          description: authError.message,
          variant: "destructive",
        });
        return { error: authError };
      }

      if (authData.user) {
        // Insert into custom users table
        const { error: userInsertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            mobile,
            password_hash: 'handled_by_auth',
            role,
            full_name: fullName,
          });

        if (userInsertError) {
          console.error('Error creating user profile:', userInsertError);
        }

        toast({
          title: "Registration successful",
          description: `Welcome to CareerCompass, ${fullName}!`,
        });
      }

      return { error: null };
    } catch (error) {
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