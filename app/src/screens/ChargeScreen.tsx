import React, { useState } from "react";
import { Alert } from "react-native";

import { api, ApiError } from "../api/client";
import { BrandButton, ErrorText, Field, Heading, Screen, Subtle } from "../components/Brand";
import { storeCurrency } from "../config";
import { TapToPay } from "../taptopay";

/**
 * Take a payment on the boarded device.
 * Enter an amount -> your backend pre-creates the charge with Straumur and returns a nexo
 * SaleToPOIRequest -> hand it to the SDK for the contactless read. The authorization result
 * arrives later on your payment webhook, correlated by the returned reference.
 */
export function ChargeScreen({ poiId, onReset }: { poiId: string; onReset: () => void }) {
    const [amount, setAmount] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            const result = await TapToPay.charge(payment.saleToPoiRequest);
            Alert.alert(result.success ? "Approved" : "Declined", `${result.message}\n\nReference: ${payment.reference}`);
            setAmount("");
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Payment failed. See the logs.");
        } finally {
            setBusy(false);
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
