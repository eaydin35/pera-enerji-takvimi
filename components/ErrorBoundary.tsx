import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { captureError } from '../utils/error-reporter';
import Constants from 'expo-constants';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

// ─── Error Boundary Component ────────────────────────────────────────────────
/**
 * Global Error Boundary that catches unhandled React errors.
 * Instead of showing a white screen, displays a user-friendly Turkish error page
 * and reports the crash to Sentry automatically.
 * 
 * Usage: Wrap your root layout with <ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });

        // Report to Sentry with full context
        captureError(error, {
            screen: 'ErrorBoundary',
            action: 'componentDidCatch',
            extra: {
                componentStack: errorInfo.componentStack ?? 'unknown',
                appVersion: Constants.expoConfig?.version ?? 'unknown',
            },
        }, 'fatal');
    }

    private handleRestart = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // If a custom fallback is provided, use it
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View style={styles.container}>
                    <View style={styles.card}>
                        {/* Icon */}
                        <View style={styles.iconContainer}>
                            <Text style={styles.icon}>⚠️</Text>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Bir Sorun Oluştu</Text>
                        <Text style={styles.subtitle}>
                            Uygulama beklenmedik bir hatayla karşılaştı. Hata otomatik olarak ekibimize bildirildi.
                        </Text>

                        {/* Error Details (collapsed by default in prod) */}
                        {__DEV__ && this.state.error && (
                            <ScrollView style={styles.errorBox}>
                                <Text style={styles.errorText}>
                                    {this.state.error.name}: {this.state.error.message}
                                </Text>
                                {this.state.errorInfo?.componentStack && (
                                    <Text style={styles.stackText}>
                                        {this.state.errorInfo.componentStack}
                                    </Text>
                                )}
                            </ScrollView>
                        )}

                        {/* Meta Info */}
                        <View style={styles.metaContainer}>
                            <Text style={styles.metaText}>
                                Sürüm: {Constants.expoConfig?.version ?? '1.0.0'}
                            </Text>
                            <Text style={styles.metaText}>
                                Tarih: {new Date().toLocaleDateString('tr-TR')}
                            </Text>
                        </View>

                        {/* Action Buttons */}
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={this.handleRestart}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryButtonText}>Tekrar Dene</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#fff3cd',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    icon: {
        fontSize: 36,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    errorBox: {
        backgroundColor: '#f8d7da',
        borderRadius: 12,
        padding: 12,
        width: '100%',
        maxHeight: 150,
        marginBottom: 16,
    },
    errorText: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#842029',
    },
    stackText: {
        fontFamily: 'monospace',
        fontSize: 10,
        color: '#842029',
        marginTop: 8,
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    metaText: {
        fontSize: 12,
        color: '#adb5bd',
    },
    primaryButton: {
        backgroundColor: '#ad92c9',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: '100%',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
