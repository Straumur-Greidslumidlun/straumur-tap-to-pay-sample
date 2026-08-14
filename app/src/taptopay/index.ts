import { Platform } from "react-native";

/** Result of a Tap to Pay transaction. */
export type ChargeResult = {
    success: boolean;
    message: string;
    rawTerminalApiResponse?: string;
};

// -----------------------------------------------------------------------------------------
// Facade over the native Adyen "Tap to Pay on Android" bridge.
//
// Taking a real contactless payment needs the Adyen POS Mobile SDK wired into a local native
// module, plus an Adyen account enabled for Tap to Pay, an SDK-download key, and a physical
// NFC device. To keep this sample runnable without all that, it ships in MOCK mode: the
// boarding + charge calls return placeholders so the app + REST flow (app -> your backend ->
// Straumur) are exercisable end to end.
//
// Note: with a placeholder setup token, your backend's /sessions call returns a 400 from
// Straumur (a real token only comes from the SDK). That still proves the app reaches your
// backend and your backend reaches Straumur with the right key + MID.
//
// To wire the real SDK: build a local Expo module (Android) wrapping the Adyen POS Mobile SDK,
// implement startBoarding/completeBoarding/charge against it, and set MOCK = false. See
// https://docs.adyen.com/point-of-sale/mobile-android/build/tap-to-pay
// -----------------------------------------------------------------------------------------
const MOCK = true;

export const TapToPay = {
    /** True once the real native Adyen bridge is present (Android dev build). */
    isNativeAvailable: !MOCK && Platform.OS === "android",

    /** Asks the SDK to produce a setupToken to send to your backend. */
    async startBoarding(): Promise<string> {
        if (MOCK) {
            return "placeholder-setup-token";
        }
        throw new Error("Native Adyen bridge not wired. See src/taptopay/index.ts.");
    },

    /** Completes SDK boarding with the sdkData your backend returned from Straumur. */
    async completeBoarding(_sdkData: string): Promise<void> {
        if (MOCK) {
            return;
        }
        throw new Error("Native Adyen bridge not wired. See src/taptopay/index.ts.");
    },

    /** Runs the transaction from the backend-built nexo SaleToPOIRequest; resolves with the outcome. */
    async charge(_saleToPoiRequest: string): Promise<ChargeResult> {
        if (MOCK) {
            return {
                success: true,
                message: "Mock approval — no card was read. Wire the Adyen SDK to take a real payment.",
            };
        }
        throw new Error("Native Adyen bridge not wired. See src/taptopay/index.ts.");
    },
};
