package com.straumur.taptopay.module

import android.content.Intent
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import com.adyen.ipp.api.InPersonPayments
import java.util.Base64

/**
 * Holds the Adyen payment-result launcher (registered from MainActivity.onCreate via the config plugin — it must be
 * registered before the activity is started) and forwards each result to the Expo module's listener.
 */
object TapToPayCheckout {
    var launcher: ActivityResultLauncher<Intent>? = null
        private set

    /** Set by the Expo module; invoked with the transaction result map for the onPaymentResult event. */
    var listener: ((Map<String, Any?>) -> Unit)? = null

    fun register(activity: ComponentActivity) {
        launcher = InPersonPayments.registerForPaymentResult(activity) { paymentResult ->
            val map = paymentResult.fold(
                onSuccess = { r ->
                    val decoded = runCatching { String(Base64.getDecoder().decode(r.data)) }.getOrNull()
                    mapOf(
                        "success" to r.success,
                        "message" to if (r.success) "Payment approved" else "Payment declined",
                        "rawTerminalApiResponse" to decoded,
                    )
                },
                onFailure = { e ->
                    mapOf(
                        "success" to false,
                        "message" to "Payment error: ${e.message ?: e}",
                        "rawTerminalApiResponse" to null,
                    )
                },
            )
            listener?.invoke(map)
        }
    }
}
