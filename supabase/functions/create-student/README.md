# create-student Edge Function

Supabase Edge Function that creates student accounts with real Supabase Auth credentials. Replaces the old direct-DB-insert flow that created students without auth accounts.

## Input

```
POST /create-student
Authorization: Bearer <teacher_jwt>

{
  "students": [
    {
      "fullName": "Asha Kumar",
      "phone": "+919876543210",
      "grade": "9",
      "preferredLanguage": "en",
      "teacherId": "<teachers.id>",
      "stateId": "<states.id>"
    }
  ],
  "teacherUserId": "<users.id of teacher>"
}
```

## Output

```json
{
  "created": [
    { "fullName": "Asha Kumar", "phone": "+919876543210", "userId": "<uuid>" }
  ],
  "errors": [
    { "fullName": "Ravi M", "phone": "+91invalid", "reason": "Invalid phone format..." }
  ]
}
```

## Per-student logic

1. Validate phone is E.164 format (`+` followed by 10-15 digits)
2. Check `users.mobile` for duplicate
3. Resolve `classes.id` from `'Class ' + grade` + `state_id`
4. `auth.admin.createUser()` with phone + random 16-char password
5. Insert `public.users` (id = auth user id)
6. Upsert `public.students` (onConflict: user_id)
7. Upsert `public.student_auth_credentials` (onConflict: user_id)
8. On DB failure, rollback auth user via `auth.admin.deleteUser()`

## Deploy

```bash
supabase functions deploy create-student
```

## Environment variables

- `SUPABASE_URL` - auto-injected by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - auto-injected by Supabase

No additional configuration needed. These are available in all Supabase Edge Functions by default.
