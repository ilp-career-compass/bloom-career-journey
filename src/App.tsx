import { logger } from '@/lib/logger';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { LangProvider } from './hooks/useLang';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from './components/ProtectedRoute';
import Index from './pages/Index';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CareersExplore from './pages/CareersExplore';
import StudentSummary from './pages/StudentSummary';
import NotFound from './pages/NotFound';
import ProfileCardPage from './pages/ProfileCardPage';
import CareerRoadmapPage from './pages/CareerRoadmapPage';
import ThingsInterestMePage from './pages/ThingsInterestMePage';
import TeacherStudentRoadmapPage from './pages/TeacherStudentRoadmapPage';
import TeacherStudentInterestsPage from './pages/TeacherStudentInterestsPage';
import TeacherStudentResponsesPage from './pages/TeacherStudentResponsesPage';
import MyInspirationAssessment from './components/assessments/MyInspirationAssessment';
import MyDreamsAssessment from './components/assessments/MyDreamsAssessment';
import MySchoolLearningAssessment from './components/assessments/MySchoolLearningAssessment';
import MyRoleModelsAssessment from './components/assessments/MyRoleModelsAssessment';
import MyHobbiesAssessment from './components/assessments/MyHobbiesAssessment';
import AboutMeAssessment from './components/assessments/AboutMeAssessment';
import HollandCodeAssessment from './components/assessments/HollandCodeAssessment';
import CareerGuidanceToolsAssessment from './components/assessments/CareerGuidanceToolsAssessment';
import AudioTestPage from './pages/AudioTestPage';
import HollandCodeTest from './components/HollandCodeTest';
import AssessmentTestPage from './pages/AssessmentTestPage';
import DatabaseTestPage from './pages/DatabaseTestPage';
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
    logger.error('Error caught by boundary:', error, errorInfo);
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
    logger.log('App component mounted');
    logger.log('Environment check:', {
      NODE_ENV: import.meta.env.NODE_ENV,
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    });
    
    // Check all VITE_ env vars
    const viteEnvVars = Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'));
    logger.log('🔍 All VITE_ environment variables:', viteEnvVars);
    
    // Test if basic React rendering works
    logger.log('Basic React test - if you see this, React is working');
    
    // Test if DOM is accessible
    if (typeof document !== 'undefined') {
      logger.log('DOM is accessible');
      logger.log('Document title:', document.title);
    }
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <LangProvider>
          <div className="App">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Audio Test Route */}
              <Route path="/audio-test" element={<AudioTestPage />} />
              
              {/* Assessment Test Route */}
              <Route path="/assessment-test" element={<AssessmentTestPage />} />
              
              {/* Database Test Route */}
              <Route path="/database-test" element={<DatabaseTestPage />} />
              
              {/* Assessment Routes */}
              {/* Legacy direct assessment routes (kept for backward compatibility) */}
              <Route 
                path="/assessment/inspiration" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyInspirationAssessment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assessment/about-me" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <AboutMeAssessment />
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
              <Route 
                path="/assessment/holland-code" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <HollandCodeAssessment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assessment/career-guidance-tools" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <CareerGuidanceToolsAssessment />
                  </ProtectedRoute>
                } 
              />

              {/* Nested student assessment routes for deep-linking */}
              <Route 
                path="/student/assessment/inspiration" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyInspirationAssessment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/assessment/about-me" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <AboutMeAssessment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/assessment/dreams" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyDreamsAssessment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/assessment/school-learning" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MySchoolLearningAssessment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/assessment/role-models" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyRoleModelsAssessment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/assessment/hobbies" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyHobbiesAssessment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/assessment/holland-code" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <HollandCodeAssessment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/assessment/career-guidance-tools" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <CareerGuidanceToolsAssessment />
                  </ProtectedRoute>
                } 
              />

              {/* Psychometric Test Route */}
              <Route
                path="/holland-test"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <HollandCodeTest />
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
                path="/careers"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <CareersExplore />
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

              {/* My Compass routes */}
              <Route
                path="/student/profile-card"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ProfileCardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/things-interest-me"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ThingsInterestMePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/career-roadmap"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <CareerRoadmapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/student-profile-card/:studentId"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <ProfileCardPage readOnly />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/student-roadmap/:studentId"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherStudentRoadmapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/student-interests/:studentId"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherStudentInterestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/student-responses/:studentId"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherStudentResponsesPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
          </LangProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
