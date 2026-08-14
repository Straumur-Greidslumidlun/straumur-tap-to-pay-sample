import React, { useState } from "react";

import { BrandButton, ErrorText, Heading, Screen, Subtle } from "../components/Brand";
import { getServerBaseUrl } from "../config";
import { deviceModel } from "../deviceInfo";
import { TapToPay } from "../taptopay";

/**
 * First run: board this phone as a Tap to Pay device.
 * The Adyen SDK generates a setupToken and boards through your backend (which brokers the
 * session with Straumur); board() resolves with the device's POIID (installationId), which we
 * keep. The setupToken and sdkData are handled inside the native module — never in JS.
 */
export function SetupScreen({ onBoarded }: { onBoarded: (poiId: string) => void }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function setup() {
        setBusy(true);
        setError(null);
        try {
            TapToPay.setBackend(getServerBaseUrl(), deviceModel());
            const poiId = await TapToPay.board();
            onBoarded(poiId);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Setup failed. See the logs.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <Screen>
            <Heading>Set up this device</Heading>
            <Subtle>
                Boards this phone as a Tap to Pay device. The Adyen SDK gets its session through your backend at{" "}
                {getServerBaseUrl()} — your Straumur API key never leaves the server.
            </Subtle>
            <ErrorText>{error}</ErrorText>
            <BrandButton label="Set up device" onPress={setup} busy={busy} />
        </Screen>
    );
}
