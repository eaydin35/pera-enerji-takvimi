---
name: ios-simulator
description: Enables professional interaction with iOS Simulator for testing and debugging iOS applications.
---

# iOS Simulator Skill

This skill optimizes the ability to build, run, and interact with iOS apps on the simulator using `xcrun simctl`.

## Core Capabilities

### 1. Device Management
- **List Devices**: `xcrun simctl list devices`
- **Boot Device**: `xcrun simctl boot <device-id>`
- **Shutdown Device**: `xcrun simctl shutdown <device-id>`

### 2. App Interaction
- **Install App**: `xcrun simctl install <device-id> <path-to-app>`
- **Launch App**: `xcrun simctl launch <device-id> <bundle-id>`
- **Uninstall App**: `xcrun simctl uninstall <device-id> <bundle-id>`

### 3. Testing & Analysis
- **Take Screenshot**: `xcrun simctl screenshot <device-id> <filename>.png`
- **Record Video**: `xcrun simctl io <device-id> recordVideo <filename>.mp4`
- **Open URL**: `xcrun simctl openurl <device-id> <url>` (Useful for deep links)
- **Grant Permissions**: `xcrun simctl privacy <device-id> grant <service> <bundle-id>`

## Best Practices
- **Pr pristine state**: Always ensure the simulator is booted before running tests.
- **Bundle ID**: Know your app's bundle identifier (e.g., `com.pera.enerji`).
- **Clean up**: Shutdown simulators when not in use to save system resources.

## Example Workflow: Visual Regression
1. Boot simulator.
2. Launch app.
3. Use `openurl` to navigate to a specific page.
4. Take a screenshot for comparison.
