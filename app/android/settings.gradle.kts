import org.gradle.api.credentials.HttpHeaderCredentials
import org.gradle.authentication.http.HttpHeaderAuthentication

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()

        // Adyen POS Mobile SDK lives in a credentialed repo. Put your SDK-download key in
        // ~/.gradle/gradle.properties as `adyenSdkApiKey` — never commit it.
        maven {
            url = uri("https://pos-mobile-test.cdn.adyen.com/adyen-pos-android")
            credentials(HttpHeaderCredentials::class) {
                name = "x-api-key"
                value = providers.gradleProperty("adyenSdkApiKey").getOrElse("")
            }
            authentication { create<HttpHeaderAuthentication>("header") }
        }
    }
}

rootProject.name = "StraumurTapToPaySample"
include(":app")
