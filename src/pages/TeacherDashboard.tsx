import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  MessageCircle, 
  BookOpen, 
  Settings, 
  LogOut, 
  Search,
  CheckCircle,
  Clock,
  Lock,
  Send,
  Phone,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  users: {
    id: string;
    full_name: string;
    mobile: string;
  };
  classes: {
    name: string;
  };
  progress?: Array<{
    activity_id: string;
    status: string;
    activities: {
      title: string;
      sequence_number: number;
    };
  }>;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  sequence_number: number;
}

export default function TeacherDashboard() {
  const { userProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [supportMessage, setSupportMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!userProfile?.teacherProfile?.id) {
        console.warn('No teacher profile found, skipping data fetch');
        setLoading(false);
        return;
      }

      // Fetch students assigned to this teacher
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          users:user_id(id, full_name, mobile),
          classes:class_id(name)
        `)
        .eq('teacher_id', userProfile.teacherProfile.id);

      if (studentsError) throw studentsError;

      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .order('sequence_number');

      if (activitiesError) throw activitiesError;

      // Fetch progress for all students
      const studentIds = studentsData?.map(s => s.id) || [];
      if (studentIds.length > 0) {
        const { data: progressData, error: progressError } = await supabase
          .from('student_activity_progress')
          .select(`
            *,
            activities:activity_id(title, sequence_number)
          `)
          .in('student_id', studentIds);

        if (progressError) throw progressError;

        // Group progress by student
        const progressByStudent = progressData?.reduce((acc, p) => {
          if (!acc[p.student_id]) acc[p.student_id] = [];
          acc[p.student_id].push(p);
          return acc;
        }, {} as Record<string, any[]>) || {};

        // Add progress to students
        const studentsWithProgress = studentsData?.map(student => ({
          ...student,
          progress: progressByStudent[student.id] || []
        })) || [];

        setStudents(studentsWithProgress);
      }

      setActivities(activitiesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unlockActivity = async (studentId: string, activityId: string) => {
    try {
      const { error } = await supabase
        .from('student_activity_progress')
        .upsert({
          student_id: studentId,
          activity_id: activityId,
          status: 'unlocked'
        });

      if (error) throw error;

      toast({
        title: "Activity Unlocked",
        description: "Student can now access this activity",
      });

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error unlocking activity:', error);
      toast({
        title: "Error",
        description: "Failed to unlock activity",
        variant: "destructive",
      });
    }
  };

  const getStudentProgress = (student: Student) => {
    const completed = student.progress?.filter(p => p.status === 'completed').length || 0;
    return activities.length > 0 ? (completed / activities.length) * 100 : 0;
  };

  const filteredStudents = students.filter(student =>
    student.users.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sendSupportMessage = () => {
    toast({
      title: "Message Sent",
      description: "Your support request has been sent to ILP support team",
    });
    setSupportMessage('');
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'completed') return <CheckCircle className="w-4 h-4 text-success" />;
    if (status === 'unlocked') return <Clock className="w-4 h-4 text-warning" />;
    return <Lock className="w-4 h-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome, {userProfile?.full_name} - {userProfile?.teacherProfile?.schools?.name}
            </p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              My Students
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              CareerLM
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>Monitor and manage your students' progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {filteredStudents.map(student => (
                    <Card key={student.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{student.users.full_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {student.classes.name} • {student.users.mobile}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {Math.round(getStudentProgress(student))}% Complete
                        </Badge>
                      </div>
                      
                      <Progress value={getStudentProgress(student)} className="mb-3" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {activities.map(activity => {
                          const progress = student.progress?.find(p => p.activity_id === activity.id);
                          const status = progress?.status || 'locked';
                          
                          return (
                            <div key={activity.id} className="flex items-center justify-between p-2 rounded border">
                              <div className="flex items-center gap-2">
                                <StatusIcon status={status} />
                                <span className="text-sm">{activity.title}</span>
                              </div>
                              {status === 'locked' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => unlockActivity(student.id, activity.id)}
                                >
                                  Unlock
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Career Charts</CardTitle>
                  <CardDescription>Visual career pathway guides</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Career charts coming soon...</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Video Library</CardTitle>
                  <CardDescription>Educational career videos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Video library coming soon...</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Slide Decks</CardTitle>
                  <CardDescription>Presentation materials</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Slide decks coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>CareerLM AI Assistant</CardTitle>
                <CardDescription>Get AI-powered career counselling insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>AI Chat feature coming soon...</p>
                  <p className="text-sm mt-2">This will provide AI-powered career counselling assistance</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact ILP Support</CardTitle>
                <CardDescription>Get help from our support team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Phone className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Phone Support</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Call us for immediate assistance</p>
                      <p className="font-mono text-sm">+91 1800-XXX-XXXX</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Mail className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Email Support</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Send us your queries</p>
                      <p className="font-mono text-sm">support@ilp.org</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Send a Message</h3>
                  <Textarea
                    placeholder="Describe your issue or question..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={sendSupportMessage} disabled={!supportMessage.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}