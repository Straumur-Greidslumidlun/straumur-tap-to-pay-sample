const { withAppBuildGradle } = require("expo/config-plugins");
const os = require("node:os");

/**
 * Expo config plugin to use a shorter CMake build path on Windows, working around the 260-char path limit in the
 * RN New Architecture C++ build. Windows-only; no-op elsewhere. (Credit: marko-hologram, react-native-safe-area-context#424)
 */
function withShortCmakePath(config) {
    if (os.platform() !== "win32") {
        return config;
    }

    return withAppBuildGradle(config, (cfg) => {
        if (cfg.modResults.language === "groovy") {
            cfg.modResults.contents = addShortCmakePath(cfg.modResults.contents);
        }
        return cfg;
    });
}

function addShortCmakePath(appBuildGradle) {
    if (appBuildGradle.includes("buildStagingDirectory")) {
        return appBuildGradle;
    }

    const cmakeConfig = `
    // Shorter CMake build path to dodge the Windows 260-char path limit (RN New Arch C++).
    externalNativeBuild {
        cmake {
            buildStagingDirectory = file("C:/tmp/rn-cmake")
        }
    }`;

    const pattern = /(android\s*\{[^}]*compileSdk[^\n]*\n)/;
    if (pattern.test(appBuildGradle)) {
        return appBuildGradle.replace(pattern, `$1${cmakeConfig}\n`);
    }
    return appBuildGradle;
}

module.exports = withShortCmakePath;
