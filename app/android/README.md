# Sample app (native Android)

The **merchant-facing app**, in Kotlin. It talks to your backend (the `../../server` project) for
the REST calls and drives the **Adyen POS Mobile SDK** for the contactless card read. It never
holds the Straumur API key.

This is the most direct way to integrate: Adyen ships the Tap to Pay SDK for **native Android
only** — there are no official React Native or Flutter wrappers — so everything else is a bridge
over this.

## The whole app is one file

[`MainActivity.kt`](./app/src/main/java/com/straumur/taptopay/androidsample/MainActivity.kt) —
~190 lines containing all of it:

| Piece | What it does |
|---|---|
| `post()` | plain `HttpURLConnection` JSON POST to your backend |
| `StraumurAuthenticationService` | the SDK boards through this: `setupToken` → `/api/sessions` → `sdkData` |
| `MainActivity` | boards on launch, Compose UI, `charge()` → `/api/payments` → SDK |

## Flow

```
on launch  ──►  InPersonPayments.warmUp() + getInstallationId()
                (the SDK makes a setupToken and boards via StraumurAuthenticationService
                 -> your backend /api/sessions -> sdkData) -> resolves the device POIID
Charge     ──►  POST /api/payments  ──►  InPersonPayments.performTransaction(...)
                                          -> result on the registered launcher
```

The SDK caches its session, so only the first launch actually calls `/api/sessions`.

## Prerequisites

**You do not need an Adyen account.** Straumur is the Adyen account owner and supplies everything:

- An **SDK-download key** — needed to download the Adyen POS Mobile SDK from Adyen's credentialed
  maven repo. **Request it from Straumur.**
- A **Straumur API key** and your **store MID**, for the `../../server` backend.
- A physical **Android 12+ device with NFC**, and a **test card** for testing.

Put the SDK-download key in `~/.gradle/gradle.properties` (never commit it):

```properties
adyenSdkApiKey=AQE...
```

`settings.gradle.kts` uses it to authenticate Adyen's maven repo.

## Run

```bash
# tunnel the backend to the phone, then build + install
adb reverse tcp:5080 tcp:5080
./gradlew installDebug
```

Or open `app/android` in Android Studio and hit Run.

The app boards the device on launch and shows **Take a payment** with the amount prefilled
(1000 ISK). Tap **Charge** and present the card when the Adyen UI appears. The result shows in
the app and also arrives on your Straumur payment webhook, matched by the returned reference.

## Gotcha: wait for SDK initialization

The Adyen SDK initializes **asynchronously** (via App Startup, in its own `:ipp` process). Calling
`warmUp()` straight from `onCreate` loses that race and fails with:

```
IPP SDK is not initialized. State: `AwaitingInitialization`
```

So board only once the state has settled:

```kotlin
val state = InPersonPayments.initialized.first { it !is InitializationState.AwaitingInitialization }
if (state is InitializationState.FailedInitialization) { /* state.failureReasons */ }
```

Cross-platform apps often mask this by accident — a React Native app spends seconds loading its JS
bundle first, which gives the SDK time to initialize. A native app starts far faster.

## Notes for a real integration

- `SERVER_URL` is a constant at the top of `MainActivity.kt` — move it to a build config field.
- `usesCleartextTraffic` is only there to reach a local `http` backend; use HTTPS and drop it
  (along with the `tools:replace`) in production.
- The SDK dependencies are the `-debug` variants; switch to the release ones to ship.
- Authenticate the app to your backend with your own scheme, and derive the store from that
  identity rather than a configured MID.
