import { View, ActivityIndicator } from 'react-native';

export default function Index() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
            <ActivityIndicator size="large" color="#ad92c9" />
        </View>
    );
}
