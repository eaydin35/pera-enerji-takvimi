import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { chatWithAI, getProactiveQuestions, type Message } from '../../utils/ai-astrology';
import { calculateChart } from '../../utils/astrology';
import { calculateDailyTransits } from '../../utils/transit-engine';

export default function ChatScreen() {
    const { userProfile, tokens, isPremium, useTokens } = useStore();
    const [messages, setMessages] = useState<Message[]>([


        {
            role: 'model',
            parts: [{ text: "Merhaba, ben Pera. Gökyüzünün rehberliğinde sana nasıl yardımcı olabilirim bugün?" }]

        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const contextData = useMemo(() => {
        if (!userProfile?.birthDate) return null;
        const chart = calculateChart(
            userProfile.birthDate,
            userProfile.birthTime,
            userProfile.birthLat || 41.0082,
            userProfile.birthLng || 28.9784
        );
        const transit = calculateDailyTransits(chart);
        const questions = getProactiveQuestions(chart, transit);
        return { chart, transit, questions };
    }, [userProfile]);

    const handleSend = async (text: string = inputText) => {
        if (!text.trim() || isLoading || !contextData) return;

        // Token check
        if (tokens <= 0) {
            setMessages([...messages, { 
                role: 'model', 
                parts: [{ text: "Üzgünüm, jetonun bitmiş görünüyor. Sohbetine devam etmek için yeni jeton alabilir veya abonelik modellerimizi inceleyebilirsin. ✨" }] 
            }]);
            return;
        }

        const userMsg: Message = { role: 'user', parts: [{ text }] };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInputText('');
        setIsLoading(true);

        try {
            // Deduct token
            useTokens(1);

            const aiResponse = await chatWithAI(

                undefined, // ID yet to be implemented in Store
                text,
                messages,
                contextData.chart,
                contextData.transit
            );


            setMessages([...newMessages, { role: 'model', parts: [{ text: aiResponse }] }]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';
        return (
            <View style={[styles.messageRow, isUser ? styles.userRow : styles.modelRow]}>
                {!isUser && (
                    <View style={styles.avatar}>
                        <MaterialIcons name="auto-awesome" size={16} color="white" />
                    </View>
                )}
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.modelBubble]}>
                    <Text style={[styles.messageText, isUser ? styles.userText : styles.modelText]}>
                        {item.parts[0].text}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Pera</Text>

                    <Text style={styles.headerSubtitle}>Pera AI Danışmanı</Text>
                </View>
                <View style={styles.tokenBadge}>
                    <MaterialIcons name={isPremium ? "all-inclusive" : "stars"} size={16} color="#E91E63" />
                    <Text style={styles.tokenText}>{isPremium ? "Sınırsız" : `${tokens} Jeton`}</Text>
                </View>


            </View>


            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#E91E63" />
                </View>
            )}

            <View style={styles.footer}>
                {!isLoading && messages.length < 3 && contextData?.questions && (
                    <View style={styles.suggestions}>
                        {contextData.questions.map((q, idx) => (
                            <TouchableOpacity 
                                key={idx} 
                                style={styles.suggestionBadge}
                                onPress={() => handleSend(q)}
                            >
                                <Text style={styles.suggestionText}>{q}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={100}
                >
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Bir şey sor..."
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <TouchableOpacity 
                            onPress={() => handleSend()} 
                            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        >
                            <MaterialIcons name="send" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF5F7',
    },
    header: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#FFE0E9',
        backgroundColor: 'white',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#E91E63',
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 16,
        maxWidth: '85%',
    },
    userRow: {
        alignSelf: 'flex-end',
    },
    modelRow: {
        alignSelf: 'flex-start',
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E91E63',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginTop: 4,
    },
    bubble: {
        padding: 12,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    userBubble: {
        backgroundColor: '#E91E63',
        borderBottomRightRadius: 4,
    },
    modelBubble: {
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: 'white',
    },
    modelText: {
        color: '#333',
    },
    loadingContainer: {
        padding: 10,
        alignItems: 'center',
    },
    footer: {
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#FFE0E9',
    },
    suggestions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
        gap: 8,
    },
    suggestionBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#FFF0F5',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFE0E9',
    },

    suggestionText: {
        fontSize: 12,
        color: '#E91E63',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        maxHeight: 120,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E91E63',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#D1D1D1',
    },
    tokenBadge: {

        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF0F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    tokenText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#E91E63',
    }
});

