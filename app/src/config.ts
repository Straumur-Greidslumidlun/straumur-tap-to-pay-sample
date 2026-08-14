// Base URL of YOUR backend (the sample server in ../server) — NOT the Straumur API.
// The app only ever talks to your backend; your backend holds the Straumur API key and MID.
//
// An Android emulator reaches your machine at 10.0.2.2. For a physical device over USB, run
//   adb reverse tcp:5080 tcp:5080
// and keep 127.0.0.1 below. Configure per build with EXPO_PUBLIC_SERVER_BASE_URL.
let serverBaseUrl = process.env.EXPO_PUBLIC_SERVER_BASE_URL ?? "http://127.0.0.1:5080";

export const getServerBaseUrl = (): string => serverBaseUrl;

export const setServerBaseUrl = (url: string): void => {
    serverBaseUrl = url.trim();
};

// The currency the app displays to the shopper. Sent to your backend, which forwards it as
// Straumur's expected-currency guard (it must match the store's settlement currency).
export const storeCurrency = process.env.EXPO_PUBLIC_STORE_CURRENCY ?? "ISK";
