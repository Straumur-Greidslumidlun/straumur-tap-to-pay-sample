# Sample app (Expo / React Native)

The **merchant-facing app**. It talks to your backend (the `../server` project) for the REST
calls and drives the **Adyen POS Mobile SDK** for the contactless card read. It never holds the
Straumur API key.

## Flow

```
Setup   ──►  TapToPay.setBackend(url)  ──►  TapToPay.board()
             (SDK makes a setupToken -> your backend /api/sessions -> sdkData, all inside the
              native module) -> resolves the device POIID
Charge  ──►  POST /api/payments  ──►  TapToPay.charge(saleToPoiRequest)  ──►  onPaymentResult
```

Only the device **POIID** is persisted (secure store). Present → **Take a payment**; absent →
**Set up this device**. The `setupToken` and `sdkData` are handled inside the native module —
they never surface to JS.

## Structure

```
app/
  App.tsx                          status (boarded?) -> Setup or Charge
  src/
    config.ts                      YOUR backend URL (not Straumur) + display currency
    api/client.ts                  POST /api/payments (the session call is native, in board())
    taptopay/index.ts              re-exports the native module as `TapToPay`
    screens/                       SetupScreen, ChargeScreen
    components/Brand.tsx            themed Screen / Button / Field
  modules/straumur-tap-to-pay/     local Expo module wrapping the Adyen POS Mobile SDK (Android)
  plugins/                         config plugins: Adyen maven repo + MainActivity registration
```

## Prerequisites for a real payment

- An **Adyen account enabled for Tap to Pay**, and an SDK-download API key (Customer Area →
  Developers → API credentials, role *"Allow SDK download for POS developers"*).
- A physical **Android 12+ device with NFC** and an Adyen **test card**.
- The `../server` backend running with your Straumur API key + store MID.

Provide the Adyen SDK-download key via the gitignored local file (never committed):

```bash
cp adyen-sdk.properties.example adyen-sdk.properties
# then set adyenSdkApiKey=AQE... in adyen-sdk.properties
```

At `expo prebuild` the config plugin reads this file and injects the key as the `adyenSdkApiKey`
Gradle property to authenticate Adyen's maven repo (and registers the payment-result launcher in
`MainActivity`). `adyen-sdk.properties` is gitignored; only the `.example` template is committed.
Alternatives if you prefer: the `ADYEN_SDK_API_KEY` env var, or `~/.gradle/gradle.properties`.

## Run

```bash
npm install

# point the app at your backend (defaults to http://127.0.0.1:5080)
export EXPO_PUBLIC_SERVER_BASE_URL="http://127.0.0.1:5080"

# physical Android device over USB — tunnel the backend to the phone, then build a dev client:
adb reverse tcp:5080 tcp:5080
npx expo run:android
```

The native Adyen module requires a **dev build** (`expo run:android`) — it is not available in
Expo Go. Type-check with `npm run tsc`.

Walk **Set up this device** once (boards the phone), then **Take a payment**: enter an amount,
tap **Charge**, and present the card when the Adyen UI appears. The result shows on the app and
also arrives on your Straumur payment webhook, matched by the returned reference.

## End-to-end tests

[Maestro](https://maestro.mobile.dev) flows live in [`e2e/`](./e2e) — `npm run e2e`. They drive
the app UI through boarding and the payment call; the contactless tap itself is hardware and
can't be automated. See [`e2e/README.md`](./e2e/README.md).
