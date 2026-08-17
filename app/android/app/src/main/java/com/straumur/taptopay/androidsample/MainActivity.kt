package com.straumur.taptopay.androidsample

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.ActivityResultLauncher
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.lifecycleScope
import com.adyen.ipp.api.InPersonPayments
import com.adyen.ipp.api.authentication.AuthenticationProvider
import com.adyen.ipp.api.authentication.AuthenticationResponse
import com.adyen.ipp.api.authentication.MerchantAuthenticationService
import com.adyen.ipp.api.initialization.InitializationState
import com.adyen.ipp.api.payment.PaymentInterfaceType
import com.adyen.ipp.api.payment.TransactionRequest
import com.adyen.ipp.api.ui.MerchantUiParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL

// YOUR backend (the ../../server project) — never the Straumur API directly, so this app holds
// no API key. The server adds the key + store MID and brokers each call to Straumur.
//
// An emulator reaches the host machine at 10.0.2.2. For a physical device over USB, keep
// 127.0.0.1 and run: adb reverse tcp:5080 tcp:5080
private const val SERVER_URL = "http://127.0.0.1:5080"
private const val CURRENCY = "ISK"

/**
 * POSTs JSON to your backend and returns the parsed response. Plain HttpURLConnection so the
 * sample has no HTTP-client dependency; use Retrofit/OkHttp in a real app.
 */
private fun post(path: String, body: JSONObject): JSONObject {
    val connection = (URL("$SERVER_URL$path").openConnection() as HttpURLConnection).apply {
        requestMethod = "POST"
        doOutput = true
        connectTimeout = 15_000
        readTimeout = 15_000
        setRequestProperty("Content-Type", "application/json")
    }

    try {
        connection.outputStream.use { it.write(body.toString().toByteArray()) }

        if (connection.responseCode !in 200..299) {
            // Straumur's errors are forwarded through the backend with their original message.
            val failure = connection.errorStream?.bufferedReader()?.use(BufferedReader::readText).orEmpty()
            error("HTTP ${connection.responseCode}: $failure")
        }

        return JSONObject(connection.inputStream.bufferedReader().use(BufferedReader::readText))
    } finally {
        connection.disconnect()
    }
}

/**
 * The Adyen SDK discovers this service (declared in the manifest) and boards through it: it
 * hands us a setupToken, we exchange it for sdkData via the backend's /api/sessions.
 */
class StraumurAuthenticationService : MerchantAuthenticationService() {
    override val authenticationProvider = object : AuthenticationProvider {
        override suspend fun authenticate(setupToken: String): Result<AuthenticationResponse> = runCatching {
            val sdkData = withContext(Dispatchers.IO) {
                post(
                    "/api/sessions",
                    JSONObject()
                        .put("setupToken", setupToken)
                        .put("deviceModel", Build.MODEL)
                        .put("osVersion", Build.VERSION.RELEASE),
                ).getString("sdkData")
            }

            AuthenticationResponse.create(sdkData)
        }
    }
}

class MainActivity : ComponentActivity() {
    private lateinit var paymentLauncher: ActivityResultLauncher<Intent>

    private var poiId by mutableStateOf<String?>(null)
    private var amount by mutableStateOf("1000")
    private var busy by mutableStateOf(false)
    private var status by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // The result launcher must be registered before the activity is started.
        paymentLauncher = InPersonPayments.registerForPaymentResult(this) { result ->
            busy = false
            status = result.fold(
                onSuccess = { if (it.success) "Approved" else "Declined" },
                onFailure = { "Payment error: ${it.message}" },
            )
        }

        setContent { Ui() }

        // Board on launch. The SDK makes a setupToken and boards through your backend (via
        // StraumurAuthenticationService), then resolves this device's POIID. The SDK caches the
        // session, so only the first launch actually calls /api/sessions.
        lifecycleScope.launch {
            runCatching {
                // The SDK initializes asynchronously (App Startup), so wait for it to settle —
                // calling warmUp() before that fails with "IPP SDK is not initialized".
                val state = InPersonPayments.initialized.first { it !is InitializationState.AwaitingInitialization }

                if (state is InitializationState.FailedInitialization) {
                    error("SDK initialization failed: ${state.failureReasons.joinToString()}")
                }

                InPersonPayments.warmUp().getOrThrow()
                InPersonPayments.getInstallationId().getOrThrow()
            }
                .onSuccess { poiId = it }
                .onFailure { status = "Setup failed: ${it.message}" }
        }
    }

    private fun charge() {
        busy = true
        status = null

        lifecycleScope.launch {
            runCatching {
                // Your backend has Straumur pre-create the payment and returns a nexo request.
                val saleToPoiRequest = withContext(Dispatchers.IO) {
                    post(
                        "/api/payments",
                        JSONObject()
                            .put("poiId", poiId)
                            .put("amount", amount.toBigDecimal())
                            .put("currency", CURRENCY),
                    ).getString("saleToPoiRequest")
                }

                // Hand it to the SDK verbatim — this is where the shopper taps their card. The
                // outcome arrives on the launcher registered above.
                InPersonPayments.performTransaction(
                    context = this@MainActivity,
                    paymentLauncher = paymentLauncher,
                    paymentInterface = InPersonPayments
                        .getPaymentInterface(PaymentInterfaceType.createTapToPayType())
                        .getOrThrow(),
                    transactionRequest = TransactionRequest.create(saleToPoiRequest).getOrThrow(),
                    merchantUiParameters = MerchantUiParameters.create(),
                ).getOrThrow()
            }.onFailure {
                busy = false
                status = it.message
            }
        }
    }

    @Composable
    private fun Ui() {
        MaterialTheme {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(start = 24.dp, end = 24.dp, top = 56.dp, bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text("Take a payment", style = MaterialTheme.typography.headlineSmall)

                val device = poiId
                if (device == null) {
                    Text(status ?: "Setting up device…", style = MaterialTheme.typography.bodyMedium)
                } else {
                    Text("Device $device · $CURRENCY", style = MaterialTheme.typography.bodySmall)

                    OutlinedTextField(
                        value = amount,
                        onValueChange = { amount = it },
                        label = { Text("Amount ($CURRENCY)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )

                    Button(
                        onClick = ::charge,
                        enabled = !busy,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (busy) "Waiting for card…" else "Charge")
                    }

                    status?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
                }
            }
        }
    }
}
