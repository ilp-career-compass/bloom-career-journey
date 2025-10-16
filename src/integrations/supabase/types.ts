export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Helper function return types for state-based architecture
export type StateInfo = {
  state_id: string
  state_name: string
  state_code: string
  org_name: string
}

export type SchoolClass = {
  class_id: string
  class_name: string
}

export type TeacherStudent = {
  student_id: string
  student_name: string
  class_name: string
  enrollment_date: string
  enrollment_status: string
}

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string
          title: string
          description: string
          sequence_number: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          sequence_number: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          sequence_number?: number
          created_at?: string
        }
      }
      assessment_responses: {
        Row: {
          id: string
          student_id: string
          assessment_type: 'inspiration' | 'dreams' | 'school_learning' | 'role_models' | 'hobbies' | 'personality' | 'career_aptitude'
          assessment_title: string
          responses: Json
          completed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          assessment_type: 'inspiration' | 'dreams' | 'school_learning' | 'role_models' | 'hobbies' | 'personality' | 'career_aptitude'
          assessment_title: string
          responses: Json
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          assessment_type?: 'inspiration' | 'dreams' | 'school_learning' | 'role_models' | 'hobbies' | 'personality' | 'career_aptitude'
          assessment_title?: string
          responses?: Json
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          state_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          state_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          state_id?: string
          created_at?: string
        }
      }
      inspiration_sources: {
        Row: {
          id: string
          title: string
          url: string
          description: string | null
          sequence_number: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          url: string
          description?: string | null
          sequence_number?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          url?: string
          description?: string | null
          sequence_number?: number
          is_active?: boolean
          created_at?: string
        }
      }
      orgs: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      states: {
        Row: {
          id: string
          state_name: string
          org_id: string
          state_code: string
          created_at: string
        }
        Insert: {
          id?: string
          state_name: string
          org_id: string
          state_code: string
          created_at?: string
        }
        Update: {
          id?: string
          state_name?: string
          org_id?: string
          state_code?: string
          created_at?: string
        }
      }

      students: {
        Row: {
          id: string
          user_id: string
          class_id: string
          teacher_id: string
          enrollment_date: string
          enrollment_status: 'active' | 'inactive' | 'pending' | 'graduated' | 'transferred'
          previous_school: string | null
          special_needs: string | null
          parent_guardian_name: string | null
          parent_guardian_phone: string | null
          parent_guardian_email: string | null
          parent_guardian_occupation: string | null
          family_income_range: 'below_50000' | '50000_100000' | '100000_200000' | '200000_500000' | 'above_500000' | null
          academic_performance: 'excellent' | 'good' | 'average' | 'below_average' | 'needs_improvement' | null
          attendance_percentage: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          class_id: string
          teacher_id: string
          enrollment_date?: string
          enrollment_status?: 'active' | 'inactive' | 'pending' | 'graduated' | 'transferred'
          previous_school?: string | null
          special_needs?: string | null
          parent_guardian_name?: string | null
          parent_guardian_phone?: string | null
          parent_guardian_email?: string | null
          parent_guardian_occupation?: string | null
          family_income_range?: 'below_50000' | '50000_100000' | '100000_200000' | '200000_500000' | 'above_500000' | null
          academic_performance?: 'excellent' | 'good' | 'average' | 'below_average' | 'needs_improvement' | null
          attendance_percentage?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          class_id?: string
          teacher_id?: string
          enrollment_date?: string
          enrollment_status?: 'active' | 'inactive' | 'pending' | 'graduated' | 'transferred'
          previous_school?: string | null
          special_needs?: string | null
          parent_guardian_name?: string | null
          parent_guardian_phone?: string | null
          parent_guardian_email?: string | null
          parent_guardian_occupation?: string | null
          family_income_range?: 'below_50000' | '50000_100000' | '100000_200000' | '200000_500000' | 'above_500000' | null
          academic_performance?: 'excellent' | 'good' | 'average' | 'below_average' | 'needs_improvement' | null
          attendance_percentage?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      teachers: {
        Row: {
          id: string
          user_id: string
          state_id: string
          specialization: string | null
          experience_years: number
          qualification: string | null
          bio: string | null
          contact_phone: string | null
          contact_email: string | null
          is_active: boolean
          joining_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          state_id: string
          specialization?: string | null
          experience_years?: number
          qualification?: string | null
          bio?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          is_active?: boolean
          joining_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          state_id?: string
          specialization?: string | null
          experience_years?: number
          qualification?: string | null
          bio?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          is_active?: boolean
          joining_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          password_hash: string
          role: 'admin' | 'teacher' | 'student'
          full_name: string
          mobile: string | null
          email: string
          state_id: string | null
          school: string | null
          bio: string | null
          interests: string | null
          career_goals: string | null
          strengths: string | null
          areas_for_growth: string | null
          profile_picture_url: string | null
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          address: string | null
          emergency_contact: string | null
          emergency_contact_relation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          password_hash?: string
          role: 'admin' | 'teacher' | 'student'
          full_name: string
          mobile?: string | null
          email: string
          state_id?: string | null
          school?: string | null
          bio?: string | null
          interests?: string | null
          career_goals?: string | null
          strengths?: string | null
          areas_for_growth?: string | null
          profile_picture_url?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          address?: string | null
          emergency_contact?: string | null
          emergency_contact_relation?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          password_hash?: string
          role?: 'admin' | 'teacher' | 'student'
          full_name?: string
          mobile?: string | null
          email?: string
          state_id?: string | null
          school?: string | null
          bio?: string | null
          interests?: string | null
          career_goals?: string | null
          strengths?: string | null
          areas_for_growth?: string | null
          profile_picture_url?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          address?: string | null
          emergency_contact?: string | null
          emergency_contact_relation?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      counselling_activities: {
        Row: {
          id: string
          title: string
          description: string | null
          sequence_order: number
          category: 'self_discovery' | 'career_exploration' | 'skill_assessment' | 'goal_setting' | 'action_planning'
          duration_minutes: number
          difficulty_level: 'beginner' | 'intermediate' | 'advanced'
          target_grade: '8' | '9' | '10' | '11' | '12' | 'all'
          resource_links: Json
          worksheet_url: string | null
          instructions: string | null
          learning_objectives: string[]
          prerequisites: string[]
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          sequence_order: number
          category: 'self_discovery' | 'career_exploration' | 'skill_assessment' | 'goal_setting' | 'action_planning'
          duration_minutes?: number
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
          target_grade?: '8' | '9' | '10' | '11' | '12' | 'all'
          resource_links?: Json
          worksheet_url?: string | null
          instructions?: string | null
          learning_objectives?: string[]
          prerequisites?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          sequence_order?: number
          category?: 'self_discovery' | 'career_exploration' | 'skill_assessment' | 'goal_setting' | 'action_planning'
          duration_minutes?: number
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
          target_grade?: '8' | '9' | '10' | '11' | '12' | 'all'
          resource_links?: Json
          worksheet_url?: string | null
          instructions?: string | null
          learning_objectives?: string[]
          prerequisites?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      
      student_activity_progress: {
        Row: {
          id: string
          student_id: string
          activity_id: string
          teacher_id: string | null
          status: 'not_started' | 'assigned' | 'in_progress' | 'completed' | 'on_hold'
          assigned_date: string
          started_date: string | null
          completed_date: string | null
          due_date: string | null
          results_data: Json
          counsellor_notes: string | null
          student_feedback: string | null
          completion_percentage: number
          time_spent_minutes: number
          difficulty_rating: number | null
          enjoyment_rating: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          activity_id: string
          teacher_id?: string | null
          status?: 'not_started' | 'assigned' | 'in_progress' | 'completed' | 'on_hold'
          assigned_date?: string
          started_date?: string | null
          completed_date?: string | null
          due_date?: string | null
          results_data?: Json
          counsellor_notes?: string | null
          student_feedback?: string | null
          completion_percentage?: number
          time_spent_minutes?: number
          difficulty_rating?: number | null
          enjoyment_rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          activity_id?: string
          teacher_id?: string | null
          status?: 'not_started' | 'assigned' | 'in_progress' | 'completed' | 'on_hold'
          assigned_date?: string
          started_date?: string | null
          completed_date?: string | null
          due_date?: string | null
          results_data?: Json
          counsellor_notes?: string | null
          student_feedback?: string | null
          completion_percentage?: number
          time_spent_minutes?: number
          difficulty_rating?: number | null
          enjoyment_rating?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      
      student_notes: {
        Row: {
          id: string
          student_id: string
          teacher_id: string | null
          note_type: 'observation' | 'meeting' | 'progress' | 'concern' | 'achievement' | 'follow_up'
          title: string
          content: string
          is_private: boolean
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          teacher_id?: string | null
          note_type: 'observation' | 'meeting' | 'progress' | 'concern' | 'achievement' | 'follow_up'
          title: string
          content: string
          is_private?: boolean
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          teacher_id?: string | null
          note_type?: 'observation' | 'meeting' | 'progress' | 'concern' | 'achievement' | 'follow_up'
          title?: string
          content?: string
          is_private?: boolean
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      
      student_groups: {
        Row: {
          id: string
          name: string
          description: string | null
          teacher_id: string
          state_id: string
          class_id: string
          max_students: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          teacher_id: string
          state_id: string
          class_id: string
          max_students?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          teacher_id?: string
          state_id?: string
          class_id?: string
          max_students?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      
      counselling_resources: {
        Row: {
          id: string
          title: string
          description: string | null
          type: 'pdf' | 'video' | 'chart' | 'slides' | 'worksheet' | 'template' | 'guide'
          file_url: string | null
          thumbnail_url: string | null
          file_size_bytes: number | null
          duration_minutes: number | null
          tags: string[]
          target_audience: 'students' | 'teachers' | 'parents' | 'all'
          grade_level: '8' | '9' | '10' | '11' | '12' | 'all'
          is_active: boolean
          download_count: number
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          type: 'pdf' | 'video' | 'chart' | 'slides' | 'worksheet' | 'template' | 'guide'
          file_url?: string | null
          thumbnail_url?: string | null
          file_size_bytes?: number | null
          duration_minutes?: number | null
          tags?: string[]
          target_audience?: 'students' | 'teachers' | 'parents' | 'all'
          grade_level?: '8' | '9' | '10' | '11' | '12' | 'all'
          is_active?: boolean
          download_count?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: 'pdf' | 'video' | 'chart' | 'slides' | 'worksheet' | 'template' | 'guide'
          file_url?: string | null
          thumbnail_url?: string | null
          file_size_bytes?: number | null
          duration_minutes?: number | null
          tags?: string[]
          target_audience?: 'students' | 'teachers' | 'parents' | 'all'
          grade_level?: '8' | '9' | '10' | '11' | '12' | 'all'
          is_active?: boolean
          download_count?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      
      chat_channels: {
        Row: {
          id: string
          student_id: string
          teacher_id: string
          last_message_at: string
          student_last_read_at: string | null
          teacher_last_read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          teacher_id: string
          last_message_at?: string
          student_last_read_at?: string | null
          teacher_last_read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          teacher_id?: string
          last_message_at?: string
          student_last_read_at?: string | null
          teacher_last_read_at?: string | null
          created_at?: string
        }
      }
      
      chat_messages: {
        Row: {
          id: string
          channel_id: string
          sender_user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          sender_user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          sender_user_id?: string
          content?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_chat_channel: {
        Args: {
          p_student_id: string
          p_teacher_id: string
        }
        Returns: {
          id: string
          student_id: string
          teacher_id: string
          last_message_at: string
          student_last_read_at: string | null
          teacher_last_read_at: string | null
          created_at: string
        }
      }
      get_student_assessment_responses: {
        Args: {
          teacher_user_id: string
          assessment_type_filter?: 'inspiration' | 'dreams' | 'school_learning' | 'role_models' | 'hobbies' | 'personality' | 'career_aptitude'
        }
        Returns: {
          student_name: string
          student_class: string
          assessment_title: string
          responses: Json
          completed_at: string
        }[]
      }
    }
    Enums: {
      assessment_type: 'inspiration' | 'dreams' | 'school_learning' | 'role_models' | 'hobbies' | 'personality' | 'career_aptitude'
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student"],
    },
  },
} as const
