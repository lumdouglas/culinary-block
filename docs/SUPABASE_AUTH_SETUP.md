# Supabase Auth Setup — Invite Flow

This guide explains why invite links redirect to login and how to configure Supabase correctly.

---

## Why Does It Redirect to Login?

The invite flow has several steps. If any step fails, the user ends up on `/login` after ~6 seconds:

1. **Admin approves** → `inviteUserByEmail()` sends email with `redirectTo: {SITE_URL}/auth/callback?next=/account-setup`
2. **User clicks "Complete Setup"** → Supabase verifies the token and redirects to your callback URL
3. **Supabase sends tokens** in one of two ways:
   - **PKCE:** `?code=...` in the URL (server exchanges for session, sets cookies)
   - **Implicit:** `#access_token=...&refresh_token=...` in the URL hash (client must call `setSession()`)
4. **Your app** must either exchange the code (server) or read the hash and call `setSession()` (client)
5. **If no session is established** within 6 seconds → account-setup page redirects to `/login`

---

## Supabase Dashboard Checklist

### 1. URL Configuration

Go to **Authentication → URL Configuration** in your Supabase project.

| Setting | Value |
|---------|-------|
| **Site URL** | `https://www.culinaryblock.com` (production) or `http://localhost:3000` (local) |
| **Redirect URLs** | Add these (one per line): |
| | `https://www.culinaryblock.com/auth/callback` |
| | `https://www.culinaryblock.com/**` |
| | `http://localhost:3000/auth/callback` |

The redirect URL must **exactly match** what your app sends in `redirectTo`. Wildcards like `/**` allow subpaths.

### 2. Email Templates (optional)

Go to **Authentication → Email Templates → Invite user**.

The default template uses `{{ .ConfirmationURL }}`, which includes your `redirectTo`. You don't need to change it unless customizing the email.

---

## Environment Variables

### Local (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://avuxqlbmckkdkcoydrkx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production (Vercel / `.env.production`)

```
NEXT_PUBLIC_SUPABASE_URL=https://avuxqlbmckkdkcoydrkx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://www.culinaryblock.com
```

**Critical:** `NEXT_PUBLIC_SITE_URL` must be set in production. If it's missing, the invite email will have a broken redirect URL.

---

## Verify Your Setup

1. **Check Vercel env vars:** Project Settings → Environment Variables → ensure `NEXT_PUBLIC_SITE_URL=https://www.culinaryblock.com` for Production
2. **Send a fresh invite** after any config change (old invite links use the old redirect URL)
3. **Use an unexpired link** — invite links expire (typically 24h); request a new one if needed

---

## Flow Diagram

```
Admin approves
    ↓
inviteUserByEmail(email, { redirectTo: SITE_URL/auth/callback?next=/account-setup })
    ↓
User receives email, clicks "Complete Setup"
    ↓
Supabase verify page → redirects to SITE_URL/auth/callback?next=/account-setup
    (with ?code=... OR #access_token=...&refresh_token=...)
    ↓
/auth/callback route:
  - If code: exchangeCodeForSession → set cookies on redirect → redirect to /account-setup
  - If no code: return HTML that does client redirect to /account-setup + hash (preserves tokens)
    ↓
/account-setup page:
  - If hash has access_token + refresh_token: setSession() → show password form
  - If hash has error: redirect to /login?error=...
  - If getSession() finds session: show password form
  - Else after 6s: redirect to /login
```
