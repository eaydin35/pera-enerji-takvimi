---
description: Commit and push all changes to GitHub with a descriptive message
---
// turbo-all

# Git Commit & Push Workflow

1. Check the current git status
```bash
cd /Users/emrullahaydin/Desktop/PET && git status
```

2. Stage all changes
```bash
cd /Users/emrullahaydin/Desktop/PET && git add -A
```

3. Generate a descriptive commit message based on the changes. Use conventional commit format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `refactor:` for refactoring
   - `style:` for styling changes
   - `docs:` for documentation
   - `chore:` for maintenance
   - `test:` for test additions/changes

4. Commit with the generated message
```bash
cd /Users/emrullahaydin/Desktop/PET && git commit -m "<generated_message>"
```

5. Push to the remote repository
```bash
cd /Users/emrullahaydin/Desktop/PET && git push origin main
```

6. Confirm the push was successful by checking the log
```bash
cd /Users/emrullahaydin/Desktop/PET && git log -1 --oneline
```
