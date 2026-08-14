import { getServerBaseUrl } from "../config";

// Responses from YOUR backend (which brokers to Straumur). The app never sees the API key.
export type SessionResponse = {
    installationId: string; // the device POIID — kept and sent back on payment
    sdkData: string; // boarding data for the Adyen SDK
    merchantAccount: string;
    store: string;
};

export type PaymentResponse = {
    reference: string;
    amount: number;
    currency: string;
    saleToPoiRequest: string; // hand to the Adyen SDK verbatim
};

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${getServerBaseUrl()}${path}`, init);
    } catch {
        throw new ApiError(0, "Can't reach your backend. Check the connection / server URL.");
    }

    if (!res.ok) {
        throw new ApiError(res.status, await errorMessage(res));
    }

    return (await res.json()) as T;
}

// Straumur errors are forwarded through the backend with their original localized message.
async function errorMessage(res: Response): Promise<string> {
    try {
        const body = (await res.json()) as { detail?: string; title?: string; message?: string };
        return body.detail ?? body.title ?? body.message ?? `Request failed (${res.status}).`;
    } catch {
        return `Request failed (${res.status}).`;
    }
}

const jsonPost = (body: unknown): RequestInit => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const api = {
    // Boards the device: your backend calls Straumur /integrator/sessions with the MID + key.
    createSession: (setupToken: string, deviceModel?: string) =>
        request<SessionResponse>("/api/sessions", jsonPost({ setupToken, deviceModel })),

    // Pre-creates a charge on the device (by POIID): your backend calls /integrator/payment.
    createPayment: (poiId: string, amount: number, currency: string) =>
        request<PaymentResponse>("/api/payments", jsonPost({ poiId, amount, currency })),
};
