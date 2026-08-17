import { NativeModule, requireNativeModule } from "expo";
import { Platform } from "react-native";

/** Result of a Tap to Pay transaction, delivered via the onPaymentResult event. */
export type ChargeResult = {
    success: boolean;
    message: string;
    rawTerminalApiResponse?: string;
};

export type PaymentResultSubscription = { remove: () => void };

type StraumurTapToPayEvents = {
    onPaymentResult: (result: ChargeResult) => void;
};

declare class StraumurTapToPayNativeModule extends NativeModule<StraumurTapToPayEvents> {
    version(): string;
    setBackend(baseUrl: string): void;
    board(): Promise<string>;
    clearSession(): Promise<void>;
    charge(saleToPoiRequest: string): Promise<void>;
}

// The native Adyen bridge only exists on Android. Lazy-require so iOS / Expo Go don't crash at
// import; callers gate on isAvailable.
let nativeModule: StraumurTapToPayNativeModule | null = null;

function native(): StraumurTapToPayNativeModule {
    if (!nativeModule) {
        nativeModule = requireNativeModule<StraumurTapToPayNativeModule>("StraumurTapToPay");
    }
    return nativeModule;
}

export const StraumurTapToPay = {
    /** True where the native Adyen bridge is present (an Android dev build, not Expo Go). */
    isAvailable: Platform.OS === "android",

    version(): string {
        return native().version();
    },

    /** Points the native boarding path at your backend (base URL) before board(). */
    setBackend(baseUrl: string): void {
        native().setBackend(baseUrl);
    },

    /**
     * Boards the SDK and resolves with the device's installationId (POIID). The SDK generates a
     * setupToken internally and the native MerchantAuthenticationService exchanges it for sdkData
     * via your backend — the setupToken never surfaces to JS.
     */
    board(): Promise<string> {
        return native().board();
    },

    /** Clears the SDK's cached session so the next board() re-boards. */
    clearSession(): Promise<void> {
        return native().clearSession();
    },

    /**
     * Runs a Tap to Pay transaction from the backend-built nexo SaleToPOIRequest
     * (POST /api/payments). The outcome arrives via onPaymentResult.
     */
    charge(saleToPoiRequest: string): Promise<void> {
        return native().charge(saleToPoiRequest);
    },

    addPaymentResultListener(listener: (result: ChargeResult) => void): PaymentResultSubscription {
        return native().addListener("onPaymentResult", listener);
    },
};
