# Sample backend (ASP.NET Core)

The **integrator's own backend** — a minimal proxy. It holds your Straumur API key + store MID
and forwards the two Tap to Pay integrator calls to Straumur. The mobile app talks only to this
server, so the API key never ships inside the app.

```
[merchant app]  ──►  /api/sessions ──►  Straumur  POST /api/v1/taptopay/integrator/sessions
                ──►  /api/payments ──►  Straumur  POST /api/v1/taptopay/integrator/payment
                                        (X-API-key + storeMid added here, server-side)
```

The whole thing is one file — [`Program.cs`](./Program.cs): add the key + MID, forward the
request, read the response straight back to the app.

## Endpoints (called by the app)

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/api/sessions` | `{ setupToken, deviceModel?, osVersion?, appVersion? }` | Straumur's session response (`installationId`, `sdkData`, …) |
| `POST` | `/api/payments` | `{ poiId, amount, currency }` | Straumur's payment response (`reference`, `saleToPoiRequest`, …) |

`amount` is in **minor units**, like every Straumur Checkout API amount: ISK has 2 decimals, so
1000 ISK is `100000`. Amounts below the currency minimum are rejected.

The app never sends the API key or store MID — the server injects both.

## Disabling a device (back office)

When a phone is lost or retired, disable it from your server, never from the app:

```bash
cd server
dotnet run -- disable <poiId>
```

This calls Straumur `…/integrator/devices/disable` with your store MID and prints the response. A disabled
device can no longer get a session or take a payment, in any of your stores. Disabling a device that is already
disabled is rejected with error `2048`. The POIID is the device's Adyen installation id (shown in the app and on
each payment).

Rejections come back as `400` with `{ errorMessage, errorCode, responseIdentifier }`; quote the
`responseIdentifier` when contacting Straumur support.

## Configure + run

Your **API key** and **store MID** come from Straumur — request them if you don't have them yet.

Put them in `secrets.json` — it is **gitignored**, so the key is never committed:

```bash
cd server
cp secrets.example.json secrets.json
# then fill in ApiKey + StoreMid
```

```json
{
  "BaseUrl": "https://checkout-api.staging.straumur.is",
  "ApiKey": "YOUR_STRAUMUR_API_KEY",
  "StoreMid": "YOUR_STORE_MID"
}
```

Environment variables (`ApiKey=…`, `StoreMid=…`) work too and take precedence over the file's
absence. Then:

```bash
cd server
dotnet run          # http://localhost:5080
```

Smoke-test it:

```bash
curl -sS -X POST http://localhost:5080/api/sessions \
  -H "Content-Type: application/json" \
  -d '{ "setupToken": "placeholder", "deviceModel": "Pixel 8" }'
```

A placeholder `setupToken` returns a `400` from Straumur (a real token comes from the Adyen
SDK) — that still proves the key, MID, and connectivity are wired up.

## This is a sample

Deliberately bare — happy path only, no auth, no validation. A real integrator would keep the
key in configuration/secrets (not in source), authenticate the app to this server, and derive
the store from that identity rather than a hardcoded MID.
