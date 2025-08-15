import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, MessageCircle, User, Lock, CheckCircle, Circle, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Activity {
  id: string;
  title: string;
  description: string;
  sequence_number: number;
}

interface ActivityProgress {
  activity_id: string;
  status: string;
  results?: string;
  completed_at?: string;
}

export default function StudentDashboard() {
  const { userProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [progress, setProgress] = useState<ActivityProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .order('sequence_number');

      if (activitiesError) throw activitiesError;

      // Fetch student progress
      if (userProfile?.studentProfile?.id) {
        const { data: progressData, error: progressError } = await supabase
          .from('student_activity_progress')
          .select('*')
          .eq('student_id', userProfile.studentProfile.id);

        if (progressError) throw progressError;

        setProgress(progressData || []);
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

  const getActivityProgress = (activityId: string): ActivityProgress => {
    return progress.find(p => p.activity_id === activityId) || 
           { activity_id: activityId, status: 'locked' };
  };

  const getProgressPercentage = () => {
    const completed = progress.filter(p => p.status === 'completed').length;
    return activities.length > 0 ? (completed / activities.length) * 100 : 0;
  };

  const startActivity = async (activity: Activity) => {
    const activityProgress = getActivityProgress(activity.id);
    
    if (activityProgress.status === 'locked') {
      toast({
        title: "Activity Locked",
        description: "Complete previous activities first",
        variant: "destructive",
      });
      return;
    }

    if (activityProgress.status === 'completed') {
      toast({
        title: "Activity Completed",
        description: "You have already completed this activity",
      });
      return;
    }

    // Mock activity completion - in real app, this would navigate to activity page
    const results = `Completed ${activity.title} assessment`;
    
    try {
      const { error } = await supabase
        .from('student_activity_progress')
        .upsert({
          student_id: userProfile.studentProfile.id,
          activity_id: activity.id,
          status: 'completed',
          results,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Activity Completed!",
        description: `You've completed ${activity.title}`,
      });

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error completing activity:', error);
      toast({
        title: "Error",
        description: "Failed to complete activity",
        variant: "destructive",
      });
    }
  };

  const ActivityIcon = ({ status }: { status: string }) => {
    if (status === 'completed') return <CheckCircle className="w-5 h-5 text-success" />;
    if (status === 'unlocked') return <Circle className="w-5 h-5 text-primary" />;
    return <Lock className="w-5 h-5 text-muted-foreground" />;
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
            <h1 className="text-2xl font-bold text-foreground">Welcome, {userProfile?.full_name}</h1>
            <p className="text-muted-foreground">
              {userProfile?.studentProfile?.classes?.name} - {userProfile?.studentProfile?.classes?.schools?.name}
            </p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Overall Progress</h2>
            <Badge variant="secondary">{Math.round(getProgressPercentage())}% Complete</Badge>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>

        <Tabs defaultValue="assessments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assessments" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Self-Discovery
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              CareerLM Chat
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              My Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assessments" className="space-y-4">
            <div className="grid gap-4">
              {activities.map((activity, index) => {
                const activityProgress = getActivityProgress(activity.id);
                const isUnlocked = index === 0 || 
                  progress.some(p => p.activity_id === activities[index - 1]?.id && p.status === 'completed');
                
                const currentStatus = isUnlocked ? 
                  (activityProgress.status === 'locked' ? 'unlocked' : activityProgress.status) : 
                  'locked';

                return (
                  <Card key={activity.id} className={`transition-all duration-200 ${
                    currentStatus === 'completed' ? 'bg-success-light border-success/20' :
                    currentStatus === 'unlocked' ? 'bg-card hover:shadow-md' :
                    'bg-muted/50'
                  }`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ActivityIcon status={currentStatus} />
                          <div>
                            <CardTitle className="text-lg">{activity.title}</CardTitle>
                            <CardDescription>{activity.description}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={
                          currentStatus === 'completed' ? 'default' :
                          currentStatus === 'unlocked' ? 'secondary' :
                          'outline'
                        }>
                          {currentStatus}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => startActivity(activity)}
                        disabled={currentStatus === 'locked'}
                        variant={currentStatus === 'completed' ? 'secondary' : 'default'}
                        className="w-full"
                      >
                        {currentStatus === 'completed' ? 'View Results' :
                         currentStatus === 'unlocked' ? 'Start Assessment' :
                         'Locked'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>CareerLM AI Assistant</CardTitle>
                <CardDescription>Get personalized career guidance from our AI assistant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>AI Chat feature coming soon...</p>
                  <p className="text-sm mt-2">This will provide personalized career counselling</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                    <p className="text-sm">{userProfile?.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Mobile</Label>
                    <p className="text-sm">{userProfile?.mobile}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                    <p className="text-sm capitalize">{userProfile?.role}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">School</Label>
                    <p className="text-sm">{userProfile?.studentProfile?.classes?.schools?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Class</Label>
                    <p className="text-sm">{userProfile?.studentProfile?.classes?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Teacher</Label>
                    <p className="text-sm">{userProfile?.studentProfile?.teachers?.users?.full_name}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activities.map(activity => {
                      const activityProgress = getActivityProgress(activity.id);
                      return (
                        <div key={activity.id} className="flex items-center justify-between">
                          <span className="text-sm">{activity.title}</span>
                          <Badge variant={activityProgress.status === 'completed' ? 'default' : 'secondary'}>
                            {activityProgress.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}