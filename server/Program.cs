using StraumurTapToPaySample.Server.Api;
using StraumurTapToPaySample.Server.Straumur;

var builder = WebApplication.CreateBuilder(args);

// Straumur credentials (API key + store MID) are bound from configuration and validated on
// startup, so a misconfigured server fails fast instead of on the first request.
builder.Services.AddOptions<StraumurOptions>()
    .Bind(builder.Configuration.GetSection(StraumurOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddHttpClient<StraumurTapToPayClient>();

builder.Services.AddExceptionHandler<StraumurExceptionHandler>();
builder.Services.AddProblemDetails();

// The merchant app runs on a device and calls this server cross-origin. A real integrator
// would lock this down to their own app's origin(s).
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowAnyOrigin()));

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors();

// ---------------------------------------------------------------------------------------
// The merchant app calls THESE endpoints. It never sees the Straumur API key or store MID;
// this server holds them and brokers every call to Straumur's Checkout API.
//
// In production you would authenticate the app to this server with your own scheme (the
// integrator's user/session auth) and derive the store from that identity, rather than
// trusting anything client-supplied. That app-to-server auth is intentionally left out to
// keep the Straumur flow front and center.
// ---------------------------------------------------------------------------------------

app.MapPost("/api/sessions", async (
    CreateSessionRequest request,
    StraumurTapToPayClient straumur,
    CancellationToken cancellationToken) =>
{
    var result = await straumur.CreateSessionAsync(request, cancellationToken);
    return Results.Ok(result);
});

app.MapPost("/api/payments", async (
    CreatePaymentRequest request,
    StraumurTapToPayClient straumur,
    CancellationToken cancellationToken) =>
{
    var result = await straumur.CreatePaymentAsync(request, cancellationToken);
    return Results.Ok(result);
});

app.MapGet("/", () => "Straumur Tap to Pay sample server. POST /api/sessions and /api/payments.");

app.Run();
