using System.Net.Http.Json;

// Your Straumur credentials — kept server-side, never in the app. Replace these placeholders.
const string BaseUrl = "https://checkout-api.staging.straumur.is";
const string ApiKey = "REPLACE_WITH_YOUR_API_KEY";
const string StoreMid = "1234567890";

var http = new HttpClient { BaseAddress = new Uri(BaseUrl) };
http.DefaultRequestHeaders.Add("X-API-key", ApiKey);

var app = WebApplication.Create(args);

// The app calls these two endpoints. The server adds the API key + store MID, forwards to
// Straumur, and reads Straumur's response straight back to the app.

app.MapPost("/api/sessions", async (SessionRequest req) =>
{
    var res = await http.PostAsJsonAsync("/api/v1/taptopay/integrator/sessions",
        new { StoreMid, req.SetupToken, req.DeviceModel });
    return Results.Content(await res.Content.ReadAsStringAsync(), "application/json", statusCode: (int)res.StatusCode);
});

app.MapPost("/api/payments", async (PaymentRequest req) =>
{
    var res = await http.PostAsJsonAsync("/api/v1/taptopay/integrator/payment",
        new { StoreMid, req.PoiId, req.Amount, ExpectedCurrency = req.Currency });
    return Results.Content(await res.Content.ReadAsStringAsync(), "application/json", statusCode: (int)res.StatusCode);
});

app.Run("http://localhost:5080");

record SessionRequest(string SetupToken, string? DeviceModel);
record PaymentRequest(string PoiId, decimal Amount, string Currency);
