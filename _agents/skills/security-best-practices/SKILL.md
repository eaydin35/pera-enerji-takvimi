---
name: security-best-practices
description: Use when implementing features that handle sensitive data, authentication, payments, or API calls.
---

# Security Best Practices Skill

## Golden Rules
1. **Never hardcode secrets** — Use `.env` files
2. **Never trust client input** — Validate everything
3. **Never store sensitive data in AsyncStorage** — Use `expo-secure-store`
4. **Never log sensitive data** — No tokens, passwords, personal info in logs
5. **Always use HTTPS** — No exceptions

## Secure Storage

### ✅ Do: Use expo-secure-store for tokens
```tsx
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('session_token', token);
const token = await SecureStore.getItemAsync('session_token');
```

### ❌ Don't: Use AsyncStorage for sensitive data
```tsx
// NEVER do this for tokens/passwords
await AsyncStorage.setItem('token', sensitiveValue);
```

## Environment Variables
```
# .env (never committed)
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...

# Server-side secrets (NEVER use EXPO_PUBLIC_ prefix)
SUPABASE_SERVICE_KEY=...
```

### Rules
- `EXPO_PUBLIC_` prefix: OK for public keys (anon key, public API endpoints)
- No prefix: Server-side only, never exposed to client
- Always check `.gitignore` includes `.env`

## Supabase Security

### Row Level Security (RLS)
Every table MUST have RLS enabled:
```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users read own data" ON my_table
  FOR SELECT USING (auth.uid() = user_id);
```

### Service Role Key
- NEVER use the service_role key in client code
- Only use in server-side functions or Edge Functions

## Input Validation
```tsx
// Validate before sending to API
const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const sanitizeInput = (input: string): string =>
  input.trim().replace(/[<>]/g, '');
```

## Dependency Security
```bash
# Regular security audit
npm audit

# Fix known vulnerabilities
npm audit fix
```

## Checklist Before Release
- [ ] No hardcoded secrets in code
- [ ] `.env` in `.gitignore`
- [ ] RLS enabled on all Supabase tables
- [ ] All API calls use HTTPS
- [ ] Tokens stored in SecureStore
- [ ] `npm audit` shows 0 critical vulnerabilities
- [ ] No `console.log` with sensitive data
- [ ] Debug mode disabled in production
