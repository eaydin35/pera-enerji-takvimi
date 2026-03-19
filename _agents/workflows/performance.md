---
description: Analyze and optimize app performance including bundle size, rendering, and memory
---

# Performance Analysis Workflow

## 1. Bundle Size Analysis
// turbo
```bash
cd /Users/emrullahaydin/Desktop/PET && npx expo export --platform web --output-dir /tmp/pet-bundle-analysis 2>&1 | tail -20
```

Check the bundle contents:
// turbo
```bash
du -sh /tmp/pet-bundle-analysis/* 2>/dev/null | sort -rh | head -20
```

## 2. Dependency Size Check
// turbo
```bash
cd /Users/emrullahaydin/Desktop/PET && npx -y cost-of-modules --no-install 2>&1 | head -30
```

## 3. Code Analysis
Analyze code for common performance issues:

### Check for inline functions in render
```bash
cd /Users/emrullahaydin/Desktop/PET && grep -rn "onPress={() =>" app/ components/ | head -20
```

### Check for missing React.memo on list items
```bash
cd /Users/emrullahaydin/Desktop/PET && grep -rn "FlatList\|SectionList" app/ components/ | head -10
```

### Check for large image imports
```bash
cd /Users/emrullahaydin/Desktop/PET && find assets/ -type f -size +500k 2>/dev/null
```

### Check for console.log in production code
```bash
cd /Users/emrullahaydin/Desktop/PET && grep -rn "console\." app/ components/ utils/ store/ --include="*.ts" --include="*.tsx" | grep -v "// " | head -20
```

## 4. Performance Report
Generate a report covering:

| Category | Check | Status |
|----------|-------|--------|
| Bundle | Total size < 5MB | ✅/❌ |
| Images | All < 500KB | ✅/❌ |
| Renders | No inline functions in FlatList | ✅/❌ |
| Memory | No console.logs in prod | ✅/❌ |
| Lists | FlatList items use React.memo | ✅/❌ |

## 5. Optimization Recommendations
For each issue found, provide:
- What the issue is
- Why it matters
- How to fix it
- Expected improvement
