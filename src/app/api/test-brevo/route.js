import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/brevo";

export async function GET() {
  const testOrder = {
    order_id: 999,
    email: "bhm.x@live.com",
    total_amount: 99.99,
    order_token: "test-token",
  };
  const result = await sendOrderConfirmationEmail(testOrder);
  return NextResponse.json(result);
}
