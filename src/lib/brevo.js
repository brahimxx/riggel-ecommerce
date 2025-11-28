// lib/brevo.js - ADD THESE DEBUG LOGS HERE
export async function sendOrderConfirmationEmail(order) {
  console.log("🔥 Brevo: Attempting to send to", order.email);

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "Riggel Store",
        email: process.env.BREVO_FROM_EMAIL,
      },
      to: [{ email: order.email }],
      subject: `Order #${order.order_id} - Confirmation`,
      htmlContent: `
        <h1>✅ Thank you for your order!</h1>
        <p><strong>Order ID:</strong> ${order.order_id}</p>
        <p><strong>Total:</strong> $${order.total_amount}</p>
        <p><a href="https://riggel.brahimmoulahoum.dev/thankyou?token=${order.order_token}">View Order Details</a></p>
      `,
    }),
  });

  // DEBUG LOGS - ADD THESE
  console.log("🔥 Brevo response status:", response.status);
  console.log(
    "🔥 Brevo API key loaded:",
    process.env.BREVO_API_KEY ? "YES" : "NO"
  );

  try {
    if (response.ok) {
      const result = await response.json();
      console.log("✅ Brevo: Email sent!", result.messageId);
      return { success: true };
    } else {
      const errorData = await response.json().catch(() => response.text());
      console.error("❌ Brevo API error:", response.status, errorData);
      return { success: false, error: errorData };
    }
  } catch (error) {
    console.error("❌ Brevo fetch error:", error);
    return { success: false, error: error.message };
  }
}
