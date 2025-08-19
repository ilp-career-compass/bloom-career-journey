# Authentication System Update: Mobile + Email Support

## Overview
This update modifies the CareerCompass authentication system to support both mobile numbers and email addresses for user login and registration.

## Changes Made

### 1. Database Schema Updates
- **New Migration File**: `supabase/migrations/20250815192000_add_email_support.sql`
- **Users Table**: Added `email` column, made `mobile` optional
- **Constraints**: Added validation for email format and mobile format
- **Indexes**: Added performance indexes for both fields

### 2. Frontend Updates

#### AuthPage.tsx
- **Sign In Form**: Changed from "Mobile Number" to "Email or Mobile Number"
- **Sign Up Form**: Single "Email Address / Mobile Number" field (automatically detects type)
- **Form Validation**: Updated to handle both identifier types

#### useAuth.tsx Hook
- **signIn Function**: Now accepts either email or mobile as identifier
- **signUp Function**: Updated to handle both mobile and email
- **User Detection**: Automatically detects if identifier is email or mobile

#### TypeScript Types
- **Database Types**: Updated `users` table schema to include email field
- **Interface Updates**: Modified AuthContextType to support new parameters

## How to Apply Changes

### Step 1: Run Database Migration
```bash
# Navigate to your Supabase project
cd supabase

# Apply the migration
supabase db push
```

### Step 2: Update Existing Users (Optional)
The migration automatically converts existing mobile-only users to have email addresses in the format `mobile@internal.app`. If you want to update these to real email addresses, you can run:

```sql
-- Update users with generated emails to have real emails
UPDATE users 
SET email = 'real.email@example.com' 
WHERE email LIKE '%@internal.app';
```

### Step 3: Test the Changes
1. **Test Sign In**: Try logging in with both mobile and email
2. **Test Sign Up**: Create new accounts with email only, or email + mobile
3. **Verify Backward Compatibility**: Existing users should still be able to login

## New Authentication Flow

### Sign In
1. User enters email OR mobile number
2. System automatically detects the type
3. Authentication proceeds with the appropriate method

### Sign Up
1. User provides email address OR mobile number in a single field
2. System automatically detects the type and creates appropriate account
3. Email is always required for Supabase auth (generated if mobile-only provided)
4. **Phase 1**: User is automatically signed in and redirected to dashboard
5. **Phase 2**: User receives email confirmation link (future implementation)

## Database Schema Changes

### Before
```sql
users (
  id UUID PRIMARY KEY,
  mobile VARCHAR(15) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role app_role NOT NULL,
  full_name TEXT NOT NULL,
  -- ... other fields
)
```

### After
```sql
users (
  id UUID PRIMARY KEY,
  mobile VARCHAR(15) NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role app_role NOT NULL,
  full_name TEXT NOT NULL,
  -- ... other fields
  CONSTRAINT users_mobile_or_email_check CHECK (mobile IS NOT NULL OR email IS NOT NULL)
)
```

## Validation Rules

### Email Format
- Must be a valid email address format
- Uses regex: `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`

### Mobile Format
- Must be exactly 10 digits
- Uses regex: `^[0-9]{10}$`
- Optional field (can be NULL if email is provided)

## Security Considerations

1. **Unique Constraints**: Both email and mobile are unique when present
2. **RLS Policies**: Updated to work with new schema
3. **Input Validation**: Frontend and backend validation for both fields
4. **Backward Compatibility**: Existing users can still login with mobile

## Testing Checklist

- [ ] Sign in with mobile number (existing users)
- [ ] Sign in with email address (existing users)
- [ ] Sign up with email only
- [ ] Sign up with email + mobile
- [ ] Verify error handling for invalid formats
- [ ] Test duplicate email/mobile validation
- [ ] Verify existing user data integrity

## Rollback Plan

If you need to rollback these changes:

1. **Database Rollback**:
   ```sql
   -- Remove email column and constraints
   ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_format_check;
   ALTER TABLE users DROP CONSTRAINT IF EXISTS users_mobile_format_check;
   ALTER TABLE users DROP CONSTRAINT IF EXISTS users_mobile_or_email_check;
   ALTER TABLE users DROP COLUMN email;
   ALTER TABLE users ALTER COLUMN mobile SET NOT NULL;
   ```

2. **Frontend Rollback**: Revert the changes in AuthPage.tsx and useAuth.tsx

## Phase 1: Simplified Authentication (No Email Confirmation)

### How It Works
1. **Registration**: User signs up with email or mobile
2. **Email Generation**: If mobile-only, system generates `mobile@internal.app`
3. **Auto Sign-In**: User is automatically signed in after registration
4. **Dashboard Access**: User can immediately access their dashboard

### Phase 2: Email Confirmation (Future)
- Email confirmation will be added in a future phase
- Users will need to verify their email before accessing the dashboard
- More secure but requires additional user steps

## Notes

- The system maintains backward compatibility for existing users
- Mobile numbers are now optional during registration
- Email addresses are required for all new accounts
- The migration handles existing data gracefully
- Performance is maintained with proper indexing
- Email confirmation is required for security
