package com.straumur.taptopay.module

import android.os.Build
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL

/**
 * Minimal HTTP client for the integrator backend, used during boarding. The backend adds the
 * Straumur API key + store MID and forwards to Straumur — the app holds no credentials, so
 * there is no bearer token or refresh here. Uses HttpURLConnection to avoid extra dependencies;
 * the base URL comes from [SessionStore].
 */
object BackendApi {

    class HttpException(val status: Int, message: String) : Exception(message)

    /** Exchanges the SDK's setupToken for sdkData via the backend POST /api/sessions. */
    fun createSession(setupToken: String): String {
        // Device info is read here, at the source, so JS never has to supply it.
        val body = JSONObject()
            .put("setupToken", setupToken)
            .put("deviceModel", Build.MODEL)
            .put("osVersion", Build.VERSION.RELEASE)
            .put("appVersion", SessionStore.appVersion)
            .toString()

        val json = postJson("/api/sessions", body)

        val sdkData = json.optString("sdkData", "")
        if (sdkData.isBlank()) {
            throw HttpException(0, "No sdkData in /api/sessions response.")
        }
        return sdkData
    }

    private fun postJson(path: String, body: String): JSONObject {
        val connection = (URL("${SessionStore.baseUrl}$path").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            doOutput = true
            connectTimeout = 15000
            readTimeout = 15000
            setRequestProperty("Content-Type", "application/json")
        }

        try {
            connection.outputStream.use { it.write(body.toByteArray()) }
            val status = connection.responseCode

            if (status !in 200..299) {
                val error = connection.errorStream?.bufferedReader()?.use(BufferedReader::readText).orEmpty()
                throw HttpException(status, "HTTP $status: $error")
            }

            val text = connection.inputStream.bufferedReader().use(BufferedReader::readText)
            return JSONObject(text)
        } finally {
            connection.disconnect()
        }
    }
}
