---
name: git-workflow
description: Use for all Git operations including branching, commits, PRs, and release management.
---

# Git Workflow Skill

## Branch Strategy
```
main (production)
  └── develop (staging)
       ├── feature/<name>    → New features
       ├── fix/<name>        → Bug fixes
       ├── refactor/<name>   → Code refactoring
       └── hotfix/<name>     → Critical production fixes
```

## Commit Message Convention (Conventional Commits)
```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

### Types
| Type | When to Use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style` | UI/styling changes |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `chore` | Build process, deps, configs |
| `perf` | Performance improvement |

### Scopes (PET Project)
`auth`, `onboarding`, `dashboard`, `chart`, `calendar`, `profile`, `ai`, `db`, `store`, `navigation`, `ui`

### Examples
```
feat(dashboard): add moon phase widget
fix(auth): resolve session persistence issue  
refactor(store): migrate to zustand v5 patterns
style(onboarding): update gradient to match design system
test(chart): add birth chart calculation unit tests
chore(deps): update expo to v54
```

## PR Template
```markdown
## What
Brief description of the change.

## Why
Motivation and context.

## How
Technical approach taken.

## Testing
- [ ] Unit tests pass
- [ ] Tested on iOS simulator
- [ ] Tested on Android emulator
- [ ] Edge cases handled
```

## Release Process
1. All features merged to `develop`
2. Create release branch: `release/vX.Y.Z`
3. Final testing on release branch
4. Merge to `main` and tag
5. Deploy via EAS
