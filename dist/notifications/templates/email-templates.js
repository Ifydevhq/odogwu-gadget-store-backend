"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationOtpTemplate = verificationOtpTemplate;
exports.welcomeTemplate = welcomeTemplate;
exports.passwordResetTemplate = passwordResetTemplate;
exports.orderConfirmationTemplate = orderConfirmationTemplate;
exports.newOrderAlertTemplate = newOrderAlertTemplate;
exports.orderStatusUpdateTemplate = orderStatusUpdateTemplate;
exports.listingApprovedTemplate = listingApprovedTemplate;
exports.listingRejectedTemplate = listingRejectedTemplate;
function baseLayout(brand, content) {
    const { appName, logoUrl, frontendUrl } = brand;
    const year = new Date().getFullYear();
    const logoHtml = logoUrl
        ? `<img src="${logoUrl}" alt="${appName}" style="max-height: 72px; max-width: 260px;" />`
        : `<span style="font-size: 28px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px;">${appName}</span>`;
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${appName}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0f2f5;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Header with logo -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <tr>
            <td align="center" style="padding: 0 0 32px 0;">
              <a href="${frontendUrl}" style="text-decoration: none;">
                ${logoHtml}
              </a>
            </td>
          </tr>
        </table>

        <!-- Main card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">

          <!-- Accent bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              ${content}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <tr>
            <td align="center" style="padding: 32px 0 16px 0;">
              <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.5;">
                &copy; ${year} ${appName}. All rights reserved.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #b0b8c4; line-height: 1.5;">
                You received this email because you have an account on ${appName}.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}
const styles = {
    h2: 'margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1a1a2e; line-height: 1.3;',
    p: 'margin: 0 0 16px 0; font-size: 15px; color: #4b5563; line-height: 1.7;',
    pSmall: 'margin: 0 0 12px 0; font-size: 13px; color: #9ca3af; line-height: 1.5;',
    button: 'display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;',
    infoBox: 'background: #f8f9fc; border-radius: 12px; padding: 20px 24px; margin: 24px 0;',
    infoRow: 'margin: 0 0 8px 0; font-size: 14px; color: #4b5563; line-height: 1.6;',
    divider: 'border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;',
    otpBox: 'background: #f8f9fc; border: 2px dashed #d1d5db; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;',
    otpCode: 'font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #1a1a2e; font-family: monospace;',
    badge: 'display: inline-block; background: #ecfdf5; color: #059669; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;',
};
const formatPrice = (kobo) => `₦${(kobo / 100).toLocaleString('en-NG')}`;
function verificationOtpTemplate(brand, data) {
    return {
        subject: `Your ${brand.appName} Verification Code`,
        html: baseLayout(brand, `
      <h2 style="${styles.h2}">Verify your email address</h2>
      <p style="${styles.p}">Hi ${data.firstName},</p>
      <p style="${styles.p}">Welcome to ${brand.appName}! Enter this code to verify your email:</p>

      <div style="${styles.otpBox}">
        <span style="${styles.otpCode}">${data.otp}</span>
      </div>

      <p style="${styles.p}">This code expires in <strong>10 minutes</strong>.</p>
      <p style="${styles.pSmall}">If you didn't create an account on ${brand.appName}, you can safely ignore this email.</p>
    `),
    };
}
function welcomeTemplate(brand, data) {
    return {
        subject: `Welcome to ${brand.appName}! 🎉`,
        html: baseLayout(brand, `
      <h2 style="${styles.h2}">You're all set, ${data.firstName}! 🎉</h2>
      <p style="${styles.p}">Your email has been verified and your ${brand.appName} account is ready to go.</p>

      <div style="${styles.infoBox}">
        <p style="${styles.infoRow}">🛍️ <strong>Browse</strong> — Discover unique handcrafted Nigerian products</p>
        <p style="${styles.infoRow}">🏪 <strong>Become a Creator</strong> — Set up your profile and start selling</p>
        <p style="${styles.infoRow}">💬 <strong>Connect</strong> — Chat with artisans via WhatsApp</p>
        <p style="margin: 0; font-size: 14px; color: #4b5563;">🇳🇬 <strong>Support Local</strong> — Every purchase supports Nigerian craftsmanship</p>
      </div>

      <p style="text-align: center; margin: 28px 0 0 0;">
        <a href="${brand.frontendUrl}" style="${styles.button}">Start Exploring</a>
      </p>
    `),
    };
}
function passwordResetTemplate(brand, data) {
    const resetUrl = `${data.frontendUrl}/reset-password?token=${data.resetToken}`;
    return {
        subject: `Reset Your ${brand.appName} Password`,
        html: baseLayout(brand, `
      <h2 style="${styles.h2}">Password Reset</h2>
      <p style="${styles.p}">Hi ${data.firstName},</p>
      <p style="${styles.p}">We received a request to reset your password. Click the button below to create a new one:</p>

      <p style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="${styles.button}">Reset Password</a>
      </p>

      <p style="${styles.p}">This link expires in <strong>1 hour</strong>.</p>

      <hr style="${styles.divider}">
      <p style="${styles.pSmall}">If you didn't request this, ignore this email. Your password won't change.</p>
    `),
    };
}
function orderConfirmationTemplate(brand, data) {
    const itemRows = data.items
        .map((item) => `
        <tr>
          <td style="padding: 14px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151;">${item.itemName}</td>
          <td style="padding: 14px 8px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #6b7280; text-align: center;">${item.quantity}</td>
          <td style="padding: 14px 8px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #6b7280; text-align: right;">${formatPrice(item.unitPrice)}</td>
          <td style="padding: 14px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #1a1a2e; text-align: right; font-weight: 600;">${formatPrice(item.unitPrice * item.quantity)}</td>
        </tr>`)
        .join('');
    return {
        subject: `Order Confirmed — ${data.orderNumber}`,
        html: baseLayout(brand, `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="${styles.badge}">✓ Order Confirmed</span>
      </div>

      <h2 style="${styles.h2}; text-align: center;">Thank you for your order!</h2>
      <p style="${styles.p}; text-align: center;">Hi ${data.buyerName}, your order is confirmed and being processed.</p>

      <div style="${styles.infoBox}; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
        <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #1a1a2e;">${data.orderNumber}</p>
      </div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
        <thead>
          <tr style="background: #f8f9fc;">
            <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Item</th>
            <th style="padding: 10px 8px; text-align: center; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Qty</th>
            <th style="padding: 10px 8px; text-align: right; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Price</th>
            <th style="padding: 10px 12px; text-align: right; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div style="text-align: right; padding: 16px 12px; background: #f8f9fc; border-radius: 8px; margin: 0 0 24px 0;">
        <span style="font-size: 13px; color: #9ca3af; text-transform: uppercase;">Total Paid</span>
        <br>
        <span style="font-size: 24px; font-weight: 800; color: #1a1a2e;">${formatPrice(data.totalAmount)}</span>
      </div>

      <hr style="${styles.divider}">

      <p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Shipping To</p>
      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">
        <strong>${data.shippingAddress.fullName}</strong><br>
        ${data.shippingAddress.address}<br>
        ${data.shippingAddress.city}, ${data.shippingAddress.state}
      </p>
    `),
    };
}
function newOrderAlertTemplate(brand, data) {
    return {
        subject: `💰 New Sale — ${data.orderNumber}`,
        html: baseLayout(brand, `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; font-size: 48px;">💰</span>
      </div>

      <h2 style="${styles.h2}; text-align: center;">You made a sale!</h2>
      <p style="${styles.p}; text-align: center;">Hi ${data.sellerName}, someone just purchased your item.</p>

      <div style="${styles.infoBox}">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #9ca3af;">Order</td>
            <td style="padding: 6px 0; font-size: 14px; color: #1a1a2e; font-weight: 600; text-align: right;">${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #9ca3af;">Item</td>
            <td style="padding: 6px 0; font-size: 14px; color: #1a1a2e; font-weight: 600; text-align: right;">${data.itemName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #9ca3af;">Quantity</td>
            <td style="padding: 6px 0; font-size: 14px; color: #1a1a2e; font-weight: 600; text-align: right;">${data.quantity}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #9ca3af;">Buyer</td>
            <td style="padding: 6px 0; font-size: 14px; color: #1a1a2e; font-weight: 600; text-align: right;">${data.buyerName}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 12px 0 0 0; border-top: 1px solid #e5e7eb;"></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 15px; color: #059669; font-weight: 600;">Your Payout</td>
            <td style="padding: 6px 0; font-size: 20px; color: #059669; font-weight: 800; text-align: right;">${formatPrice(data.sellerPayout)}</td>
          </tr>
        </table>
      </div>

      <p style="${styles.p}">We'll handle the fulfillment. You'll be notified when the order ships.</p>
    `),
    };
}
function orderStatusUpdateTemplate(brand, data) {
    const statusConfig = {
        processing: {
            emoji: '⚙️',
            message: 'Your order is being prepared for shipping.',
            color: '#f59e0b',
        },
        shipped: {
            emoji: '🚚',
            message: `Your order has been shipped${data.carrier ? ` via ${data.carrier}` : ''}!`,
            color: '#3b82f6',
        },
        delivered: {
            emoji: '📦',
            message: 'Your order has been delivered. We hope you love it!',
            color: '#059669',
        },
        completed: {
            emoji: '✅',
            message: `Your order is complete. Thank you for shopping on ${brand.appName}!`,
            color: '#059669',
        },
        cancelled: {
            emoji: '❌',
            message: 'Your order has been cancelled. If you were charged, a refund will be processed.',
            color: '#ef4444',
        },
        refunded: {
            emoji: '💸',
            message: 'Your refund has been processed. It may take 3-5 business days to appear.',
            color: '#8b5cf6',
        },
    };
    const config = statusConfig[data.status] || {
        emoji: '📋',
        message: `Your order status has been updated to: ${data.status}`,
        color: '#6b7280',
    };
    const statusLabel = data.status.charAt(0).toUpperCase() + data.status.slice(1);
    return {
        subject: `Order ${data.orderNumber} — ${statusLabel}`,
        html: baseLayout(brand, `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; font-size: 48px;">${config.emoji}</span>
      </div>

      <h2 style="${styles.h2}; text-align: center;">Order Update</h2>
      <p style="${styles.p}">Hi ${data.buyerName},</p>
      <p style="${styles.p}">${config.message}</p>

      <div style="${styles.infoBox}">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #9ca3af;">Order</td>
            <td style="padding: 6px 0; font-size: 14px; color: #1a1a2e; font-weight: 600; text-align: right;">${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #9ca3af;">Status</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 600; text-align: right; color: ${config.color};">${statusLabel}</td>
          </tr>
          ${data.trackingNumber
            ? `
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #9ca3af;">Tracking</td>
            <td style="padding: 6px 0; font-size: 14px; color: #1a1a2e; font-weight: 600; text-align: right;">${data.trackingNumber}</td>
          </tr>`
            : ''}
          ${data.carrier
            ? `
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #9ca3af;">Carrier</td>
            <td style="padding: 6px 0; font-size: 14px; color: #1a1a2e; font-weight: 600; text-align: right;">${data.carrier}</td>
          </tr>`
            : ''}
        </table>
      </div>
    `),
    };
}
function listingApprovedTemplate(brand, data) {
    return {
        subject: `✅ Listing Approved — ${data.itemName}`,
        html: baseLayout(brand, `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="${styles.badge}">✓ Approved</span>
      </div>

      <h2 style="${styles.h2}; text-align: center;">Your listing is live!</h2>
      <p style="${styles.p}">Hi ${data.sellerName},</p>
      <p style="${styles.p}">Great news — <strong>${data.itemName}</strong> has been approved and is now visible on the ${brand.appName} marketplace.</p>

      <p style="text-align: center; margin: 28px 0 0 0;">
        <a href="${brand.frontendUrl}" style="${styles.button}">View on ${brand.appName}</a>
      </p>
    `),
    };
}
function listingRejectedTemplate(brand, data) {
    return {
        subject: `Listing Update — ${data.itemName}`,
        html: baseLayout(brand, `
      <h2 style="${styles.h2}">Listing Not Approved</h2>
      <p style="${styles.p}">Hi ${data.sellerName},</p>
      <p style="${styles.p}">Unfortunately, your listing <strong>${data.itemName}</strong> was not approved.</p>

      <div style="${styles.infoBox}">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Reason</p>
        <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${data.reason}</p>
      </div>

      <p style="${styles.p}">You can edit your listing and resubmit it for review. Common fixes include better product images, more detailed descriptions, or accurate pricing.</p>

      <p style="text-align: center; margin: 24px 0 0 0;">
        <a href="${brand.frontendUrl}" style="${styles.button}">Edit Listing</a>
      </p>
    `),
    };
}
//# sourceMappingURL=email-templates.js.map