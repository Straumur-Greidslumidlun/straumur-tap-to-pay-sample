const { withProjectBuildGradle, withMainActivity } = require("@expo/config-plugins");

// Config plugin for the Straumur Tap to Pay native module. Applied during `expo prebuild`.
//
// 1) Adds Adyen's credentialed maven repo to the root android/build.gradle (allprojects.repositories) so the SDK
//    can be downloaded. The download key is read from the `adyenSdkApiKey` Gradle property (set it in
//    ~/.gradle/gradle.properties or as an EAS secret) — never commit it.
// 2) Registers the Adyen payment-result launcher in MainActivity.onCreate (it must be registered before the
//    activity is started).

const ADYEN_REPO_MARKER = "pos-mobile-test.cdn.adyen.com";

function withAdyenMavenRepo(config) {
    return withProjectBuildGradle(config, (cfg) => {
        let contents = cfg.modResults.contents;
        if (contents.includes(ADYEN_REPO_MARKER)) {
            return cfg;
        }

        const repoBlock = `
        maven {
            url = uri("https://pos-mobile-test.cdn.adyen.com/adyen-pos-android")
            credentials(org.gradle.api.credentials.HttpHeaderCredentials) {
                name = "x-api-key"
                value = providers.gradleProperty("adyenSdkApiKey").getOrElse("")
            }
            authentication { create("header", org.gradle.authentication.http.HttpHeaderAuthentication) }
        }`;

        const re = /(allprojects\s*\{[\s\S]*?repositories\s*\{)/;
        if (!re.test(contents)) {
            throw new Error("withStraumurTapToPay: couldn't find allprojects.repositories in android/build.gradle");
        }
        cfg.modResults.contents = contents.replace(re, `$1\n${repoBlock}`);
        return cfg;
    });
}

function withLauncherRegistration(config) {
    return withMainActivity(config, (cfg) => {
        let contents = cfg.modResults.contents;
        if (contents.includes("TapToPayCheckout.register")) {
            return cfg;
        }
        if (cfg.modResults.language !== "kt") {
            return cfg; // expecting Kotlin MainActivity (Expo SDK 52 default)
        }

        if (!contents.includes("import com.straumur.taptopay.module.TapToPayCheckout")) {
            contents = contents.replace(/(^package .*\n)/m, `$1\nimport com.straumur.taptopay.module.TapToPayCheckout\n`);
        }
        contents = contents.replace(/(super\.onCreate\([^)]*\)\s*\n)/, `$1    TapToPayCheckout.register(this)\n`);

        cfg.modResults.contents = contents;
        return cfg;
    });
}

module.exports = function withStraumurTapToPay(config) {
    config = withAdyenMavenRepo(config);
    config = withLauncherRegistration(config);
    return config;
};
