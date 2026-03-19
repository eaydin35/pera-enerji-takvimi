---
name: error-handling
description: Use when implementing error handling, logging, and recovery strategies across the application.
---

# Error Handling Skill

## Core Principle
**Every error should be: caught, logged, and handled gracefully with user feedback.**

## Error Categories

| Category | Example | Action |
|----------|---------|--------|
| **Network** | API timeout, no internet | Retry + fallback UI |
| **Auth** | Token expired, unauthorized | Re-authenticate |
| **Validation** | Invalid input | Show inline error |
| **Data** | Missing field, parse error | Default value + log |
| **System** | Out of memory, crash | ErrorBoundary + report |

## API Error Handling Pattern
```tsx
const fetchWithErrorHandling = async <T>(
  fn: () => Promise<T>,
  options?: { retries?: number; fallback?: T }
): Promise<T> => {
  const { retries = 2, fallback } = options || {};
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === retries;
      
      if (error instanceof AuthError) {
        // Don't retry auth errors
        throw error;
      }
      
      if (isLastAttempt) {
        console.error(`Failed after ${retries + 1} attempts:`, error);
        if (fallback !== undefined) return fallback;
        throw error;
      }
      
      // Exponential backoff
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error('Unreachable');
};
```

## User-Facing Error Messages
```tsx
const ERROR_MESSAGES: Record<string, string> = {
  network: 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.',
  auth: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.',
  server: 'Bir sorun oluştu. Lütfen daha sonra tekrar deneyin.',
  validation: 'Lütfen girdiğiniz bilgileri kontrol edin.',
  notFound: 'Aradığınız içerik bulunamadı.',
  quota: 'Günlük kullanım limitine ulaşıldı.',
};
```

## Rules
1. **Never show raw errors to users** — Always use friendly messages
2. **Never swallow errors silently** — At minimum, `console.error`
3. **Use typed errors** — Create custom error classes
4. **Provide recovery actions** — Retry buttons, back navigation
5. **Log context** — Include user ID, screen, action
6. **No sensitive data in logs** — Never log passwords, tokens, personal data
