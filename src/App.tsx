import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from './components/ProtectedRoute';
import Index from './pages/Index';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentSummary from './pages/StudentSummary';
import NotFound from './pages/NotFound';
import MyInspirationAssessment from './components/assessments/MyInspirationAssessment';
import MyDreamsAssessment from './components/assessments/MyDreamsAssessment';
import MySchoolLearningAssessment from './components/assessments/MySchoolLearningAssessment';
import MyRoleModelsAssessment from './components/assessments/MyRoleModelsAssessment';
import MyHobbiesAssessment from './components/assessments/MyHobbiesAssessment';
import AudioTestPage from './pages/AudioTestPage';
import HollandTest from './pages/HollandTest';
import { useEffect, Component, ErrorInfo, ReactNode } from 'react';

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-800 mb-4">Something went wrong</h1>
            <p className="text-red-600 mb-4">The application encountered an error.</p>
            <pre className="text-sm text-red-500 bg-red-100 p-4 rounded overflow-auto max-w-md">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  useEffect(() => {
    console.log('App component mounted');
    console.log('Environment check:', {
      NODE_ENV: import.meta.env.NODE_ENV,
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
    });
    
    // Test if basic React rendering works
    console.log('Basic React test - if you see this, React is working');
    
    // Test if DOM is accessible
    if (typeof document !== 'undefined') {
      console.log('DOM is accessible');
      console.log('Document title:', document.title);
    }
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <div className="App">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Audio Test Route */}
              <Route path="/audio-test" element={<AudioTestPage />} />
              
              {/* Assessment Routes */}
              <Route 
                path="/assessment/inspiration" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyInspirationAssessment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assessment/dreams" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyDreamsAssessment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assessment/school-learning" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MySchoolLearningAssessment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assessment/role-models" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyRoleModelsAssessment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assessment/hobbies" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyHobbiesAssessment />
                  </ProtectedRoute>
                } 
              />

              {/* Psychometric Test Route */}
              <Route
                path="/holland-test"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <HollandTest />
                  </ProtectedRoute>
                }
              />
              
              {/* Dashboard Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teacher" 
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/student/:id/summary"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <StudentSummary />
                  </ProtectedRoute>
                }
              />
              
              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
