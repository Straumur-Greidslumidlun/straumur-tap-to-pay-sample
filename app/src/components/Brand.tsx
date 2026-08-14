import React from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../theme";

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
    return (
        <SafeAreaView style={styles.screen} edges={["top", "left", "right", "bottom"]}>
            <View style={[styles.body, style]}>{children}</View>
        </SafeAreaView>
    );
}

export function Heading({ children }: { children: React.ReactNode }) {
    return <Text style={styles.heading}>{children}</Text>;
}

export function Subtle({ children }: { children: React.ReactNode }) {
    return <Text style={styles.subtle}>{children}</Text>;
}

export function ErrorText({ children }: { children?: string | null }) {
    if (!children) {
        return null;
    }
    return <Text style={styles.error}>{children}</Text>;
}

export function BrandButton({
    label,
    onPress,
    disabled,
    busy,
    variant = "primary",
}: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    busy?: boolean;
    variant?: "primary" | "accent" | "ghost";
}) {
    const bg =
        variant === "accent" ? theme.colors.accent : variant === "ghost" ? "transparent" : theme.colors.primary;
    const fg =
        variant === "accent"
            ? theme.colors.onAccent
            : variant === "ghost"
              ? theme.colors.primary
              : theme.colors.onPrimary;
    const isDisabled = disabled || busy;

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            style={({ pressed }) => [
                styles.button,
                { backgroundColor: bg, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
                variant === "ghost" && styles.buttonGhost,
            ]}
        >
            {busy ? (
                <ActivityIndicator color={fg} />
            ) : (
                <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
            )}
        </Pressable>
    );
}

export function Field({ label, ...props }: { label: string } & TextInputProps) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                placeholderTextColor={theme.colors.muted}
                style={styles.input}
                autoCapitalize="none"
                {...props}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.surface },
    body: { flex: 1, padding: theme.spacing(3), gap: theme.spacing(2) },
    heading: { fontSize: 26, fontWeight: "700", color: theme.colors.primary },
    subtle: { fontSize: 15, color: theme.colors.muted, lineHeight: 21 },
    error: { color: theme.colors.error, fontSize: 14 },
    button: {
        borderRadius: theme.radius,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonGhost: { borderWidth: 1, borderColor: theme.colors.border },
    buttonText: { fontSize: 16, fontWeight: "600" },
    field: { gap: 6 },
    label: { fontSize: 13, color: theme.colors.muted, fontWeight: "600" },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 18,
        color: theme.colors.text,
        backgroundColor: theme.colors.card,
    },
});
