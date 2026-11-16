import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider = "GCASH", amount, referenceNumber, customerName } = body;

    const validProviders = ["GCASH", "MAYA", "GRABPAY"];
    const normalizedProvider = String(provider).toUpperCase();

    if (!validProviders.includes(normalizedProvider)) {
      return NextResponse.json(
        { error: `Unsupported payment provider '${provider}'. Supported: GCash, Maya, GrabPay.` },
        { status: 400 }
      );
    }

    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      return NextResponse.json(
        { error: "Payment amount must be a positive number." },
        { status: 400 }
      );
    }

    const numericAmount = amount ? Number(amount) : 0;
    const ref = referenceNumber || `REF-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const transactionId = `MOCK-${normalizedProvider}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    return NextResponse.json({
      success: true,
      status: "SETTLED",
      provider: normalizedProvider,
      transactionId,
      referenceNumber: ref,
      amount: numericAmount,
      currency: "PHP",
      customerName: customerName || "OhmSim Engineering Buyer",
      verifiedAt: new Date().toISOString(),
      webhookEventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      receiptUrl: `/receipts/mock-${transactionId.toLowerCase()}.pdf`,
      message: `Instant ${normalizedProvider} payment intent verified successfully via mock payment webhook.`,
    });
  } catch (error) {
    console.error("Error in POST /api/payment/simulate:", error);
    return NextResponse.json(
      { error: "Internal error processing mock payment simulation." },
      { status: 500 }
    );
  }
}
