# Sample app (Expo / React Native)

The **merchant-facing app**. It talks to your backend (the `../server` project) for the REST
calls and drives the **Adyen POS Mobile SDK** for the contactless card read. It never holds the
Straumur API key.

## Flow

```
on launch  ──►  TapToPay.setBackend(url)  ──►  TapToPay.board()
                (the SDK makes a setupToken and boards through your backend /api/sessions
                 -> sdkData, all inside the native module) -> resolves the device POIID
Charge     ──►  POST /api/payments  ──►  TapToPay.charge(saleToPoiRequest)  ──►  onPaymentResult
```

The device boards on every launch — the SDK caches its session, so only the first one hits
`/api/sessions`. The `setupToken` and `sdkData` are handled inside the native module and never
surface to JS, and device info (model, OS, app version) is read natively at the source.

## Structure

The whole app is **one file** — [`App.tsx`](./App.tsx), ~120 lines including styles:

```
app/
  App.tsx                          the entire app: board on launch, enter amount, charge
  modules/straumur-tap-to-pay/     local Expo module wrapping the Adyen POS Mobile SDK (Android)
  plugins/                         config plugins: Adyen maven repo + MainActivity registration
```

## Prerequisites for a real payment

**You do not need an Adyen account.** Straumur is the Adyen account owner and supplies everything:

- An **SDK-download key** — needed to download the Adyen POS Mobile SDK from Adyen's credentialed
  maven repo. **Request it from Straumur.**
- A **Straumur API key** and your **store MID**, for the `../server` backend.
- A physical **Android 12+ device with NFC**, and a **test card** for testing.

Provide the SDK-download key via the gitignored local file (never committed):

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

The app boards the device on launch, then shows **Take a payment** with the amount prefilled
(1000 ISK). Tap **Charge** and present the card when the Adyen UI appears. The result shows in
the app and also arrives on your Straumur payment webhook, matched by the returned reference.
