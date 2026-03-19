---
description: Run ESLint and Prettier to check and fix code quality issues
---

# Lint & Format Workflow

## 1. Check if ESLint is configured
// turbo
```bash
cd /Users/emrullahaydin/Desktop/PET && ls .eslintrc* eslint.config* 2>/dev/null || echo "No ESLint config found"
```

## 2. Run ESLint
```bash
cd /Users/emrullahaydin/Desktop/PET && npx eslint app/ components/ utils/ store/ --ext .ts,.tsx --format stylish 2>&1 | tail -30
```

## 3. Run Prettier Check
```bash
cd /Users/emrullahaydin/Desktop/PET && npx prettier --check "**/*.{ts,tsx,js,json}" --ignore-path .gitignore 2>&1 | tail -20
```

## 4. Auto-fix (if requested by user)
```bash
cd /Users/emrullahaydin/Desktop/PET && npx eslint app/ components/ utils/ store/ --ext .ts,.tsx --fix
```
```bash
cd /Users/emrullahaydin/Desktop/PET && npx prettier --write "**/*.{ts,tsx,js,json}" --ignore-path .gitignore
```

## 5. Report Summary
Provide a summary:
- Total errors found
- Total warnings found
- Files auto-fixed
- Remaining issues that need manual attention
