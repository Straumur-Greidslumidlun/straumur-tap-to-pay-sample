package com.straumur.taptopay.module

/**
 * Holds the integrator backend base URL (pushed from JS via setBackend()). The boarding path
 * ([StraumurAuthenticationProvider]) reads this to call the backend's /api/sessions endpoint.
 * No tokens: in the integrator flow the app authenticates to its own backend, not to Straumur,
 * and the backend holds the Straumur API key.
 */
object SessionStore {
    @Volatile
    var baseUrl: String = ""

    @Volatile
    var deviceModel: String = ""
}
