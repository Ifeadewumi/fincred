import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
    const { user, logout } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>
            {user && (
                <View style={styles.userInfo}>
                    <Text style={styles.label}>Name:</Text>
                    <Text style={styles.value}>{user.full_name}</Text>

                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{user.email}</Text>
                </View>
            )}

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        marginTop: 60,
    },
    userInfo: {
        marginBottom: 32,
    },
    label: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 16,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        fontWeight: '500',
    },
    logoutButton: {
        backgroundColor: '#EF4444',
        padding: 16,
        borderRadius: 8,
        marginTop: 24,
    },
    logoutText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
    },
});
