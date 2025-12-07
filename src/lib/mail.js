import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOrderConfirmationEmail = async (order) => {
  try {
    const fromAddress = "Riggel <orders@riggel.brahimmoulahoum.dev>";
    // 1. Calculate Costs Logic (Mirroring your Frontend)
    // Note: If you saved these in DB, use those. If not, we recalculate here.
    const orderItems = order.order_items || []; // Ensure your DB query returns this!

    // Helper to format currency
    const formatPrice = (amount) => Number(amount).toFixed(2);

    const subtotal = orderItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.011; // 1.1%
    const shipping = subtotal >= 200 ? 0 : 15;
    const total = subtotal + tax + shipping;

    // 2. Generate HTML for Items (The "Card" Look)
    // 2. Generate HTML for Items (The "Card" Look)
    const itemsHtml = orderItems
      .map((item) => {
        // Logic: Ensure image is absolute URL
        const imageUrl = item.product_image?.startsWith("http")
          ? item.product_image
          : `${process.env.NEXT_PUBLIC_APP_URL}${
              item.product_image || "/placeholder.png"
            }`;

        return `
      <tr>
        <td style="padding-bottom: 16px; border-bottom: 1px solid #f3f4f6;">
          <div style="display: flex; align-items: flex-start; margin-top: 1em;">
            <div style="margin-right: 16px;">
               <img src="${imageUrl}" 
                    alt="${item.product_name}" 
                    width="80" height="80" 
                    style="border-radius: 8px; background-color: #f3f4f6; object-fit: contain;"
               />
            </div>
            
            <div style="flex: 1;">
              <p style="margin: 0; font-size: 15px; font-weight: bold; color: #000;">
                ${item.product_name}
              </p>
              ${
                item.attributes
                  ? `
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">
                ${item.attributes}
              </p>`
                  : ""
              }
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">
                Qty: ${item.quantity}
              </p>
            </div>

            <div style="text-align: right;">
              <p style="margin: 0; font-size: 15px; font-weight: bold; color: #000;">
                $${formatPrice(item.price * item.quantity)}
              </p>
            </div>
          </div>
        </td>
      </tr>
    `;
      })
      .join("");

    // 3. Full Email Template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center;">
          
          <!-- Confirm Mark Icon -->
          <div style="margin-bottom: 24px;">
            <span style="display: inline-block; padding: 12px; background-color: #e7f3ce; border-radius: 50%;">
              <span style="font-size: 24px; color: #669900;">✔</span>
            </span>
          </div>

          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px; color: #000;">
            Your order is confirmed
          </h1>

          <hr style="border: none; border-top: 1px solid #e5e7eb; width: 60%; margin: 24px auto;" />

          <p style="font-size: 16px; margin-bottom: 32px; color: #000;">
            Order number <strong>#${order.order_id}</strong>
          </p>

          <!-- Order Summary Container -->
          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; text-align: left;">
            <h2 style="font-size: 18px; font-weight: bold; margin-top: 0; margin-bottom: 20px; color: #000;">
              Order Summary
            </h2>

            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              ${itemsHtml}
            </table>

            <div style="margin-top: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 8px; color: #4b5563;">Subtotal</td>
                  <td style="padding-bottom: 8px; text-align: right; color: #4b5563;">$${formatPrice(
                    subtotal
                  )}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px; color: #4b5563;">Tax (1.1%)</td>
                  <td style="padding-bottom: 8px; text-align: right; color: #4b5563;">$${formatPrice(
                    tax
                  )}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px; color: #4b5563;">Shipping</td>
                  <td style="padding-bottom: 8px; text-align: right; color: #4b5563;">
                    ${shipping === 0 ? "Free" : "$" + formatPrice(shipping)}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 16px; border-top: 1px solid #e5e7eb; font-weight: bold; color: #000; font-size: 18px;">TOTAL</td>
                  <td style="padding-top: 16px; border-top: 1px solid #e5e7eb; font-weight: bold; text-align: right; color: #000; font-size: 18px;">
                    $${formatPrice(total)}
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <div style="margin-top: 40px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/track/${
      order.order_token
    }" 
               style="background-color: #000000; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
               Track Order Status
            </a>
          </div>

        </div>
      </body>
      </html>
    `;

    const data = await resend.emails.send({
      from: fromAddress,
      to: [order.email],
      subject: `Order Confirmation #${order.order_id}`,
      html: htmlContent,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Resend Error:", error);
    return { success: false, error };
  }
};
