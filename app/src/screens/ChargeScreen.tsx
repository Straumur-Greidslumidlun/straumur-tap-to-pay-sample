import React, { useEffect, useState } from "react";
import { Alert } from "react-native";

import { api, ApiError } from "../api/client";
import { BrandButton, ErrorText, Field, Heading, Screen, Subtle } from "../components/Brand";
import { storeCurrency } from "../config";
import { TapToPay } from "../taptopay";

/**
 * Take a payment on the boarded device.
 * Enter an amount -> your backend pre-creates the charge with Straumur and returns a nexo
 * SaleToPOIRequest -> hand it to the Adyen SDK, which reads the card. The result is delivered
 * asynchronously via onPaymentResult; the authorization also arrives on your payment webhook,
 * correlated by the returned reference.
 */
export function ChargeScreen({ poiId, onReset }: { poiId: string; onReset: () => void }) {
    const [amount, setAmount] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const subscription = TapToPay.addPaymentResultListener((result) => {
            setBusy(false);
            Alert.alert(result.success ? "Approved" : "Declined", result.message);
        });
        return () => subscription.remove();
    }, []);

    async function charge() {
        const value = Number(amount);
        if (!Number.isFinite(value) || value <= 0) {
            setError("Enter an amount greater than zero.");
            return;
        }

        setBusy(true);
        setError(null);
        try {
            const payment = await api.createPayment(poiId, value, storeCurrency);
            // The SDK now shows its tap UI; the outcome arrives on the onPaymentResult listener.
            await TapToPay.charge(payment.saleToPoiRequest);
            setAmount("");
        } catch (e) {
            setBusy(false);
            setError(e instanceof ApiError ? e.message : "Payment failed. See the logs.");
        }
    }

    return (
        <Screen>
            <Heading>Take a payment</Heading>
            <Subtle>
                Device {poiId} · {storeCurrency}
            </Subtle>
            <Field
                label={`Amount (${storeCurrency})`}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
            />
            <ErrorText>{error}</ErrorText>
            <BrandButton label="Charge" onPress={charge} busy={busy} />
            <BrandButton label="Reset device" variant="ghost" onPress={onReset} />
        </Screen>
    );
}
