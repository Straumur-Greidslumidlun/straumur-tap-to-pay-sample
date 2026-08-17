const fs = require("node:fs");
const path = require("node:path");
const { withProjectBuildGradle, withMainActivity, withGradleProperties } = require("@expo/config-plugins");

// Config plugin for the Straumur Tap to Pay native module. Applied during `expo prebuild`.
//
// 1) Feeds the Adyen SDK-download key into the build as the `adyenSdkApiKey` Gradle property,
//    read from a gitignored `adyen-sdk.properties` at the app root (or the ADYEN_SDK_API_KEY env
//    var) — so the key is never committed. If neither is present it falls back to Gradle's own
//    resolution (e.g. ~/.gradle/gradle.properties).
// 2) Adds Adyen's credentialed maven repo to the root android/build.gradle (allprojects.repositories)
//    so the SDK can be downloaded, authenticating with that property.
// 3) Registers the Adyen payment-result launcher in MainActivity.onCreate (it must be registered
//    before the activity is started).

const ADYEN_REPO_MARKER = "pos-mobile-test.cdn.adyen.com";
const ADYEN_KEY_PROPERTY = "adyenSdkApiKey";
const LOCAL_SECRETS_FILE = "adyen-sdk.properties";

// Reads the Adyen SDK-download key from the gitignored local file, falling back to the env var.
function resolveAdyenSdkKey(projectRoot) {
    const file = path.join(projectRoot, LOCAL_SECRETS_FILE);
    if (fs.existsSync(file)) {
        const match = fs.readFileSync(file, "utf8").match(/^\s*adyenSdkApiKey\s*=\s*(.+?)\s*$/m);
        if (match && match[1].trim()) {
            return match[1].trim();
        }
    }
    return process.env.ADYEN_SDK_API_KEY || null;
}

function withAdyenSdkKey(config) {
    return withGradleProperties(config, (cfg) => {
        const key = resolveAdyenSdkKey(cfg.modRequest.projectRoot);
        if (!key) {
            return cfg; // leave it to Gradle's own property resolution (~/.gradle/gradle.properties, -P, …)
        }

        // Inject into the generated android/gradle.properties (itself gitignored), replacing any prior value.
        cfg.modResults = cfg.modResults.filter(
            (item) => !(item.type === "property" && item.key === ADYEN_KEY_PROPERTY),
        );
        cfg.modResults.push({ type: "property", key: ADYEN_KEY_PROPERTY, value: key });
        return cfg;
    });
}

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
    config = withAdyenSdkKey(config);
    config = withAdyenMavenRepo(config);
    config = withLauncherRegistration(config);
    return config;
};
