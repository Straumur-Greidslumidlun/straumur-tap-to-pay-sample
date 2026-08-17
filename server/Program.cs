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

var app = builder.Build();

// The app calls these two endpoints. The server adds the API key + store MID, forwards to
// Straumur, and reads Straumur's response straight back to the app.

app.MapPost("/api/sessions", async (SessionRequest req) =>
{
    var res = await http.PostAsJsonAsync("/api/v1/taptopay/integrator/sessions",
        new { storeMid, req.SetupToken, req.DeviceModel });
    return Results.Content(await res.Content.ReadAsStringAsync(), "application/json", statusCode: (int)res.StatusCode);
});

app.MapPost("/api/payments", async (PaymentRequest req) =>
{
    var res = await http.PostAsJsonAsync("/api/v1/taptopay/integrator/payment",
        new { storeMid, req.PoiId, req.Amount, ExpectedCurrency = req.Currency });
    return Results.Content(await res.Content.ReadAsStringAsync(), "application/json", statusCode: (int)res.StatusCode);
});

app.Run("http://localhost:5080");

record SessionRequest(string SetupToken, string? DeviceModel);
record PaymentRequest(string PoiId, decimal Amount, string Currency);
