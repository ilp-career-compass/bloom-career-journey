import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  School, 
  BookOpen, 
  UserPlus,
  LogOut,
  Trash2,
  Edit,
  Plus,
  Upload,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: string;
  name: string;
  created_at: string;
}

interface School {
  id: string;
  name: string;
  orgs: { name: string };
  created_at: string;
}

interface Teacher {
  id: string;
  users: {
    full_name: string;
    mobile: string;
  };
  states: {
    name: string;
  };
  classes?: {
    name: string;
  };
}

interface Student {
  id: string;
  users: {
    full_name: string;
    mobile: string;
  };
  classes: {
    name: string;
    states: {
      name: string;
    };
  };
  teachers: {
    users: {
      full_name: string;
    };
    is_default?: boolean;
  };
}

export default function AdminDashboard() {
  const { userProfile, signOut } = useAuth();
  const { toast } = useToast();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [states, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showMentorOnly, setShowMentorOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  // Chat viewer removed as per request
  
  // Form states
  const [newOrgName, setNewOrgName] = useState('');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [selectedOrgForSchool, setSelectedOrgForSchool] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('orgs')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      // Fetch states
      const { data: statesData, error: statesError } = await supabase
        .from('states')
        .select('*, orgs:org_id(name)')
        .order('created_at', { ascending: false });

      if (statesError) throw statesError;

      // Fetch teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select(`
          *,
          users:user_id(full_name, mobile),
          states:state_id(name),
          classes:class_id(name)
        `)
        .order('created_at', { ascending: false });

      if (teachersError) throw teachersError;

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          users:user_id(full_name, mobile),
          classes:class_id(name, states:state_id(name)),
          teachers:teacher_id(users:user_id(full_name), is_default)
        `)
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;

      setOrganizations(orgsData || []);
      setSchools(statesData || []);
      setTeachers(teachersData || []);
      setStudents(studentsData || []);
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

  const createOrganization = async () => {
    if (!newOrgName.trim()) return;

    try {
      const { error } = await supabase
        .from('orgs')
        .insert({ name: newOrgName.trim() });

      if (error) throw error;

      toast({
        title: "Organization Created",
        description: `${newOrgName} has been created successfully`,
      });

      setNewOrgName('');
      fetchData();
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: "Failed to create organization",
        variant: "destructive",
      });
    }
  };

  const createSchool = async () => {
    if (!newSchoolName.trim() || !selectedOrgForSchool) return;

    try {
      const { error } = await supabase
        .from('states')
        .insert({ 
          name: newSchoolName.trim(),
          org_id: selectedOrgForSchool
        });

      if (error) throw error;

      toast({
        title: "School Created",
        description: `${newSchoolName} has been created successfully`,
      });

      setNewSchoolName('');
      setSelectedOrgForSchool('');
      fetchData();
    } catch (error) {
      console.error('Error creating state:', error);
      toast({
        title: "Error",
        description: "Failed to create state",
        variant: "destructive",
      });
    }
  };

  const deleteOrganization = async (id: string) => {
    if (!confirm('Are you sure? This will delete all associated states and data.')) return;

    try {
      const { error } = await supabase
        .from('orgs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Organization Deleted",
        description: "Organization has been deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({
        title: "Error",
        description: "Failed to delete organization",
        variant: "destructive",
      });
    }
  };

  const deleteSchool = async (id: string) => {
    if (!confirm('Are you sure? This will delete all associated classes and data.')) return;

    try {
      const { error } = await supabase
        .from('states')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "School Deleted",
        description: "School has been deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting state:', error);
      toast({
        title: "Error",
        description: "Failed to delete state",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">CareerCompass Administration Panel</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizations.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Schools</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{states.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachers.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>

          {/* Under ILP Mentor analytics */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-teal-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-600 text-sm font-medium">Under ILP Mentor</p>
                  <p className="text-3xl font-bold text-teal-800">{students.filter(s => s.teachers?.is_default).length}</p>
                </div>
                <Users className="w-8 h-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="organizations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="states">Schools</TabsTrigger>
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="organizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Organization</CardTitle>
                <CardDescription>Add a new organization to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Organization name"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                    />
                  </div>
                  <Button onClick={createOrganization} disabled={!newOrgName.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map(org => (
                      <TableRow key={org.id}>
                        <TableCell>{org.name}</TableCell>
                        <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="destructive" size="sm" onClick={() => deleteOrganization(org.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="states" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New School</CardTitle>
                <CardDescription>Add a new state to an organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="School name"
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Select value={selectedOrgForSchool} onValueChange={setSelectedOrgForSchool}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map(org => (
                          <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createSchool} disabled={!newSchoolName.trim() || !selectedOrgForSchool}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schools</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {states.map(state => (
                      <TableRow key={state.id}>
                        <TableCell>{state.name}</TableCell>
                        <TableCell>{state.orgs?.name}</TableCell>
                        <TableCell>{new Date(state.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="destructive" size="sm" onClick={() => deleteSchool(state.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Teachers</CardTitle>
                <CardDescription>Manage teacher accounts and assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map(teacher => (
                      <TableRow key={teacher.id}>
                        <TableCell>{teacher.users?.full_name}</TableCell>
                        <TableCell>{teacher.users?.mobile}</TableCell>
                        <TableCell>{teacher.states?.name}</TableCell>
                        <TableCell>{teacher.classes?.name || 'Unassigned'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Students</CardTitle>
                <CardDescription>Manage student accounts and assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">Filters</div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={showMentorOnly} onChange={(e)=> setShowMentorOnly(e.target.checked)} />
                      Students under ILP Mentor (Unassigned)
                    </label>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Teacher</TableHead>
                      
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(showMentorOnly ? students.filter(s => s.teachers?.is_default) : students).map(student => (
                      <TableRow key={student.id}>
                        <TableCell>{student.users?.full_name}</TableCell>
                        <TableCell>{student.users?.mobile}</TableCell>
                        <TableCell>{student.classes?.states?.name}</TableCell>
                        <TableCell>{student.classes?.name}</TableCell>
                        <TableCell>{student.teachers?.users?.full_name}</TableCell>
                        
                        <TableCell>
                          <Badge variant="secondary">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Reports</CardTitle>
                <CardDescription>Generate reports and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Students under ILP Mentor by State</CardTitle>
                        <CardDescription>Current distribution</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>State</TableHead>
                              <TableHead className="text-right">Count</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              const byState: Record<string, number> = {};
                              students.filter(s => s.teachers?.is_default).forEach(s => {
                                const key = s.classes?.states?.name || '—';
                                byState[key] = (byState[key] || 0) + 1;
                              });
                              const rows = Object.entries(byState).sort((a,b)=> a[0].localeCompare(b[0]));
                              return rows.length ? rows.map(([state, count]) => (
                                <TableRow key={state}>
                                  <TableCell>{state}</TableCell>
                                  <TableCell className="text-right">{count}</TableCell>
                                </TableRow>
                              )) : (
                                <TableRow>
                                  <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">No data</TableCell>
                                </TableRow>
                              );
                            })()}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Overview</CardTitle>
                        <CardDescription>Mentor assignment snapshot</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span>Under ILP Mentor</span>
                            <span className="font-medium">{students.filter(s => s.teachers?.is_default).length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Total Students</span>
                            <span className="font-medium">{students.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
      </main>
    </div>
  );
}