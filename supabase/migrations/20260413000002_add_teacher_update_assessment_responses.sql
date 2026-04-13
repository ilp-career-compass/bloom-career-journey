-- Allow teachers to update review_status on assessment_responses for their students
CREATE POLICY "ar_update_teacher" ON public.assessment_responses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN teachers t ON t.id = s.teacher_id
    WHERE s.id = assessment_responses.student_id
    AND t.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students s
    JOIN teachers t ON t.id = s.teacher_id
    WHERE s.id = assessment_responses.student_id
    AND t.user_id = auth.uid()
  )
);
