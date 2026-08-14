import * as Device from "expo-device";

// Best-effort device model, sent with the session so the terminal record is identifiable.
export const deviceModel = (): string => Device.modelName ?? "Unknown device";
