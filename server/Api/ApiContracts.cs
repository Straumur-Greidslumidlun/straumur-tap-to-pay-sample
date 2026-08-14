namespace StraumurTapToPaySample.Server.Api;

/// <summary>
/// App -&gt; server: start an Adyen SoftPOS session for the device holding this
/// <c>setupToken</c>. Note there is no API key and no MID here — the server supplies both.
/// </summary>
public sealed record CreateSessionRequest(
    string SetupToken,
    string? DeviceModel,
    string? OsVersion,
    string? AppVersion);

/// <summary>
/// Server -&gt; app: the Adyen SDK boarding data. <c>InstallationId</c> is the device's POIID,
/// which the app keeps and sends back on the payment call.
/// </summary>
public sealed record CreateSessionResponse(
    string InstallationId,
    string SdkData,
    string MerchantAccount,
    string Store);

/// <summary>
/// App -&gt; server: take a payment on a device (by POIID). <c>Currency</c> is what the app
/// displayed to the shopper; the server forwards it as the expected-currency guard (and
/// falls back to the configured store currency when omitted).
/// </summary>
public sealed record CreatePaymentRequest(
    string PoiId,
    decimal Amount,
    string? Currency);

/// <summary>
/// Server -&gt; app: the server-built Adyen <c>SaleToPOIRequest</c> to hand to the SDK verbatim,
/// plus the Straumur payment reference to correlate the webhook result.
/// </summary>
public sealed record CreatePaymentResponse(
    string Reference,
    decimal Amount,
    string Currency,
    string SaleToPoiRequest);
