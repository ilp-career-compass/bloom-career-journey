-- ============================================================
-- Migration: 20260605000001_chat_messages_edit_delete_rpcs.sql
-- Description: Security-definer RPCs for chat message edit/delete
--              + ensure RLS UPDATE/DELETE policies exist
-- ============================================================

BEGIN;

-- ============================================================
-- 1. RLS policies for UPDATE / DELETE (idempotent)
-- ============================================================

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_messages_update ON public.chat_messages;
CREATE POLICY chat_messages_update ON public.chat_messages
FOR UPDATE TO authenticated
USING  (chat_messages.sender_user_id = auth.uid())
WITH CHECK (chat_messages.sender_user_id = auth.uid());

DROP POLICY IF EXISTS chat_messages_delete ON public.chat_messages;
CREATE POLICY chat_messages_delete ON public.chat_messages
FOR DELETE TO authenticated
USING (chat_messages.sender_user_id = auth.uid());

-- ============================================================
-- 2. Security-definer RPC: edit_chat_message
--    Updates message content only if the caller is the sender.
--    Returns TRUE on success, FALSE if the message was not found
--    or the caller is not the owner.
-- ============================================================

CREATE OR REPLACE FUNCTION public.edit_chat_message(
  p_message_id uuid,
  p_new_content text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_affected integer;
BEGIN
  UPDATE public.chat_messages
  SET    content = p_new_content
  WHERE  id              = p_message_id
    AND  sender_user_id  = auth.uid();

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  RETURN v_rows_affected > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.edit_chat_message(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.edit_chat_message(uuid, text) TO authenticated;

-- ============================================================
-- 3. Security-definer RPC: delete_chat_message
--    Deletes message only if the caller is the sender.
--    Returns TRUE on success, FALSE otherwise.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_chat_message(
  p_message_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_affected integer;
BEGIN
  DELETE FROM public.chat_messages
  WHERE  id             = p_message_id
    AND  sender_user_id = auth.uid();

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  RETURN v_rows_affected > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_chat_message(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.delete_chat_message(uuid) TO authenticated;

COMMIT;
