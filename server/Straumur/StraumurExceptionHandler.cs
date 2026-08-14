using Microsoft.AspNetCore.Diagnostics;

namespace StraumurTapToPaySample.Server.Straumur;

/// <summary>
/// Surfaces a failed Straumur call to the mobile app as the same HTTP status with the
/// original (already localized) message, instead of collapsing it to a 500.
/// </summary>
public sealed class StraumurExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is not StraumurApiException straumurException)
        {
            return false;
        }

        httpContext.Response.StatusCode = straumurException.StatusCode;
        httpContext.Response.ContentType = "application/json";
        await httpContext.Response.WriteAsync(straumurException.ResponseBody, cancellationToken);

        return true;
    }
}
