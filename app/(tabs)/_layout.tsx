import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from 'react-native';

// Main tab navigator for the app
export default function TabLayout() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.background,
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                    height: 80,
                    paddingBottom: 25,
                },
                tabBarActiveTintColor: theme.textPrimary,
                tabBarInactiveTintColor: theme.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Ana Sayfa',
                    tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="chart"
                options={{
                    title: 'Haritam',
                    tabBarIcon: ({ color }) => <MaterialIcons name="explore" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: 'Takvim',
                    tabBarIcon: ({ color }) => <MaterialIcons name="calendar-today" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: 'Danışman',
                    tabBarIcon: ({ color }) => <MaterialIcons name="chat" size={24} color={color} />,
                }}
            />

            <Tabs.Screen
                name="zikirmatik"
                options={{
                    title: 'Zikirmatik',
                    tabBarIcon: ({ color }) => <MaterialIcons name="touch-app" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
