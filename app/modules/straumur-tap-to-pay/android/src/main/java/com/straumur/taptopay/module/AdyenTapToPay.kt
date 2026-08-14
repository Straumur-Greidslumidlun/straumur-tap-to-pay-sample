package com.straumur.taptopay.module

import android.content.Context
import com.adyen.ipp.api.InPersonPayments
import com.adyen.ipp.api.payment.PaymentInterfaceType
import com.adyen.ipp.api.payment.TransactionRequest
import com.adyen.ipp.api.ui.MerchantUiParameters

/** Thin wrapper over the Adyen POS Mobile SDK: warm-up/board and perform a Tap to Pay transaction. */
object AdyenTapToPay {

    fun version(): String = InPersonPayments.version

    suspend fun boardAndGetInstallationId(): Result<String> = runCatching {
        InPersonPayments.warmUp().getOrThrow()
        InPersonPayments.getInstallationId().getOrThrow()
    }

    /**
     * Clears the SDK's cached communication session so the next [boardAndGetInstallationId] re-boards through the
     * MerchantAuthenticationService (our /sessions). Called on unpair: a re-paired device is a fresh device record
     * server-side, so it must re-board to persist its installationId rather than reuse the cached session.
     */
    suspend fun clearSession(): Result<Unit> = runCatching { InPersonPayments.clearSession().getOrThrow() }

    /**
     * Performs a Tap to Pay transaction from the nexo SaleToPOIRequest built by our backend
     * (POST /taptopay/payment). The amount, currency, and reference are owned server-side; the device only
     * forwards the request to the SDK so the charged amount can't be tampered with on the device.
     */
    @OptIn(kotlinx.serialization.ExperimentalSerializationApi::class)
    suspend fun charge(context: Context, saleToPoiRequest: String): Result<Unit> = runCatching {
        val launcher = TapToPayCheckout.launcher
            ?: error("Payment launcher not registered — MainActivity must call TapToPayCheckout.register().")

        val paymentInterface = InPersonPayments
            .getPaymentInterface(PaymentInterfaceType.createTapToPayType())
            .getOrThrow()

        InPersonPayments.performTransaction(
            context = context,
            paymentLauncher = launcher,
            paymentInterface = paymentInterface,
            transactionRequest = TransactionRequest.create(saleToPoiRequest).getOrThrow(),
            merchantUiParameters = MerchantUiParameters.create(),
        ).getOrThrow()
    }
}
