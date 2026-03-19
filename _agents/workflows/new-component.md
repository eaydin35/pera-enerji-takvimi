---
description: Create a new reusable component following the project's design system
---

# New Component Workflow

## 1. Gather Requirements
- **Component name** (PascalCase, e.g., `EnergyCard`, `MoonPhaseIndicator`)
- **Purpose** (what it displays/does)
- **Props** (inputs needed)
- **Reusable?** (used in multiple places or screen-specific)

## 2. Create Component File

**Location rules:**
- Reusable across screens → `components/<ComponentName>.tsx`
- Screen-specific → Keep in the same file or a subfolder of the screen

## 3. Component Template

```tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface ComponentNameProps {
  title: string;
  // Add more props
  style?: ViewStyle;
}

export const ComponentName: React.FC<ComponentNameProps> = ({ 
  title, 
  style 
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 20,
    // Glass effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
});
```

## 4. Design Rules (PET Project)
Follow these design conventions:
- **Background cards**: `rgba(255, 255, 255, 0.7)` with blur
- **Border radius**: 16-24px for cards, 12px for buttons
- **Shadows**: Subtle (`shadowOpacity: 0.05-0.1`)
- **Colors**: Pink gradient palette (#FF6B9D, #C084FC, #818CF8)
- **Typography**: Bold headers (700), regular body (400)
- **Spacing**: 16-20px padding, 12-16px gaps

## 5. TypeScript
- Define a proper interface for props
- Export the interface if it will be used elsewhere
- Use generic types where applicable

## 6. Add to Index (if applicable)
If you have a `components/index.ts` barrel file, add the export:
```typescript
export { ComponentName } from './ComponentName';
```

## 7. Verify
- Import and use the component in a screen
- Test with different prop values
- Check on multiple screen sizes
- Verify accessibility (`accessibilityLabel`, `accessibilityRole`)
