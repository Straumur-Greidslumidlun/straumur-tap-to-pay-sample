package com.straumur.taptopay.module

import com.adyen.ipp.api.authentication.AuthenticationProvider
import com.adyen.ipp.api.authentication.MerchantAuthenticationService

/**
 * The Adyen SDK discovers this service (declared in the manifest) and uses its authenticationProvider to board.
 */
class StraumurAuthenticationService : MerchantAuthenticationService() {
    override val authenticationProvider: AuthenticationProvider
        get() = StraumurAuthenticationProvider()
}
