import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useColorScheme, Platform, View, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const isDark = false; // Forced Light Theme per guidelines
  const theme = Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ec4899',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="auto-awesome" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chart"
        options={{
          title: 'Haritam',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="track-changes" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Takvim',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="calendar-today" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Danış',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="chat-bubble-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="zikirmatik"
        options={{
          title: 'Zikirmatik',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="radio-button-checked" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
