# Supabase Authentication Setup

## Disable Email Confirmation

To allow users to sign up and login immediately without email confirmation, follow these steps:

### Steps to Disable Email Confirmation:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Find the **Email Settings** section
4. **Uncheck** the option "Confirm email"
5. Click **Save**

### Alternative: Using Supabase CLI

If you prefer using the CLI, update your `supabase/config.toml`:

```toml
[auth.email]
enable_signup = true
double_confirm_changes = false
enable_confirmations = false  # This disables email confirmation
```

## Password Security

Passwords are automatically hashed by Supabase Auth using bcrypt. You don't need to manually hash passwords in your application code.

## Current Auth Configuration

The application is configured to:
- ✅ Use email/password authentication
- ✅ Sign up users immediately without email confirmation
- ✅ Store user data in the `users` table
- ✅ Hash passwords automatically via Supabase Auth
- ✅ Support password reset via email

## Testing Authentication

1. **Sign Up**: Users can register with email, password, name, and optional phone
2. **Login**: Users can login immediately after signup
3. **Forgot Password**: Users receive password reset links via email
4. **Profile**: User data is stored in the `users` table with proper RLS policies

## Important Notes

- Email confirmation is **disabled** for instant access
- Passwords are stored securely and hashed by Supabase
- User IDs are automatically created and linked to `auth.users`
- Row Level Security (RLS) is enabled on all tables
