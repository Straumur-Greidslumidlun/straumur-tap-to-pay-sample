package com.straumur.taptopay.module

/**
 * Base URL of the integrator backend, pushed from JS via setBackend(). No tokens: the app
 * authenticates to its own backend, which holds the Straumur API key. [appVersion] is filled in
 * natively when the module is created.
 */
object SessionStore {
    @Volatile
    var baseUrl: String = ""

    @Volatile
    var appVersion: String = ""
}
