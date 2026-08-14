namespace StraumurTapToPaySample.Server.Straumur;

// Wire contracts for the Straumur integrator Tap to Pay endpoints. These mirror the API
// exactly and stay internal — the app-facing shapes in Api/ApiContracts.cs are what the
// mobile app sees.

internal sealed record StraumurSessionRequest(
    string StoreMid,
    string SetupToken,
    string? DeviceModel,
    string? OsVersion,
    string? AppVersion);

internal sealed record StraumurSessionResponse(
    string Id,
    string InstallationId,
    string SdkData,
    string MerchantAccount,
    string Store);

internal sealed record StraumurPaymentRequest(
    string StoreMid,
    string PoiId,
    decimal Amount,
    string ExpectedCurrency);

internal sealed record StraumurPaymentResponse(
    string Reference,
    decimal Amount,
    string Currency,
    string SaleToPoiRequest);
