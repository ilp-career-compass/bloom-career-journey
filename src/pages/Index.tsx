import { logger } from '@/lib/logger';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Users, Target, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';

const Index = () => {
  const { user, userProfile, loading } = useAuth();
  // Force English for landing page
  const lang = 'en' as 'en' | 'kn';

  const strings: Record<'en' | 'kn', Record<string, string>> = {
    en: {
      titleBrandA: 'Career',
      titleBrandB: 'Compass',
      heroTitle: 'Empower Your Career Journey',
      heroDesc: 'Navigate your career journey with confidence. Discover your passion, explore opportunities, and build the future you dream of.',
      cta: 'Get Started',
      sectionTitle: 'Empower Your Career Journey',
      sectionDesc: 'Our comprehensive platform provides everything you need to discover your potential and plan your future',
      card1: 'Self-Discovery Assessments',
      card2: 'Expert Guidance',
      card3: 'Career Planning',
      cta2: 'Start Your Assessment',
      footer: 'All rights reserved.',
    },
    kn: {
      titleBrandA: 'Career',
      titleBrandB: 'Compass',
      heroTitle: 'ನಿಮ್ಮ ವೃತ್ತಿ ಪ್ರಯಾಣವನ್ನು ಶಕ್ತಿಗೊಳಿಸಿ',
      heroDesc: 'ಆತ್ಮವಿಶ್ವಾಸದಿಂದ ನಿಮ್ಮ ವೃತ್ತಿ ಪ್ರಯಾಣವನ್ನು ನಿರ್ವಹಿಸಿ. ನಿಮ್ಮ ಆಸಕ್ತಿಯನ್ನು ಕಂಡುಹಿಡಿಯಿರಿ, ಅವಕಾಶಗಳನ್ನು ಅನ್ವೇಷಿಸಿ, ಮತ್ತು ನಿಮ್ಮ ಭವಿಷ್ಯವನ್ನು ನಿರ್ಮಿಸಿ.',
      cta: 'ಪ್ರಾರಂಭಿಸಿ',
      sectionTitle: 'ನಿಮ್ಮ ವೃತ್ತಿ ಪ್ರಯಾಣವನ್ನು ಶಕ್ತಿಗೊಳಿಸಿ',
      sectionDesc: 'ನಿಮ್ಮ ಸಾಮರ್ಥ್ಯವನ್ನು ಕಂಡುಹಿಡಿಯಲು ಮತ್ತು ಭವಿಷ್ಯವನ್ನು ಯೋಜಿಸಲು ಅಗತ್ಯವಿರುವ ಎಲ್ಲಾ ವಿಷಯಗಳನ್ನು ನಮ್ಮ ವೇದಿಕೆ ಒದಗಿಸುತ್ತದೆ',
      card1: 'ಸ್ವ-ಅನ್ವೇಷಣೆ ಮೌಲ್ಯಮಾಪನಗಳು',
      card2: 'ತಜ್ಞರ ಮಾರ್ಗದರ್ಶನ',
      card3: 'ವೃತ್ತಿ ಯೋಜನೆ',
      cta2: 'ನಿಮ್ಮ ಮೌಲ್ಯಮಾಪನವನ್ನು ಪ್ರಾರಂಭಿಸಿ',
      footer: 'ಎಲ್ಲ ಹಕ್ಕುಗಳು ಮೀಸಲಾಗಿದೆ.',
    }
  };
  const t = (k: string) => strings[lang][k] || strings.en[k] || k;

  useEffect(() => {
    logger.log('Index component mounted');
    logger.log('Auth state:', { user, userProfile, loading });
  }, [user, userProfile, loading]);

  // Redirect authenticated users to their appropriate dashboard
  if (user && userProfile && !loading) {
    const redirectPath = userProfile.role === 'admin' ? '/admin'
      : userProfile.role === 'teacher' ? '/teacher'
        : `/student?lang=${userProfile.preferred_language || 'en'}`;
    logger.log('Redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  if (loading) {
    logger.log('Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  logger.log('Rendering Index component content');
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Hero Section */}
      <section className="relative">
        <div className="container mx-auto px-4 py-12 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-6">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl md:text-6xl font-bold text-foreground mb-4 md:mb-6">
                {t('titleBrandA')}<span className="text-primary">{t('titleBrandB')}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed px-4 md:px-0">{t('heroDesc')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="text-lg px-8">
                  <a href="/auth">
                    {t('cta')}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">{t('sectionTitle')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('sectionDesc')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl mb-2">{t('card1')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Explore your interests, values, and strengths through interactive assessments designed to reveal your unique career path.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl mb-2">{t('card2')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Connect with experienced career counsellors and teachers who provide personalized guidance every step of the way.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl mb-2">{t('card3')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Create actionable career plans with clear milestones, track your progress, and achieve your professional goals.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of students and professionals who have discovered their path with CareerCompass
            </p>
            <Button asChild size="lg" className="text-lg px-8">
              <a href="/auth">
                {t('cta2')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <GraduationCap className="w-6 h-6 text-primary" />
              <span className="text-lg font-semibold">CareerCompass</span>
            </div>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} CareerCompass by ILP. {t('footer')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
