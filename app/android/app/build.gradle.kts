plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.straumur.taptopay.androidsample"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.straumur.taptopay.androidsample"
        // Adyen Tap to Pay on Android requires Android 12 (API 31)+.
        minSdk = 31
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.6")
    implementation("androidx.activity:activity-compose:1.9.2")

    implementation(platform("androidx.compose:compose-bom:2024.09.03"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")

    // Adyen POS Mobile SDK (test/debug variants — use the release ones for production).
    val adyenVersion = "2.17.0"
    implementation("com.adyen.ipp:pos-mobile-debug:$adyenVersion")
    implementation("com.adyen.ipp:payment-tap-to-pay-debug:$adyenVersion")
}
