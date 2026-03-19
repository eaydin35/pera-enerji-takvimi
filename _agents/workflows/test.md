---
description: Run all tests (unit, integration, E2E) and report results
---

# Test Workflow

## Prerequisites
Ensure test dependencies are installed:
```bash
cd /Users/emrullahaydin/Desktop/PET && npm ls jest @testing-library/react-native 2>/dev/null || echo "Test deps not installed"
```

## 1. Run Unit & Integration Tests
```bash
cd /Users/emrullahaydin/Desktop/PET && npx jest --coverage --verbose 2>&1 | head -100
```

## 2. Run TypeScript Type Check
// turbo
```bash
cd /Users/emrullahaydin/Desktop/PET && npx tsc --noEmit 2>&1 | head -50
```

## 3. Analyze Results
- Check for failing tests
- Check coverage percentage (target: >80%)
- Check TypeScript errors
- Provide a summary report with:
  - ✅ Passed tests count
  - ❌ Failed tests count  
  - 📊 Coverage percentage
  - ⚠️ TypeScript errors

## 4. If Tests Fail
- Identify the root cause
- Suggest fixes for each failure
- If the fix is obvious and safe, apply it and re-run tests

## 5. Generate Test Report
Create a summary in the following format:
```
## Test Report - [DATE]
- Unit Tests: X/Y passed
- Coverage: X%
- TypeScript: X errors
- Status: ✅ PASS / ❌ FAIL
```
