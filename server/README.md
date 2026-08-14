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
| `POST` | `/api/sessions` | `{ setupToken, deviceModel? }` | Straumur's session response (`installationId`, `sdkData`, …) |
| `POST` | `/api/payments` | `{ poiId, amount, currency }` | Straumur's payment response (`reference`, `saleToPoiRequest`, …) |

The app never sends the API key or store MID — the server injects both.

## Configure + run

Set your credentials at the top of `Program.cs` (placeholders ship in-file):

```csharp
const string ApiKey  = "REPLACE_WITH_YOUR_API_KEY";
const string StoreMid = "1234567890";
```

Then:

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
