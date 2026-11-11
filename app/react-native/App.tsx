import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { StraumurTapToPay as TapToPay } from "./modules/straumur-tap-to-pay";

// YOUR backend (the ../server project) — never the Straumur API directly, so the app holds no
// API key. The server adds the key + store MID and brokers each call to Straumur.
const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_BASE_URL ?? "http://127.0.0.1:5080";
const CURRENCY = "ISK";

// Straumur takes amounts in minor units; ISK has 2 decimals there, so 1000 ISK is sent as 100000.
const CURRENCY_DECIMALS = 2;

export default function App() {
    const [poiId, setPoiId] = useState<string | null>(null);
    const [amount, setAmount] = useState("1000");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Board on launch. The Adyen SDK makes a setupToken and boards through your backend
        // (POST /api/sessions) internally, then resolves this device's POIID. The SDK caches the
        // session, so later launches don't re-board.
        TapToPay.setBackend(SERVER_URL);
        TapToPay.board().then(setPoiId).catch(showError);

        // The card read finishes asynchronously; the outcome arrives here.
        const sub = TapToPay.addPaymentResultListener(result => {
            setBusy(false);
            Alert.alert(result.success ? "Approved" : "Declined", result.message);
        });

        return () => sub.remove();
    }, []);

    function showError(e: unknown) {
        setBusy(false);
        setError(e instanceof Error ? e.message : String(e));
    }

    async function charge() {
        setBusy(true);
        setError(null);
        try {
            // Your backend has Straumur pre-create the payment and returns a nexo SaleToPOIRequest.
            const response = await fetch(`${SERVER_URL}/api/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    poiId,
                    amount: Math.round(Number(amount) * 10 ** CURRENCY_DECIMALS),
                    currency: CURRENCY,
                }),
            });
            const body = await response.json();

            if (!response.ok) {
                throw new Error(body.errorMessage ?? `Request failed (${response.status}).`);
            }

            // Hand it to the SDK verbatim — this is where the shopper taps their card.
            await TapToPay.charge(body.saleToPoiRequest);
        } catch (e) {
            showError(e);
        }
    }

    return (
        <View style={styles.screen}>
            <Text style={styles.heading}>Take a payment</Text>

            {poiId ? (
                <>
                    <Text style={styles.subtle}>
                        Device {poiId} · {CURRENCY}
                    </Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="decimal-pad"
                        value={amount}
                        onChangeText={setAmount}
                    />
                    <Pressable style={styles.button} onPress={charge} disabled={busy}>
                        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Charge</Text>}
                    </Pressable>
                </>
            ) : (
                <Text style={styles.subtle}>{error ? "Setup failed." : "Setting up device…"}</Text>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#fbfaf9", padding: 24, paddingTop: 72, gap: 16 },
    heading: { fontSize: 26, fontWeight: "700", color: "#002649" },
    subtle: { fontSize: 15, color: "#4d5f6f" },
    error: { fontSize: 14, color: "#d03e00" },
    input: {
        borderWidth: 1,
        borderColor: "#e2e6e9",
        borderRadius: 14,
        padding: 14,
        fontSize: 18,
        backgroundColor: "#fff",
    },
    button: {
        backgroundColor: "#002649",
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: "center",
    },
    buttonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
});
