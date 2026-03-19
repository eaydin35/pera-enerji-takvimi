---
description: Run Maestro E2E tests on iOS Simulator or Android Emulator.
---

# /test-e2e Workflow

## Pre-requisites
1. **Maestro CLI** must be installed on your machine (`curl -Ls "https://get.maestro.mobile.dev" | bash`).
2. **App build**: You must have a current build of the app running on your simulator/emulator (use `npx expo run:ios`).

## Steps
1. **Prepare Environment**: Ensure the simulator is open and the app is installed.
2. **Select Flow**: Choose a flow from the `.maestro/` directory.
3. **Run Test**: Execute the following command in the terminal:
   ```bash
   maestro test .maestro/smoke-test.yaml
   ```
4. **View Results**: Check the terminal output for PASS/FAIL status.

// turbo
5. **Run All Flows**:
   ```bash
   maestro test .maestro/
   ```
