# Sample app (Expo / React Native)

The **merchant-facing app**. It talks only to your backend (the `../server` project) — never
directly to Straumur, and it never holds the Straumur API key. It boards the device and takes
payments; your backend brokers each call to Straumur.

## Flow

```
Setup   ──►  TapToPay.startBoarding()  ──►  POST /api/sessions  ──►  TapToPay.completeBoarding(sdkData)
Charge  ──►  POST /api/payments        ──►  TapToPay.charge(saleToPoiRequest)  ──►  result
```

Only one thing is persisted (in the secure store): the device **POIID**. Present → the app
shows **Take a payment**; absent → **Set up this device**.

## Structure

```
app/
  App.tsx                 status (boarded?) -> Setup or Charge
  src/
    config.ts             YOUR backend URL (not Straumur) + display currency
    api/client.ts         calls your backend: /api/sessions, /api/payments
    taptopay/index.ts     Adyen SDK facade (MOCK until the native bridge is wired)
    screens/              SetupScreen, ChargeScreen
    components/Brand.tsx  themed Screen / Button / Field
    theme.ts              Straumur palette
```

## Run

```bash
npm install

# point the app at your backend (defaults to http://127.0.0.1:5080)
export EXPO_PUBLIC_SERVER_BASE_URL="http://127.0.0.1:5080"

# physical Android device over USB — tunnel your backend to the phone:
adb reverse tcp:5080 tcp:5080
npm run android
# or, for the REST flow in Expo Go / an emulator:
npm start
```

Type-check with `npm run tsc`.

## Taking a real payment (wiring the Adyen SDK)

`src/taptopay/index.ts` ships in **MOCK** mode so the REST flow runs without any Adyen setup —
a placeholder setup token makes the backend's `/api/sessions` call return a `400` from
Straumur, which still proves the app → backend → Straumur path.

To take a real contactless payment you need to:

1. Build a local Expo native module (Android) wrapping the **Adyen POS Mobile SDK**.
2. Implement `startBoarding` / `completeBoarding` / `charge` against it.
3. Set `MOCK = false` in `src/taptopay/index.ts`.
4. Have an Adyen account enabled for Tap to Pay, an SDK-download key, and a physical Android
   12+ device with NFC.

Adyen docs: <https://docs.adyen.com/point-of-sale/mobile-android/build/tap-to-pay>
