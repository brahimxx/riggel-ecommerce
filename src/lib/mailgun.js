// lib/mailgun.js
import Mailgun from "mailgun.js";
import formData from "form-data";

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL;

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: MAILGUN_API_KEY,
  url: "https://api.eu.mailgun.net", // EU region base URL
});

export async function sendOrderConfirmationEmail({
  to,
  order,
  items,
  publicUrl,
}) {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !MAILGUN_FROM_EMAIL) {
    console.warn("Mailgun env vars missing, skipping email send");
    return;
  }

  const orderNumber = order.order_id;
  const total = Number(order.total_amount).toFixed(2);

  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding:4px 8px;">${item.product_name || "Item"}</td>
          <td style="padding:4px 8px; text-align:center;">${item.quantity}</td>
          <td style="padding:4px 8px; text-align:right;">$${Number(
            item.price
          ).toFixed(2)}</td>
        </tr>
      `
    )
    .join("");

  const html = `
    <div style="font-family:system-ui, -apple-system, sans-serif; font-size:14px; color:#111;">
      <h2 style="color:#111;">Thank you for your order!</h2>
      <p>Your order <strong>#${orderNumber}</strong> has been received.</p>
      <p>You can view your order anytime here:<br/>
        <a href="${publicUrl}" target="_blank" style="color:#2563eb;">${publicUrl}</a>
      </p>
      <h3 style="margin-top:20px;">Order summary</h3>
      <table style="border-collapse:collapse; width:100%; max-width:480px;">
        <thead>
          <tr>
            <th align="left" style="border-bottom:1px solid #e5e7eb; padding:4px 8px;">Product</th>
            <th align="center" style="border-bottom:1px solid #e5e7eb; padding:4px 8px;">Qty</th>
            <th align="right" style="border-bottom:1px solid #e5e7eb; padding:4px 8px;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="margin-top:16px; font-size:15px;">
        <strong>Total: $${total}</strong>
      </p>
      <p style="margin-top:24px; color:#4b5563;">
        If you have any questions, just reply to this email.
      </p>
    </div>
  `;

  await mg.messages.create(MAILGUN_DOMAIN, {
    from: MAILGUN_FROM_EMAIL,
    to,
    subject: `Order #${orderNumber} confirmation`,
    html,
  });
}
