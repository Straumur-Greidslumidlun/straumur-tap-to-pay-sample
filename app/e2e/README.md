# End-to-end flows (Maestro)

UI flows for the sample app, written for [Maestro](https://maestro.mobile.dev).

| Flow | What it covers |
|---|---|
| `01-setup-device.yaml` | Boards the phone: **Set up device** → `/api/sessions` → lands on the payment screen |
| `02-take-payment.yaml` | Enters an amount and taps **Charge** → `/api/payments` → hands off to the Adyen SDK |

## What these can and can't do

They drive the app's own UI end to end — navigation, boarding, amount entry, and the REST calls
through your backend to Straumur. They **cannot simulate the contactless card tap**: that is
physical NFC hardware driven by the Adyen SDK, and no e2e tool (Maestro, Detox, Appium) can fake
it. `02-take-payment.yaml` therefore stops at the SDK hand-off; present a test card by hand to
carry it through to the result, and uncomment the final assertions for an attended run.

## Prerequisites

- The `../../server` backend running with a real Straumur API key + store MID.
- A **dev build** on a connected Android device (`npx expo run:android`) — the native Adyen
  module does not exist in Expo Go.
- Maestro installed: <https://maestro.mobile.dev/getting-started/installing-maestro>

## Run

```bash
maestro test e2e/                        # both flows, in order
maestro test e2e/01-setup-device.yaml    # a single flow
maestro studio                           # interactive selector explorer
```

## Note on selectors

These flows select by visible text (`"Charge"`, the `"0.00"` placeholder) to keep them readable
and the sample app uncluttered. In a production app prefer stable `testID` props on the elements
you assert against, so copy changes and translations don't break the suite.
