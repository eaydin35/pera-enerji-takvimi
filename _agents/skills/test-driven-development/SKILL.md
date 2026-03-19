---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code.
---

# Test-Driven Development (TDD)

## Overview
Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

**Violating the letter of the rules is violating the spirit of the rules.**

## When to Use
**Always:**
- New features
- Bug fixes
- Refactoring
- Behavior changes

**Exceptions:**
- Throwaway prototypes
- Generated code
- Configuration files

## The Iron Law
```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over.

## Red-Green-Refactor

1. **RED - Write Failing Test**
   - Write one minimal test showing what should happen.
   - Confirm it fails correctly (not because of typos).

2. **GREEN - Minimal Code**
   - Write simplest code to pass the test.
   - Don't over-engineer. Don't add features not covered by tests.

3. **REFACTOR - Clean Up**
   - Remove duplication, improve names.
   - Keep tests green.

## Common Rationalizations to Avoid
- "Too simple to test" -> Simple code breaks too.
- "I'll test after" -> That's just verification, not design.
- "Deleting X hours is wasteful" -> Sunk cost fallacy. Technical debt is worse.
- "I'm being pragmatic" -> TDD *is* pragmatic; it saves debugging time.

## Verification Checklist
- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output pristine (no errors, warnings)
