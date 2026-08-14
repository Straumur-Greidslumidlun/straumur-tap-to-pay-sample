import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ChargeScreen } from "./src/screens/ChargeScreen";
import { SetupScreen } from "./src/screens/SetupScreen";

// The device POIID is the only state we persist: present -> device is boarded -> Charge;
// absent -> Setup. Stored in the platform secure store (Keychain / Keystore).
const POIID_KEY = "straumur.taptopay.poiid";

export default function App() {
    const [ready, setReady] = useState(false);
    const [poiId, setPoiId] = useState<string | null>(null);

    useEffect(() => {
        SecureStore.getItemAsync(POIID_KEY)
            .then(setPoiId)
            .finally(() => setReady(true));
    }, []);

    async function onBoarded(id: string) {
        await SecureStore.setItemAsync(POIID_KEY, id);
        setPoiId(id);
    }

    async function onReset() {
        await SecureStore.deleteItemAsync(POIID_KEY);
        setPoiId(null);
    }

    return (
        <SafeAreaProvider>
            <StatusBar style="light" />
            {!ready ? null : poiId ? (
                <ChargeScreen poiId={poiId} onReset={onReset} />
            ) : (
                <SetupScreen onBoarded={onBoarded} />
            )}
        </SafeAreaProvider>
    );
}
