-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Create users table for authentication
CREATE TABLE public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role app_role NOT NULL DEFAULT 'student',
    full_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create orgs table
CREATE TABLE public.orgs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create schools table
CREATE TABLE public.schools (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create classes table
CREATE TABLE public.classes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create activities table
CREATE TABLE public.activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    sequence_number INTEGER NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create teachers table
CREATE TABLE public.teachers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create student activity progress table
CREATE TABLE public.student_activity_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('locked', 'unlocked', 'completed')) DEFAULT 'locked',
    results TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(student_id, activity_id)
);

-- Enable RLS on all tables
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for teachers (can view their school data and students)
CREATE POLICY "Teachers can view orgs" ON public.orgs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can view schools" ON public.schools
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can view classes" ON public.classes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can view activities" ON public.activities
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can view their own data" ON public.teachers
    FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for students
CREATE POLICY "Students can view their own data" ON public.students
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Students can view their progress" ON public.student_activity_progress
    FOR SELECT USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can update their progress" ON public.student_activity_progress
    FOR UPDATE USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Teachers can view and update their students' progress
CREATE POLICY "Teachers can view student progress" ON public.student_activity_progress
    FOR SELECT USING (student_id IN (SELECT s.id FROM public.students s JOIN public.teachers t ON s.teacher_id = t.id WHERE t.user_id = auth.uid()));

CREATE POLICY "Teachers can update student progress" ON public.student_activity_progress
    FOR UPDATE USING (student_id IN (SELECT s.id FROM public.students s JOIN public.teachers t ON s.teacher_id = t.id WHERE t.user_id = auth.uid()));

-- Admin policies (can do everything)
CREATE POLICY "Admins have full access to all tables" ON public.orgs
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to schools" ON public.schools
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to classes" ON public.classes
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to activities" ON public.activities
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to teachers" ON public.teachers
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to students" ON public.students
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to student progress" ON public.student_activity_progress
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Insert seed data
INSERT INTO public.orgs (name) VALUES ('ILP');

-- Get the org ID for ILP
INSERT INTO public.schools (org_id, name) 
SELECT id, 'ILP-Tamil Nadu' FROM public.orgs WHERE name = 'ILP'
UNION ALL
SELECT id, 'ILP-Karnataka' FROM public.orgs WHERE name = 'ILP'
UNION ALL
SELECT id, 'ILP-Andhra Pradesh' FROM public.orgs WHERE name = 'ILP'
UNION ALL
SELECT id, 'ILP-Telangana' FROM public.orgs WHERE name = 'ILP'
UNION ALL
SELECT id, 'ILP-Bihar' FROM public.orgs WHERE name = 'ILP'
UNION ALL
SELECT id, 'ILP-Jharkhand' FROM public.orgs WHERE name = 'ILP'
UNION ALL
SELECT id, 'ILP-Odisha' FROM public.orgs WHERE name = 'ILP';

-- Insert classes for each school
INSERT INTO public.classes (school_id, name)
SELECT s.id, c.class_name
FROM public.schools s
CROSS JOIN (
    VALUES ('Class 8'), ('Class 9'), ('Class 10'), ('Class 11'), ('Class 12')
) AS c(class_name);

-- Insert activities
INSERT INTO public.activities (title, description, sequence_number) VALUES
('MY INSPIRATION', 'Discover what inspires and motivates you in your career journey.', 1),
('MY DREAMS', 'Explore your career dreams and aspirations for the future.', 2),
('MY SCHOOL', 'Understand how your school experience shapes your career choices.', 3),
('MY ROLE MODELS', 'Identify role models who influence your career decisions.', 4),
('MY HOBBIES', 'Connect your hobbies and interests to potential career paths.', 5);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();