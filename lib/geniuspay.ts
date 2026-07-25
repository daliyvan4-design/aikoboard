const BASE_URL = "https://pay.genius.ci/api/v1/merchant";

const headers = () => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  "User-Agent": "AIKOBoard/1.0",
  "X-API-Key": process.env.GENIUSPAY_PUBLIC_KEY ?? "",
  "X-API-Secret": process.env.GENIUSPAY_SECRET_KEY ?? "",
});

export type PaymentMethod =
  | "wave"
  | "orange_money"
  | "mtn_money"
  | "moov_money"
  | "airtel_money"
  | "pawapay"
  | "paystack"
  | "card";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded"
  | "expired";

export type Currency = "XOF" | "EUR" | "USD";

export interface CreatePaymentInput {
  amount: number;
  currency?: Currency;
  payment_method?: PaymentMethod;
  description?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
  };
  success_url?: string;
  error_url?: string;
  metadata?: Record<string, string>;
}

export interface GeniusPayment {
  id: number;
  reference: string;
  amount: number;
  fees: number;
  net_amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  payment_url?: string;
  checkout_url?: string;
  gateway: string;
  environment: "sandbox" | "live";
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  metadata: Record<string, string>;
  created_at: string;
  completed_at?: string;
}

export interface GeniusResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface WebhookPayload {
  id: string;
  event: string;
  timestamp: number;
  created_at: string;
  data: {
    object: string;
    id: number;
    reference: string;
    amount: number;
    currency: string;
    fees: number;
    net_amount: number;
    status: PaymentStatus;
    payment_method: string;
    provider: string;
    customer_name: string;
    customer_phone: string;
    merchant_id: number;
    metadata: Record<string, string>;
  };
  environment: "sandbox" | "live";
  api_version: string;
}

export class GeniusPayError extends Error {
  constructor(
    public code: string,
    message: string,
    public httpStatus: number,
  ) {
    super(message);
    this.name = "GeniusPayError";
  }
}

function isConfigured(): boolean {
  return !!(process.env.GENIUSPAY_PUBLIC_KEY && process.env.GENIUSPAY_SECRET_KEY);
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  if (!isConfigured()) {
    throw new GeniusPayError(
      "NOT_CONFIGURED",
      "GeniusPay API keys are not configured",
      500,
    );
  }

  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
    redirect: "follow",
  });

  const text = await res.text();

  let json: GeniusResponse<T>;
  try {
    json = JSON.parse(text) as GeniusResponse<T>;
  } catch {
    console.error(`[geniuspay] Non-JSON response from ${url} (${res.status}):`, text.substring(0, 500));
    throw new GeniusPayError(
      "INVALID_RESPONSE",
      `GeniusPay returned non-JSON (HTTP ${res.status})`,
      res.status,
    );
  }

  if (!json.success || json.error) {
    throw new GeniusPayError(
      json.error?.code ?? "UNKNOWN",
      json.error?.message ?? "Unknown GeniusPay error",
      res.status,
    );
  }

  return json.data;
}

export async function createPayment(input: CreatePaymentInput) {
  return request<GeniusPayment>("POST", "/payments", input);
}

export async function getPayment(reference: string) {
  return request<GeniusPayment>("GET", `/payments/${reference}`);
}

export async function listPayments(page = 1, perPage = 20) {
  return request<GeniusPayment[]>(
    "GET",
    `/payments?page=${page}&per_page=${perPage}`,
  );
}

export async function refundPayment(reference: string, amount?: number) {
  return request<GeniusPayment>("POST", `/payments/${reference}/refund`, amount ? { amount } : undefined);
}

export async function getBalance() {
  return request<{
    available: number;
    pending: number;
    total: number;
    currency: string;
  }>("GET", "/account/balance");
}

export function verifyWebhookSignature(
  timestamp: string,
  payload: string,
  signature: string,
): boolean {
  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const crypto = require("crypto") as typeof import("crypto");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}

export { isConfigured as isGeniusPayConfigured };
