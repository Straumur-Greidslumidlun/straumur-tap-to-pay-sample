// The app talks to the Adyen bridge through the local native module (modules/straumur-tap-to-pay).
// Re-exported here as `TapToPay` so screens have a stable import path.
export { StraumurTapToPay as TapToPay } from "../../modules/straumur-tap-to-pay";
export type { ChargeResult } from "../../modules/straumur-tap-to-pay";
