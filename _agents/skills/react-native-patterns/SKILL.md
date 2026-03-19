---
name: react-native-patterns
description: React Native and Expo best practices, patterns, and conventions specific to mobile app development.
---

# React Native Patterns Skill

## Component Patterns

### 1. Container/Presentational Pattern
```tsx
// Container: handles logic and data
const UserProfileContainer = () => {
  const { user, loading } = useUserProfile();
  if (loading) return <LoadingSpinner />;
  return <UserProfileView user={user} />;
};

// Presentational: pure UI
const UserProfileView: React.FC<{ user: User }> = ({ user }) => (
  <View><Text>{user.name}</Text></View>
);
```

### 2. Custom Hooks for Logic
Extract business logic into custom hooks:
```tsx
// hooks/useEnergyData.ts
export const useEnergyData = (date: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  // ... fetch logic
  return { data, loading, error };
};
```

### 3. Optimized FlatList
```tsx
<FlatList
  data={items}
  renderItem={renderItem}           // Defined outside render
  keyExtractor={keyExtractor}       // Stable function
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
  getItemLayout={getItemLayout}     // If items have fixed height
/>

// Memoized item component
const ListItem = React.memo(({ item }) => (
  <View><Text>{item.title}</Text></View>
));
```

## State Management (Zustand)

### Store Pattern
```tsx
// store/appStore.ts
import { create } from 'zustand';

interface AppState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));
```

### Selector Pattern (prevent unnecessary re-renders)
```tsx
// ✅ Good: Only re-renders when theme changes
const theme = useAppStore((state) => state.theme);

// ❌ Bad: Re-renders on ANY store change
const { theme } = useAppStore();
```

## Navigation (Expo Router)

### Type-Safe Navigation
```tsx
import { router } from 'expo-router';

// Navigate with params
router.push({ pathname: '/details/[id]', params: { id: '123' } });

// Go back
router.back();
```

### Deep Links
Use `expo-linking` for handling deep links and universal links.

## Styling Conventions

### Design Tokens
```tsx
export const COLORS = {
  primary: '#FF6B9D',
  secondary: '#C084FC',
  background: '#FFF5F5',
  text: { primary: '#1A1A2E', secondary: '#666', muted: '#999' },
  card: 'rgba(255, 255, 255, 0.7)',
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };
```

### Glass Card Pattern
```tsx
const glassCard = {
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  borderRadius: 20,
  padding: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
};
```

## Error Boundaries
```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { /* Log to Sentry */ }
  render() {
    if (this.state.hasError) return <ErrorFallback />;
    return this.props.children;
  }
}
```

## Platform-Specific Code
```tsx
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity: 0.1 },
    android: { elevation: 4 },
  }),
});
```

## Common Anti-Patterns to Avoid
- ❌ Inline styles: `style={{ marginTop: 10 }}` → use StyleSheet
- ❌ Inline functions in render: `onPress={() => fn(id)}` → use useCallback
- ❌ Async in useEffect without cleanup
- ❌ Large images without resize
- ❌ Using `ScrollView` for long lists (use `FlatList`)
- ❌ Missing `key` prop in mapped components
