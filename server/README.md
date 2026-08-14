# Sample backend (ASP.NET Core)

The **integrator's own backend**. It holds your Straumur API key and store MID and brokers
the two Tap to Pay integrator calls to Straumur. The mobile app talks only to this server —
so the API key never ships inside the app.

```
[merchant app]  ──►  /api/sessions ──►  Straumur  POST /api/v1/taptopay/integrator/sessions
                ──►  /api/payments ──►  Straumur  POST /api/v1/taptopay/integrator/payment
                                        (X-API-key + storeMid added here, server-side)
```

## Endpoints (called by the app)

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/api/sessions` | `{ setupToken, deviceModel?, osVersion?, appVersion? }` | `{ installationId, sdkData, merchantAccount, store }` |
| `POST` | `/api/payments` | `{ poiId, amount, currency? }` | `{ reference, amount, currency, saleToPoiRequest }` |

The app never sends the API key or the store MID — the server injects both from configuration.

## Configuration

Set these under the `Straumur` section (`appsettings.json` ships with blanks):

| Key | Example | Notes |
|---|---|---|
| `Straumur:BaseUrl` | `https://checkout-api.staging.straumur.is` | Straumur Checkout API base URL. |
| `Straumur:ApiKey` | `AQE...` | Your Straumur API key. **Never commit this.** |
| `Straumur:StoreMid` | `1234567890` | The store these charges are for. |
| `Straumur:Currency` | `ISK` | Store settlement currency; sent as `expectedCurrency`. |

Keep the key out of source control — use environment variables or user-secrets:

```bash
# environment variables (double underscore = section separator)
export Straumur__ApiKey="AQE..."
export Straumur__StoreMid="1234567890"

# …or user-secrets (development)
dotnet user-secrets init
dotnet user-secrets set "Straumur:ApiKey" "AQE..."
dotnet user-secrets set "Straumur:StoreMid" "1234567890"
```

The server validates configuration on startup and refuses to boot if a required value is missing.

## Run

```bash
cd server
dotnet run
```

Listens on `http://localhost:5080`. Smoke-test it:

```bash
curl -sS -X POST http://localhost:5080/api/sessions \
  -H "Content-Type: application/json" \
  -d '{ "setupToken": "placeholder", "deviceModel": "Pixel 8" }'
```

A placeholder `setupToken` returns a `400` from Straumur (a real token comes from the Adyen
SDK) — that still proves the key, MID, and connectivity are wired up. Straumur error
messages are localized and forwarded through with their original status.

## What a real integrator adds

- **App-to-server auth.** Authenticate the app to this server with your own scheme and derive
  the store from that identity instead of a configured MID — don't trust client-supplied store
  selection.
- **Scoped CORS.** Replace the wide-open policy with your app's origin(s).
- **Multiple stores.** If you serve more than one store, resolve the MID per authenticated
  merchant rather than from a single config value.
