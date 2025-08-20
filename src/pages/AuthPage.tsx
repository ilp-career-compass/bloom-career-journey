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
import { SchoolInfo, SchoolClass } from '@/integrations/supabase/types';

export default function AuthPage() {
  console.log('AuthPage: Component rendering');
  
  const { user, userProfile, signIn, signUp } = useAuth();
  const [signInForm, setSignInForm] = useState({ identifier: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({ 
    identifier: '', 
    password: '', 
    fullName: '', 
    role: 'student' as 'teacher' | 'student',
    schoolId: '',
    classId: '',
    gender: '' as 'male' | 'female'
  });
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<SchoolInfo[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  // Load schools on component mount
  useEffect(() => {
    console.log('AuthPage: useEffect triggered, calling loadSchools');
    loadSchools();
  }, []);

  // Load classes when school is selected
  useEffect(() => {
    if (signUpForm.schoolId) {
      loadClasses(signUpForm.schoolId);
    } else {
      setClasses([]);
    }
  }, [signUpForm.schoolId]);

  // Load schools from database
  const loadSchools = async () => {
    console.log('Loading schools...');
    setLoadingSchools(true);
    try {
      // Attempt 1: id, name, school_code
      let { data, error } = await supabase
        .from('schools')
        .select('id, name, school_code')
        .order('name');
      if (error) {
        console.warn('Primary school query failed, retrying without school_code:', error);
        // Attempt 2: id, name
        const retry = await supabase
          .from('schools')
          .select('id, name')
          .order('name');
        data = retry.data as any[] | null;
        error = retry.error as any;
      }
      if (error) {
        console.error('School query failed after retry:', error);
        setSchools([]);
        return;
      }
      const rawSchools = (data || []).filter((s: any) => s && s.id && s.name);
      const uniqueSchools = Array.from(new Map(rawSchools.map((s: any) => [s.id, s])).values());
      const schoolsData = uniqueSchools.map((school: any) => ({
        school_id: String(school.id),
        school_name: String(school.name),
        school_code: String((school as any).school_code || ''),
        org_name: ''
      }));
      setSchools(schoolsData);
    } catch (error) {
      console.error('Error loading schools:', error);
      setSchools([]);
    } finally {
      setLoadingSchools(false);
    }
  };

  // Load classes for selected school
  const loadClasses = async (schoolId: string) => {
    try {
      console.log('Loading classes for school:', schoolId);
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', schoolId)
        .order('name');
      if (error) throw error;
      const rawClasses = (data || []).filter((r: any) => r && r.id && r.name);
      const uniqueClasses = Array.from(new Map(rawClasses.map((r: any) => [r.id, r])).values());
      const classesData = uniqueClasses.map((row: any) => ({
        class_id: String(row.id),
        class_name: String(row.name),
      }));
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
    }
  };

  // Redirect if already authenticated
  if (user && userProfile) {
    const redirectPath = userProfile.role === 'admin' ? '/admin' 
                        : userProfile.role === 'teacher' ? '/teacher'
                        : '/student';
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
    if (!signUpForm.schoolId) {
      console.error('School selection is required');
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
      signUpForm.schoolId,
      signUpForm.classId,
      signUpForm.gender
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
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-identifier">Email or Mobile Number</Label>
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
                    <Label htmlFor="signin-password">Password</Label>
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
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
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
                    <Label htmlFor="signup-identifier">Email Address / Mobile Number</Label>
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
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signUpForm.password}
                      onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={signUpForm.role} onValueChange={(value: 'teacher' | 'student') => setSignUpForm({ ...signUpForm, role: value, classId: '', schoolId: '' })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Student
                          </div>
                        </SelectItem>
                        <SelectItem value="teacher">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Teacher
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* School Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="school">School *</Label>
                    <Select 
                      value={signUpForm.schoolId} 
                      onValueChange={(value) => setSignUpForm({ ...signUpForm, schoolId: value, classId: '' })}
                      disabled={loadingSchools}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingSchools ? "Loading schools..." : "Select your school"} />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.length === 0 ? (
                          <>
                            {loadingSchools ? null : (
                              <div className="px-3 py-2 text-sm text-muted-foreground">No schools available</div>
                            )}
                          </>
                        ) : (
                          schools.map((school) => (
                            <SelectItem key={school.school_id} value={school.school_id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{school.school_name}</span>
                                <span className="text-xs text-muted-foreground">{school.school_code}</span>
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
                      <Label htmlFor="class">Class *</Label>
                      <Select 
                        value={signUpForm.classId} 
                        onValueChange={(value) => setSignUpForm({ ...signUpForm, classId: value })}
                        disabled={!signUpForm.schoolId || classes.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={!signUpForm.schoolId ? "Select school first" : classes.length === 0 ? "No classes available" : "Select your class"} />
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

                  {/* Gender Selection - Only for Students */}
                  {signUpForm.role === 'student' && (
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={signUpForm.gender} 
                        onValueChange={(value: 'male' | 'female') => setSignUpForm({ ...signUpForm, gender: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create Account'}
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