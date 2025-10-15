-- Chat schema: one-to-one student ↔ teacher channels and messages with RLS

-- 1) Tables
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  student_last_read_at timestamptz,
  teacher_last_read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created
  ON public.chat_messages(channel_id, created_at);

-- 2) Helper function for upsert channel
CREATE OR REPLACE FUNCTION public.get_or_create_chat_channel(p_student_id uuid, p_teacher_id uuid)
RETURNS public.chat_channels
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_channel public.chat_channels;
BEGIN
  SELECT * INTO v_channel
  FROM public.chat_channels
  WHERE student_id = p_student_id AND teacher_id = p_teacher_id
  LIMIT 1;

  IF v_channel.id IS NULL THEN
    INSERT INTO public.chat_channels(student_id, teacher_id)
    VALUES (p_student_id, p_teacher_id)
    RETURNING * INTO v_channel;
  END IF;

  RETURN v_channel;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_chat_channel(uuid, uuid) TO authenticated;

-- 3) RLS policies
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Channels: participants (student/teacher) or admin can read/update; anyone can insert only if participant
DROP POLICY IF EXISTS chat_channels_select ON public.chat_channels;
CREATE POLICY chat_channels_select ON public.chat_channels
FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = chat_channels.student_id AND s.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = chat_channels.teacher_id AND t.user_id = auth.uid())
);

DROP POLICY IF EXISTS chat_channels_insert ON public.chat_channels;
CREATE POLICY chat_channels_insert ON public.chat_channels
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = chat_channels.student_id AND s.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = chat_channels.teacher_id AND t.user_id = auth.uid())
);

DROP POLICY IF EXISTS chat_channels_update ON public.chat_channels;
CREATE POLICY chat_channels_update ON public.chat_channels
FOR UPDATE TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = chat_channels.student_id AND s.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = chat_channels.teacher_id AND t.user_id = auth.uid())
)
WITH CHECK (
  public.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = chat_channels.student_id AND s.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = chat_channels.teacher_id AND t.user_id = auth.uid())
);

-- Messages: participants or admin can read/insert their messages
DROP POLICY IF EXISTS chat_messages_select ON public.chat_messages;
CREATE POLICY chat_messages_select ON public.chat_messages
FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.chat_channels c
    JOIN public.students s ON s.id = c.student_id
    JOIN public.teachers t ON t.id = c.teacher_id
    WHERE c.id = chat_messages.channel_id AND (s.user_id = auth.uid() OR t.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS chat_messages_insert ON public.chat_messages;
CREATE POLICY chat_messages_insert ON public.chat_messages
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_channels c
    JOIN public.students s ON s.id = c.student_id
    JOIN public.teachers t ON t.id = c.teacher_id
    WHERE c.id = chat_messages.channel_id AND (s.user_id = auth.uid() OR t.user_id = auth.uid())
  )
  AND chat_messages.sender_user_id = auth.uid()
);


