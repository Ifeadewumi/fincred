import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Text, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useChatSession } from '@/hooks/useChatSession';
import { chatApi } from '@/services/api/chat';
import type { ChatMessage, SendMessageRequest } from '@/types/chat.types';

export default function ChatScreen() {
    const {
        currentSessionId,
        setCurrentSessionId,
        startSession,
        endSession,
        isStarting,
        isEnding,
        isLlmAvailable,
        greeting,
    } = useChatSession();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Auto-start session when component mounts
    useEffect(() => {
        if (!currentSessionId && !isStarting) {
            handleStartSession();
        }
    }, []);

    // Add greeting when session starts
    useEffect(() => {
        if (greeting && messages.length === 0) {
            setMessages([{ role: 'assistant', content: greeting }]);
        }
    }, [greeting]);

    const handleStartSession = async (intent: string = 'general') => {
        try {
            const result = await startSession(intent);
            setMessages([{ role: 'assistant', content: result.greeting }]);
        } catch (error) {
            console.error('Failed to start session:', error);
        }
    };

    const handleEndSession = async () => {
        try {
            await endSession();
            setMessages([]);
        } catch (error) {
            console.error('Failed to end session:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || isSending) return;

        const userMessage: ChatMessage = { role: 'user', content: inputText.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setIsSending(true);

        try {
            const request: SendMessageRequest = {
                message: userMessage.content,
                session_id: currentSessionId || undefined,
            };

            const response = await chatApi.sendMessage(request);

            // Update session ID if we didn't have one
            if (!currentSessionId && response.session_id) {
                setCurrentSessionId(response.session_id);
            }

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.response,
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Failed to send message:', error);
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsSending(false);
        }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => (
        <View
            style={[
                styles.messageBubble,
                item.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
        >
            {item.role === 'assistant' && (
                <View style={styles.avatarContainer}>
                    <Ionicons name="sparkles" size={16} color={colors.white} />
                </View>
            )}
            <View
                style={[
                    styles.messageContent,
                    item.role === 'user' ? styles.userContent : styles.assistantContent,
                ]}
            >
                <Text
                    variant="body"
                    color={item.role === 'user' ? colors.white : colors.text}
                >
                    {item.content}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={90}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Ionicons name="chatbubbles" size={24} color={colors.primary} />
                        <Text variant="h4" style={styles.headerTitle}>AI Coach</Text>
                    </View>
                    <View style={styles.headerRight}>
                        {/* LLM Status */}
                        <View style={[styles.statusDot, isLlmAvailable ? styles.statusOnline : styles.statusOffline]} />
                        {/* New Chat Button */}
                        <TouchableOpacity
                            onPress={handleEndSession}
                            style={styles.headerButton}
                            disabled={isEnding}
                        >
                            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Messages */}
                {isStarting ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text variant="bodySmall" color={colors.textSecondary} style={{ marginTop: spacing.md }}>
                            Starting conversation...
                        </Text>
                    </View>
                ) : messages.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="chatbubble-ellipses-outline" size={64} color={colors.gray300} />
                        <Text variant="h4" color={colors.textSecondary} style={styles.emptyTitle}>
                            Chat with your AI Coach
                        </Text>
                        <Text variant="bodySmall" color={colors.textSecondary} style={styles.emptyText}>
                            Ask about budgeting, savings strategies, or get personalized advice
                        </Text>
                        {/* Quick Start Topics */}
                        <View style={styles.quickTopics}>
                            {['How can I save more?', 'Review my goals', 'Tips for debt payoff'].map((topic) => (
                                <TouchableOpacity
                                    key={topic}
                                    style={styles.topicChip}
                                    onPress={() => {
                                        setInputText(topic);
                                    }}
                                >
                                    <Text variant="caption" color={colors.primary}>{topic}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(_, index) => index.toString()}
                        contentContainerStyle={styles.messagesContainer}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* Typing Indicator */}
                {isSending && (
                    <View style={styles.typingIndicator}>
                        <View style={styles.typingDot} />
                        <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
                        <View style={[styles.typingDot, { animationDelay: '0.4s' }]} />
                    </View>
                )}

                {/* Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Ask your AI coach..."
                        placeholderTextColor={colors.gray400}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={4000}
                        editable={!isSending}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
                        onPress={handleSendMessage}
                        disabled={!inputText.trim() || isSending}
                    >
                        <Ionicons
                            name="send"
                            size={20}
                            color={inputText.trim() && !isSending ? colors.white : colors.gray400}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
        backgroundColor: colors.white,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        marginLeft: spacing.sm,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: spacing.md,
    },
    statusOnline: {
        backgroundColor: colors.success,
    },
    statusOffline: {
        backgroundColor: colors.gray400,
    },
    headerButton: {
        padding: spacing.xs,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyTitle: {
        marginTop: spacing.md,
    },
    emptyText: {
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    quickTopics: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    topicChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.primary + '15',
        borderRadius: 20,
    },
    messagesContainer: {
        padding: spacing.md,
        paddingBottom: spacing.lg,
    },
    messageBubble: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        maxWidth: '85%',
    },
    userBubble: {
        alignSelf: 'flex-end',
    },
    assistantBubble: {
        alignSelf: 'flex-start',
    },
    avatarContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
        marginTop: 4,
    },
    messageContent: {
        padding: spacing.md,
        borderRadius: 16,
        maxWidth: '100%',
    },
    userContent: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    assistantContent: {
        backgroundColor: colors.gray100,
        borderBottomLeftRadius: 4,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        marginLeft: spacing.md + 28 + spacing.sm,
        marginBottom: spacing.sm,
        gap: 4,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.gray400,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
        backgroundColor: colors.white,
    },
    textInput: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        backgroundColor: colors.gray100,
        borderRadius: 22,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: 16,
        color: colors.text,
        marginRight: spacing.sm,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: colors.gray200,
    },
});
