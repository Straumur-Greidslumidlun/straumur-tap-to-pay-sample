namespace StraumurTapToPaySample.Server.Straumur;

/// <summary>
/// Raised when the Straumur API returns a non-success status. Carries the original status
/// code and response body so the caller can forward them to the mobile app unchanged
/// (Straumur error messages are already localized).
/// </summary>
public sealed class StraumurApiException : Exception
{
    public StraumurApiException(int statusCode, string responseBody)
        : base($"Straumur API returned {statusCode}.")
    {
        StatusCode = statusCode;
        ResponseBody = responseBody;
    }

    public int StatusCode { get; }

    public string ResponseBody { get; }
}
