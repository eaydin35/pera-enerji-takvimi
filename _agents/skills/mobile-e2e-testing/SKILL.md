---
name: mobile-e2e-testing
description: Use when writing, debugging, or running E2E tests for mobile apps using Maestro.
---

# Mobile E2E Testing with Maestro

## Overview
Maestro is a professional UI testing framework for mobile (iOS/Android). It uses YAML to define "Flows" that simulate user behavior.

## Core Commands
- **tapOn**: Select an element by text, ID, or accessibility label.
- **inputText**: Enter text into the focused field.
- **assertVisible**: Verify an element is on screen.
- **back**: Go back.
- **scroll**: Scroll up/down.

## Best Practices
1. **Use ID/Labels**: Always prefer `id` or `accessibilityLabel` over raw text for stability.
2. **Atomic Flows**: Keep tests small. One flow = One feature (e.g., Login, Search).
3. **Wait for state**: Use `assertVisible` to ensure the screen has loaded before interacting.
4. **Clean State**: Always start the flow by `launchApp` to ensure a consistent starting point.

## Example Flow (`smoke-test.yaml`)
```yaml
appId: com.your.bundle.id
---
- launchApp
- assertVisible: "Welcome"
- tapOn: "Get Started"
- inputText: "test@example.com"
- tapOn: "Login"
```

## Running Tests
Run locally via terminal:
```bash
maestro test .maestro/smoke-test.yaml
```
