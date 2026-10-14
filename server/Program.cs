using System.Net.Http.Json;

var builder = WebApplication.CreateBuilder(args);

// Your Straumur credentials — kept server-side, never in the app. Put the real values in
// secrets.json (gitignored; copy secrets.example.json) or set them as environment variables.
builder.Configuration.AddJsonFile("secrets.json", optional: true);

var baseUrl = builder.Configuration["BaseUrl"] ?? "https://checkout-api.staging.straumur.is";
var apiKey = builder.Configuration["ApiKey"] ?? "REPLACE_WITH_YOUR_API_KEY";
var storeMid = builder.Configuration["StoreMid"] ?? "1234567890";

var http = new HttpClient { BaseAddress = new Uri(baseUrl) };
http.DefaultRequestHeaders.Add("X-API-key", apiKey);

// Back office: `dotnet run -- disable <poiId>` disables a device (e.g. a lost or retired phone) and exits. It is not
// an HTTP route on purpose — the app must never be able to disable a device; in a real integration this is an action
// in your own back office or support tooling. A disabled device can no longer get a session or take a payment, in any
// of your stores, and disabling it again is rejected with error 2048.
if (args is ["disable", var poiIdToDisable])
{
    var res = await http.PostAsJsonAsync("/api/v1/taptopay/integrator/devices/disable",
        new { storeMid, PoiId = poiIdToDisable });
    Console.WriteLine($"HTTP {(int)res.StatusCode}: {await res.Content.ReadAsStringAsync()}");

    return res.IsSuccessStatusCode ? 0 : 1;
}

var app = builder.Build();

// The app calls these two endpoints. The server adds the API key + store MID, forwards to
// Straumur, and reads Straumur's response straight back to the app.

app.MapPost("/api/sessions", async (SessionRequest req) =>
{
    var res = await http.PostAsJsonAsync("/api/v1/taptopay/integrator/sessions",
        new { storeMid, req.SetupToken, req.DeviceModel, req.OsVersion, req.AppVersion });
    return Results.Content(await res.Content.ReadAsStringAsync(), "application/json", statusCode: (int)res.StatusCode);
});

app.MapPost("/api/payments", async (PaymentRequest req) =>
{
    var res = await http.PostAsJsonAsync("/api/v1/taptopay/integrator/payment",
        new { storeMid, req.PoiId, req.Amount, ExpectedCurrency = req.Currency });
    return Results.Content(await res.Content.ReadAsStringAsync(), "application/json", statusCode: (int)res.StatusCode);
});

app.Run("http://localhost:5080");

return 0;

record SessionRequest(string SetupToken, string? DeviceModel, string? OsVersion, string? AppVersion);

// Amount is in minor units, like every Straumur Checkout API amount (ISK has 2 decimals, so 1000 ISK = 100000).
record PaymentRequest(string PoiId, long Amount, string Currency);
