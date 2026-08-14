using System.ComponentModel.DataAnnotations;

namespace StraumurTapToPaySample.Server.Straumur;

/// <summary>
/// Configuration for talking to the Straumur Checkout API.
/// In a real integration these values live in server-side configuration or a secret
/// store (environment variables, user-secrets, a vault) — never in the mobile app.
/// </summary>
public sealed class StraumurOptions
{
    public const string SectionName = "Straumur";

    /// <summary>
    /// Base URL of the Straumur Checkout API,
    /// e.g. <c>https://checkout-api.staging.straumur.is</c>.
    /// </summary>
    [Required]
    public required string BaseUrl { get; set; }

    /// <summary>
    /// Your Straumur API key. Sent as the <c>X-API-key</c> header on every call and kept
    /// server-side only — it must never reach the mobile app.
    /// </summary>
    [Required]
    public required string ApiKey { get; set; }

    /// <summary>
    /// The MID of the store these charges are for. The app never chooses this; the server
    /// knows which store the request belongs to.
    /// </summary>
    [Required]
    public required string StoreMid { get; set; }

    /// <summary>
    /// The store's settlement currency (e.g. <c>ISK</c>). Echoed to Straumur as
    /// <c>expectedCurrency</c> so a mismatch with what the app displayed is rejected.
    /// </summary>
    [Required]
    public required string Currency { get; set; }
}
