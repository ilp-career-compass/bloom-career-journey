-- ============================================================
-- Migration: 20260510000005_chat_messages_edit_delete_rls.sql
-- Created: 30 May 2026
-- Description: Add UPDATE and DELETE RLS policies for chat_messages
-- ============================================================

-- ⚠️  UNICODE REMINDER — CRITICAL
-- All Kannada, Tamil, and Hindi text MUST use dollar-quoting.
-- ✅ CORRECT:   value = $ಕನ್ನಡ$
-- ❌ INCORRECT: value = 'ಕನ್ನಡ'

-- ⚠️  DRY-RUN CHECKLIST — review before running `supabase db push`
-- [x] All table names match existing schema exactly
-- [x] All column names are correct
-- [x] RLS policies don't conflict with existing ones
-- [x] Dollar-quoting used for ALL multilingual strings
-- [x] Transaction will not leave DB in partial state if it fails

BEGIN;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS chat_messages_update ON public.chat_messages;
DROP POLICY IF EXISTS chat_messages_delete ON public.chat_messages;

-- Create UPDATE policy: users can update only their own messages
CREATE POLICY chat_messages_update ON public.chat_messages
FOR UPDATE TO authenticated
USING (
  chat_messages.sender_user_id = auth.uid()
)
WITH CHECK (
  chat_messages.sender_user_id = auth.uid()
);

-- Create DELETE policy: users can delete only their own messages
CREATE POLICY chat_messages_delete ON public.chat_messages
FOR DELETE TO authenticated
USING (
  chat_messages.sender_user_id = auth.uid()
);

COMMIT;
