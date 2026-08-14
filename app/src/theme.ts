// Straumur brand tokens (palette pulled from straumur.is).
export const theme = {
    colors: {
        primary: "#002649", // deep blue
        accent: "#ff8b59", // orange
        success: "#7bbd00", // positive green
        error: "#d03e00", // danger red
        surface: "#fbfaf9", // off-white background
        card: "#ffffff",
        text: "#262b31", // near-black
        muted: "#4d5f6f", // blue-500
        border: "#e2e6e9", // grey
        onPrimary: "#ffffff",
        onAccent: "#262b31",
    },
    radius: 14,
    spacing: (n: number): number => n * 8,
} as const;

export type Theme = typeof theme;
