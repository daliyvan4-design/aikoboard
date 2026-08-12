// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const prismaMock = {
  webhookEvent: { create: vi.fn() },
  payment: { updateMany: vi.fn() },
  participant: { updateMany: vi.fn() },
};

const verifyWebhookSignature = vi.fn().mockReturnValue(true);
const applyPaymentSuccess = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/geniuspay", () => ({ verifyWebhookSignature }));
vi.mock("@/lib/payment-flow", () => ({ applyPaymentSuccess }));

function makeRequest(
  payload: Record<string, unknown>,
  opts: { timestamp?: string; event?: string } = {},
): NextRequest {
  const timestamp = opts.timestamp ?? String(Math.floor(Date.now() / 1000));
  return new Request("http://localhost/api/webhooks/geniuspay", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-webhook-signature": "sig",
      "x-webhook-timestamp": timestamp,
      "x-webhook-event": opts.event ?? "payment.success",
    },
    body: JSON.stringify(payload),
  }) as unknown as NextRequest;
}

const successPayload = {
  id: "evt_abc",
  event: "payment.success",
  timestamp: Math.floor(Date.now() / 1000),
  data: {
    reference: 42,
    payment_method: "wave",
    status: "completed",
    metadata: { pay_ref: "PAY-1", participant_ref: "AIKO-1", event_slug: "x", type: "badge" },
  },
};

describe("POST /api/webhooks/geniuspay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyWebhookSignature.mockReturnValue(true);
    prismaMock.webhookEvent.create.mockResolvedValue({});
  });

  it("rejette une signature invalide", async () => {
    verifyWebhookSignature.mockReturnValue(false);
    const { POST } = await import("@/app/api/webhooks/geniuspay/route");

    const res = await POST(makeRequest(successPayload));

    expect(res.status).toBe(401);
    expect(applyPaymentSuccess).not.toHaveBeenCalled();
  });

  it("rejette un webhook trop ancien (rejeu)", async () => {
    const old = String(Math.floor(Date.now() / 1000) - 3600);
    const { POST } = await import("@/app/api/webhooks/geniuspay/route");

    const res = await POST(
      makeRequest({ ...successPayload, timestamp: Number(old) }, { timestamp: old }),
    );

    expect(res.status).toBe(400);
    expect(applyPaymentSuccess).not.toHaveBeenCalled();
  });

  it("ne traite qu'une fois le meme evenement", async () => {
    prismaMock.webhookEvent.create.mockRejectedValue({ code: "P2002" });
    const { POST } = await import("@/app/api/webhooks/geniuspay/route");

    const res = await POST(makeRequest(successPayload));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.duplicate).toBe(true);
    expect(applyPaymentSuccess).not.toHaveBeenCalled();
  });

  it("applique les effets d'un paiement reussi", async () => {
    const { POST } = await import("@/app/api/webhooks/geniuspay/route");

    const res = await POST(makeRequest(successPayload));

    expect(res.status).toBe(200);
    expect(applyPaymentSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ payRef: "PAY-1", participantRef: "AIKO-1" }),
    );
  });

  it("refuse un payload sans identifiant d'evenement", async () => {
    const { id: _id, ...withoutId } = successPayload;
    const { POST } = await import("@/app/api/webhooks/geniuspay/route");

    const res = await POST(makeRequest(withoutId));

    expect(res.status).toBe(400);
    expect(prismaMock.webhookEvent.create).not.toHaveBeenCalled();
  });
});
