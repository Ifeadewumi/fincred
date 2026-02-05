import { View, Text, StyleSheet } from 'react-native';

export default function ChatScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Coach</Text>
            <Text style={styles.subtitle}>Chat with your AI financial coach</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
});
