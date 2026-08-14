package com.straumur.taptopay.module

import com.adyen.ipp.api.authentication.AuthenticationProvider
import com.adyen.ipp.api.authentication.AuthenticationResponse

/**
 * Boards the SDK: the SDK hands us a setupToken; we exchange it for sdkData via our backend /sessions endpoint
 * ([BackendApi], using the session pushed from JS) and hand sdkData back. Auto-refresh on 401 lives in BackendApi.
 */
class StraumurAuthenticationProvider : AuthenticationProvider {
    override suspend fun authenticate(setupToken: String): Result<AuthenticationResponse> {
        return try {
            val sdkData = BackendApi.createSession(setupToken)
            Result.success(AuthenticationResponse.create(sdkData))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
