---
name: code-review
description: Use when reviewing code for quality, maintainability, and adherence to project standards before commit or merge.
---

# Code Review Skill

## Overview
Systematic code review for quality, security, and maintainability.

## Review Checklist

### 🏗️ Architecture
- [ ] Follows Clean Architecture / separation of concerns
- [ ] No business logic in UI components
- [ ] Proper file/folder structure
- [ ] No circular dependencies

### 📝 Code Quality
- [ ] Functions under 50 lines
- [ ] Files under 200 lines
- [ ] Max 3 levels of nesting
- [ ] Early return pattern used
- [ ] No code duplication (DRY)
- [ ] Descriptive variable/function names (no `utils`, `helpers`)

### 🔐 Security
- [ ] No hardcoded secrets or API keys
- [ ] Input validation on user data
- [ ] Secure storage for sensitive data (not AsyncStorage)
- [ ] No `console.log` with sensitive info

### ⚡ Performance
- [ ] No inline functions in FlatList `renderItem`
- [ ] `React.memo` on list items
- [ ] `useMemo`/`useCallback` for expensive computations
- [ ] Images optimized (< 500KB, WebP preferred)
- [ ] No unnecessary re-renders

### ♿ Accessibility
- [ ] `accessibilityLabel` on interactive elements
- [ ] `accessibilityRole` set correctly
- [ ] Sufficient color contrast

### 🧪 Testing
- [ ] New functions have corresponding tests
- [ ] Edge cases covered
- [ ] Error scenarios tested

### 📱 React Native Specific
- [ ] Platform-specific code handled correctly
- [ ] Safe area boundaries respected
- [ ] Keyboard avoidance implemented where needed
- [ ] Scroll behavior correct

## Severity Levels
- 🔴 **Critical**: Security issues, data loss risks, crashes
- 🟡 **Warning**: Performance issues, maintainability concerns
- 🟢 **Suggestion**: Style improvements, minor optimizations

## Output Format
```
## Code Review Summary
- Files reviewed: X
- 🔴 Critical: X issues
- 🟡 Warning: X issues  
- 🟢 Suggestion: X issues
- Overall: ✅ APPROVE / ⚠️ REQUEST CHANGES / ❌ BLOCK
```
