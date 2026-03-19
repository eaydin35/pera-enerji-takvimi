---
description: Create a new screen following the project's architecture and design patterns
---

# New Screen Workflow

## 1. Gather Requirements
Before creating the screen, define:
- **Screen name** (e.g., `settings`, `notifications`)
- **Tab location** (which tab in the navigation)
- **Authentication required?** (protected or public)
- **Data sources** (Supabase tables, API calls, local state)

## 2. Create the Screen File
Create the file in the appropriate location within the Expo Router structure:

```
app/(tabs)/<screen-name>.tsx     → For tab screens
app/(tabs)/<folder>/<screen>.tsx → For nested screens
app/<screen>.tsx                 → For modal/standalone screens
```

## 3. Screen Template
Use this template for new screens:

```tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScreenNameScreen() {
  return (
    <LinearGradient
      colors={['#FFF5F5', '#FFF0F5', '#F8F0FF']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Screen Title</Text>
            <Text style={styles.subtitle}>Screen description</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Add your content here */}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  content: {
    gap: 16,
  },
});
```

## 4. Add Navigation
If adding to tabs, update the tab navigation in `app/(tabs)/_layout.tsx`.

## 5. Add State Management
If the screen needs state:
- Create a Zustand store in `store/<screen-name>Store.ts`
- Or use local state with `useState`/`useReducer`

## 6. Add Tests
Create a test file at `__tests__/<ScreenName>.test.tsx` following the TDD skill.

## 7. Verify
- Navigate to the screen in the app
- Check responsiveness
- Verify data loading
- Test error states
