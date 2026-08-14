import React, { useState } from "react";

import { api, ApiError } from "../api/client";
import { BrandButton, ErrorText, Heading, Screen, Subtle } from "../components/Brand";
import { getServerBaseUrl } from "../config";
import { deviceModel } from "../deviceInfo";
import { TapToPay } from "../taptopay";

/**
 * First run: board this phone as a Tap to Pay device.
 * SDK produces a setupToken -> your backend exchanges it with Straumur for sdkData ->
 * SDK finishes boarding. The device's POIID (installationId) is what we keep.
 */
export function SetupScreen({ onBoarded }: { onBoarded: (poiId: string) => void }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function setup() {
        setBusy(true);
        setError(null);
        try {
            const setupToken = await TapToPay.startBoarding();
            const session = await api.createSession(setupToken, deviceModel());
            await TapToPay.completeBoarding(session.sdkData);
            onBoarded(session.installationId);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Setup failed. See the logs.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <Screen>
            <Heading>Set up this device</Heading>
            <Subtle>
                Boards this phone as a Tap to Pay device through your backend at {getServerBaseUrl()}. Your Straumur API
                key never leaves the server.
            </Subtle>
            <ErrorText>{error}</ErrorText>
            <BrandButton label="Set up device" onPress={setup} busy={busy} />
        </Screen>
    );
}
