package com.straumur.taptopay.module

import androidx.activity.ComponentActivity
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class StraumurTapToPayModule : Module() {
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    override fun definition() = ModuleDefinition {
        Name("StraumurTapToPay")

        Events("onPaymentResult")

        OnCreate {
            // Forward Adyen transaction results (delivered to the launcher registered in MainActivity) to JS.
            TapToPayCheckout.listener = { result -> sendEvent("onPaymentResult", result) }
        }

        OnDestroy {
            TapToPayCheckout.listener = null
            scope.cancel()
        }

        Function("version") { AdyenTapToPay.version() }

        // Point the native boarding path at your backend. No tokens — the backend holds the
        // Straumur API key + store MID and brokers /api/sessions to Straumur.
        Function("setBackend") { baseUrl: String, deviceModel: String ->
            SessionStore.baseUrl = baseUrl
            SessionStore.deviceModel = deviceModel
        }

        AsyncFunction("board") { promise: Promise ->
            scope.launch {
                AdyenTapToPay.boardAndGetInstallationId().fold(
                    onSuccess = { promise.resolve(it) },
                    onFailure = { promise.reject("BOARD_FAILED", it.message, it) },
                )
            }
        }

        AsyncFunction("clearSession") { promise: Promise ->
            scope.launch {
                AdyenTapToPay.clearSession().fold(
                    onSuccess = { promise.resolve(null) },
                    onFailure = { promise.reject("CLEAR_SESSION_FAILED", it.message, it) },
                )
            }
        }

        AsyncFunction("charge") { saleToPoiRequest: String, promise: Promise ->
            val activity = appContext.currentActivity as? ComponentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No current activity to start the transaction.", null)
                return@AsyncFunction
            }
            scope.launch {
                AdyenTapToPay.charge(activity, saleToPoiRequest).fold(
                    onSuccess = { promise.resolve(null) },
                    onFailure = { promise.reject("CHARGE_FAILED", it.message, it) },
                )
            }
        }
    }
}
