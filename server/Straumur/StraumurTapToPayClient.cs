using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using StraumurTapToPaySample.Server.Api;

namespace StraumurTapToPaySample.Server.Straumur;

/// <summary>
/// Broker to the Straumur integrator Tap to Pay API. Holds the API key and store MID
/// server-side (from <see cref="StraumurOptions"/>) and exposes only what the merchant app
/// needs. The app talks to this server; this server talks to Straumur.
/// </summary>
public sealed class StraumurTapToPayClient
{
    private const string ApiKeyHeaderName = "X-API-key";
    private const string SessionsPath = "/api/v1/taptopay/integrator/sessions";
    private const string PaymentPath = "/api/v1/taptopay/integrator/payment";

    private readonly HttpClient _httpClient;
    private readonly StraumurOptions _options;

    public StraumurTapToPayClient(HttpClient httpClient, IOptions<StraumurOptions> options)
    {
        _options = options.Value;

        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri(_options.BaseUrl);
        _httpClient.DefaultRequestHeaders.Add(ApiKeyHeaderName, _options.ApiKey);
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    /// <summary>
    /// Exchanges the device <c>setupToken</c> for an Adyen SoftPOS session. The store MID is
    /// injected server-side, so the app only supplies the token (and optional device info).
    /// </summary>
    public async Task<CreateSessionResponse> CreateSessionAsync(CreateSessionRequest request, CancellationToken cancellationToken)
    {
        var payload = new StraumurSessionRequest(
            _options.StoreMid,
            request.SetupToken,
            request.DeviceModel,
            request.OsVersion,
            request.AppVersion);

        var response = await _httpClient.PostAsJsonAsync(SessionsPath, payload, cancellationToken);
        await EnsureSuccessAsync(response, cancellationToken);

        var session = await response.Content.ReadFromJsonAsync<StraumurSessionResponse>(cancellationToken);
        if (session is null)
        {
            throw new StraumurApiException(StatusCodes.Status502BadGateway, "Empty session response from Straumur.");
        }

        return new CreateSessionResponse(session.InstallationId, session.SdkData, session.MerchantAccount, session.Store);
    }

    /// <summary>
    /// Pre-creates the payment for a charge on a specific device (by POIID) and returns the
    /// server-built nexo request the app hands to the Adyen SDK. The MID is injected
    /// server-side; the currency the app displayed is forwarded as the expected-currency guard.
    /// </summary>
    public async Task<CreatePaymentResponse> CreatePaymentAsync(CreatePaymentRequest request, CancellationToken cancellationToken)
    {
        var expectedCurrency = string.IsNullOrWhiteSpace(request.Currency) ? _options.Currency : request.Currency;
        var payload = new StraumurPaymentRequest(_options.StoreMid, request.PoiId, request.Amount, expectedCurrency);

        var response = await _httpClient.PostAsJsonAsync(PaymentPath, payload, cancellationToken);
        await EnsureSuccessAsync(response, cancellationToken);

        var payment = await response.Content.ReadFromJsonAsync<StraumurPaymentResponse>(cancellationToken);
        if (payment is null)
        {
            throw new StraumurApiException(StatusCodes.Status502BadGateway, "Empty payment response from Straumur.");
        }

        return new CreatePaymentResponse(payment.Reference, payment.Amount, payment.Currency, payment.SaleToPoiRequest);
    }

    private static async Task EnsureSuccessAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        throw new StraumurApiException((int)response.StatusCode, body);
    }
}
