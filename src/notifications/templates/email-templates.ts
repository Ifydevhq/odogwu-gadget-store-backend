/**
 * notifications/templates/email-templates.ts - Email HTML Templates
 * ===================================================================
 * Professional, branded email templates.
 *
 * All templates accept a `brand` object from the notifications service:
 *   { appName: 'Odogwu Gadget Store', logoUrl: '...', frontendUrl: '...' }
 *
 * If logoUrl is null, a styled text logo is used instead.
 *
 * PALETTE — Odogwu Gadget Store
 *   blue   #0068FD  (sampled from the product logo; primary action colour)
 *   ink    #0A0A0B  (headings, the dark half of the accent bar)
 *   white  #FFFFFF  (card surface)
 *   page   #F4F5F7  (neutral canvas behind the card)
 *
 * Keep colours literal rather than variables: several email clients strip
 * anything clever, and every value here has to survive Outlook.
 */

// ─── Palette ─────────────────────────────────────────────────

const COLORS = {
  blue: '#0068FD',
  blueDark: '#0052CC',
  blueTint: '#EAF2FF',
  ink: '#0A0A0B',
  body: '#3F3F46',
  muted: '#71717A',
  faint: '#A1A1AA',
  border: '#E4E4E7',
  surface: '#FFFFFF',
  page: '#F4F5F7',
  success: '#16A34A',
  successTint: '#E8F7EE',
  warning: '#B45309',
  warningTint: '#FEF6E7',
  danger: '#DC2626',
  dangerTint: '#FDECEC',
};

// ─── Brand Config (passed from NotificationsService) ─────────

export interface EmailBrand {
  appName: string;
  logoUrl: string | null;
  frontendUrl: string;
}

// ─── Base Layout ─────────────────────────────────────────────

function baseLayout(brand: EmailBrand, content: string): string {
  const { appName, logoUrl, frontendUrl } = brand;
  const year = new Date().getFullYear();

  // The mark sits on a white chip so a dark or transparent logo stays legible
  // whatever the client does with backgrounds.
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${appName}" width="56" height="56" style="display: block; width: 56px; height: 56px; border: 0; border-radius: 14px;" />`
    : `<span style="font-size: 26px; font-weight: 800; color: ${COLORS.ink}; letter-spacing: -0.6px;">${appName}</span>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${appName}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.page}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${COLORS.page};">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Brand -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <tr>
            <td align="center" style="padding: 0 0 24px 0;">
              <a href="${frontendUrl}" style="text-decoration: none; color: ${COLORS.ink};">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding-right: 12px; vertical-align: middle;">${logoHtml}</td>
                    <td style="vertical-align: middle;">
                      <span style="font-size: 19px; font-weight: 800; color: ${COLORS.ink}; letter-spacing: -0.4px;">${appName}</span>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background: ${COLORS.surface}; border-radius: 16px; overflow: hidden; border: 1px solid ${COLORS.border};">

          <!-- Accent bar: brand blue running into black -->
          <tr>
            <td style="height: 4px; background: ${COLORS.blue}; background: linear-gradient(90deg, ${COLORS.blue} 0%, ${COLORS.blue} 55%, ${COLORS.ink} 100%); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              ${content}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <tr>
            <td align="center" style="padding: 28px 8px 8px 8px;">
              <p style="margin: 0 0 6px 0; font-size: 13px; color: ${COLORS.muted}; line-height: 1.6;">
                <a href="${frontendUrl}" style="color: ${COLORS.blue}; text-decoration: none; font-weight: 600;">Shop</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="${frontendUrl}/orders" style="color: ${COLORS.blue}; text-decoration: none; font-weight: 600;">My orders</a>
              </p>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: ${COLORS.faint}; line-height: 1.6;">
                &copy; ${year} ${appName}. All rights reserved.<br>
                You received this email because you have an account with us.
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

// ─── Shared Styles (inline for email compatibility) ─────────

const styles = {
  h2: `margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: ${COLORS.ink}; line-height: 1.3; letter-spacing: -0.4px;`,
  p: `margin: 0 0 16px 0; font-size: 15px; color: ${COLORS.body}; line-height: 1.7;`,
  pSmall: `margin: 0 0 12px 0; font-size: 13px; color: ${COLORS.muted}; line-height: 1.6;`,
  // Solid rather than a gradient: Outlook drops gradients and would render a
  // white-on-white button.
  button: `display: inline-block; background: ${COLORS.blue}; color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 700; letter-spacing: 0.2px;`,
  buttonSecondary: `display: inline-block; background: ${COLORS.surface}; color: ${COLORS.ink} !important; border: 1px solid ${COLORS.border}; text-decoration: none; padding: 13px 30px; border-radius: 10px; font-size: 15px; font-weight: 600;`,
  infoBox: `background: ${COLORS.page}; border: 1px solid ${COLORS.border}; border-radius: 12px; padding: 20px 24px; margin: 24px 0;`,
  infoRow: `margin: 0 0 8px 0; font-size: 14px; color: ${COLORS.body}; line-height: 1.6;`,
  divider: `border: none; border-top: 1px solid ${COLORS.border}; margin: 28px 0;`,
  otpBox: `background: ${COLORS.blueTint}; border: 1px solid ${COLORS.blue}; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;`,
  otpCode: `font-size: 38px; font-weight: 800; letter-spacing: 10px; color: ${COLORS.blue}; font-family: 'SFMono-Regular', Menlo, Consolas, monospace;`,
  badge: `display: inline-block; background: ${COLORS.blueTint}; color: ${COLORS.blueDark}; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.6px;`,
  badgeSuccess: `display: inline-block; background: ${COLORS.successTint}; color: ${COLORS.success}; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.6px;`,
  badgeWarning: `display: inline-block; background: ${COLORS.warningTint}; color: ${COLORS.warning}; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.6px;`,
  badgeDanger: `display: inline-block; background: ${COLORS.dangerTint}; color: ${COLORS.danger}; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.6px;`,
  // Order/summary table chrome, so every table in every template matches.
  tableHead: `padding: 10px 12px; text-align: left; font-size: 11px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 700; background: ${COLORS.page};`,
  totalBox: `text-align: right; padding: 16px 18px; background: ${COLORS.ink}; border-radius: 12px; margin: 0 0 24px 0;`,
  totalLabel: `font-size: 12px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.8px;`,
  totalValue: `font-size: 24px; font-weight: 800; color: #ffffff;`,
  dueBox: `text-align: right; padding: 16px 18px; background: ${COLORS.blueTint}; border: 1px solid ${COLORS.blue}; border-radius: 12px; margin: 0 0 24px 0;`,
  dueLabel: `font-size: 12px; color: ${COLORS.blueDark}; text-transform: uppercase; letter-spacing: 0.8px;`,
  dueValue: `font-size: 24px; font-weight: 800; color: ${COLORS.ink};`,
};

// ─── Price formatter ────────────────────────────────────────

const formatPrice = (kobo: number) =>
  `₦${(kobo / 100).toLocaleString('en-NG')}`;

// ═══════════════════════════════════════════════════════════════
// TEMPLATE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * 1. Verification OTP — sent after registration
 */
export function verificationOtpTemplate(
  brand: EmailBrand,
  data: { firstName: string; otp: string },
): { subject: string; html: string } {
  return {
    subject: `Your ${brand.appName} Verification Code`,
    html: baseLayout(
      brand,
      `
      <h2 style="${styles.h2}">Verify your email address</h2>
      <p style="${styles.p}">Hi ${data.firstName},</p>
      <p style="${styles.p}">Welcome to ${brand.appName}! Enter this code to verify your email:</p>

      <div style="${styles.otpBox}">
        <span style="${styles.otpCode}">${data.otp}</span>
      </div>

      <p style="${styles.p}">This code expires in <strong>10 minutes</strong>.</p>
      <p style="${styles.pSmall}">If you didn't create an account on ${brand.appName}, you can safely ignore this email.</p>
    `,
    ),
  };
}

/**
 * 2. Welcome — sent after email is verified
 */
export function welcomeTemplate(
  brand: EmailBrand,
  data: { firstName: string },
): { subject: string; html: string } {
  return {
    subject: `Welcome to ${brand.appName}`,
    html: baseLayout(
      brand,
      `
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="${styles.badge}">Account verified</span>
      </div>

      <h2 style="${styles.h2}; text-align: center;">You're all set, ${data.firstName}</h2>
      <p style="${styles.p}; text-align: center;">Your email is verified and your ${brand.appName} account is ready. Here is what you can do now.</p>

      <div style="${styles.infoBox}">
        <p style="${styles.infoRow}"><strong style="color: ${COLORS.ink};">Shop the catalogue</strong><br>Laptops, phones, tablets, audio, power and accessories — brand new, UK-used and refurbished.</p>
        <p style="${styles.infoRow}"><strong style="color: ${COLORS.ink};">Save what you like</strong><br>Tap the heart on any item to keep it in one place while you decide.</p>
        <p style="${styles.infoRow}"><strong style="color: ${COLORS.ink};">Track every order</strong><br>Follow your order from placed to delivered, and keep your delivery addresses saved.</p>
        <p style="margin: 0; font-size: 14px; color: ${COLORS.body}; line-height: 1.6;"><strong style="color: ${COLORS.ink};">Talk to us</strong><br>Message us in the app or on WhatsApp — we will help you pick the right device.</p>
      </div>

      <p style="text-align: center; margin: 28px 0 0 0;">
        <a href="${brand.frontendUrl}" style="${styles.button}">Start shopping</a>
      </p>
    `,
    ),
  };
}

/**
 * 3. Password Reset — sent when user requests reset
 */
export function passwordResetTemplate(
  brand: EmailBrand,
  data: { firstName: string; resetToken: string; frontendUrl: string },
): { subject: string; html: string } {
  const resetUrl = `${data.frontendUrl}/reset-password?token=${data.resetToken}`;

  return {
    subject: `Reset Your ${brand.appName} Password`,
    html: baseLayout(
      brand,
      `
      <h2 style="${styles.h2}">Password Reset</h2>
      <p style="${styles.p}">Hi ${data.firstName},</p>
      <p style="${styles.p}">We received a request to reset your password. Click the button below to create a new one:</p>

      <p style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="${styles.button}">Reset Password</a>
      </p>

      <p style="${styles.p}">This link expires in <strong>1 hour</strong>.</p>

      <hr style="${styles.divider}">
      <p style="${styles.pSmall}">If you didn't request this, ignore this email. Your password won't change.</p>
    `,
    ),
  };
}

/**
 * 4. Order Confirmation — sent to BUYER after payment
 */
export function orderConfirmationTemplate(
  brand: EmailBrand,
  data: {
    buyerName: string;
    orderNumber: string;
    items: Array<{ itemName: string; quantity: number; unitPrice: number }>;
    totalAmount: number;
    shippingAddress: {
      fullName: string;
      address: string;
      city: string;
      state: string;
    };
  },
): { subject: string; html: string } {
  const itemRows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 14px 12px; border-bottom: 1px solid ${COLORS.border}; font-size: 14px; color: ${COLORS.body};">${item.itemName}</td>
          <td style="padding: 14px 8px; border-bottom: 1px solid ${COLORS.border}; font-size: 14px; color: ${COLORS.muted}; text-align: center;">${item.quantity}</td>
          <td style="padding: 14px 8px; border-bottom: 1px solid ${COLORS.border}; font-size: 14px; color: ${COLORS.muted}; text-align: right;">${formatPrice(item.unitPrice)}</td>
          <td style="padding: 14px 12px; border-bottom: 1px solid ${COLORS.border}; font-size: 14px; color: ${COLORS.ink}; text-align: right; font-weight: 600;">${formatPrice(item.unitPrice * item.quantity)}</td>
        </tr>`,
    )
    .join('');

  return {
    subject: `Order Confirmed — ${data.orderNumber}`,
    html: baseLayout(
      brand,
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="${styles.badge}">✓ Order Confirmed</span>
      </div>

      <h2 style="${styles.h2}; text-align: center;">Thank you for your order!</h2>
      <p style="${styles.p}; text-align: center;">Hi ${data.buyerName}, your order is confirmed and being processed.</p>

      <div style="${styles.infoBox}; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
        <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: ${COLORS.ink};">${data.orderNumber}</p>
      </div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
        <thead>
          <tr style="background: ${COLORS.page};">
            <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Item</th>
            <th style="padding: 10px 8px; text-align: center; font-size: 11px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Qty</th>
            <th style="padding: 10px 8px; text-align: right; font-size: 11px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Price</th>
            <th style="padding: 10px 12px; text-align: right; font-size: 11px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div style="text-align: right; padding: 16px 12px; background: ${COLORS.page}; border-radius: 8px; margin: 0 0 24px 0;">
        <span style="font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase;">Total Paid</span>
        <br>
        <span style="font-size: 24px; font-weight: 800; color: ${COLORS.ink};">${formatPrice(data.totalAmount)}</span>
      </div>

      <hr style="${styles.divider}">

      <p style="margin: 0 0 8px 0; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Shipping To</p>
      <p style="margin: 0; font-size: 15px; color: ${COLORS.body}; line-height: 1.6;">
        <strong>${data.shippingAddress.fullName}</strong><br>
        ${data.shippingAddress.address}<br>
        ${data.shippingAddress.city}, ${data.shippingAddress.state}
      </p>
    `,
    ),
  };
}

/**
 * 4b. Order Placed (Pay on Delivery) — sent to BUYER when a COD order is
 * created.
 *
 * Deliberately NOT the confirmation receipt: nothing has been paid yet, so it
 * must not say "Order Confirmed" or "Total Paid". It acknowledges the order,
 * states the amount due on delivery, and says the team will be in touch. The
 * receipt goes out separately once payment is actually recorded.
 */
export function orderPlacedOnDeliveryTemplate(
  brand: EmailBrand,
  data: {
    buyerName: string;
    orderNumber: string;
    items: Array<{ itemName: string; quantity: number; unitPrice: number }>;
    totalAmount: number;
    shippingAddress: {
      fullName: string;
      address: string;
      city: string;
      state: string;
    };
  },
): { subject: string; html: string } {
  const itemRows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 14px 12px; border-bottom: 1px solid ${COLORS.border}; font-size: 14px; color: ${COLORS.body};">${item.itemName}</td>
          <td style="padding: 14px 8px; border-bottom: 1px solid ${COLORS.border}; font-size: 14px; color: ${COLORS.muted}; text-align: center;">${item.quantity}</td>
          <td style="padding: 14px 8px; border-bottom: 1px solid ${COLORS.border}; font-size: 14px; color: ${COLORS.muted}; text-align: right;">${formatPrice(item.unitPrice)}</td>
          <td style="padding: 14px 12px; border-bottom: 1px solid ${COLORS.border}; font-size: 14px; color: ${COLORS.ink}; text-align: right; font-weight: 600;">${formatPrice(item.unitPrice * item.quantity)}</td>
        </tr>`,
    )
    .join('');

  return {
    subject: `Order received — ${data.orderNumber}`,
    html: baseLayout(
      brand,
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="${styles.badge}">Order Received</span>
      </div>

      <h2 style="${styles.h2}; text-align: center;">Thanks — we have your order</h2>
      <p style="${styles.p}; text-align: center;">Hi ${data.buyerName}, we have received your order and our team will reach out shortly to confirm it and arrange delivery.</p>

      <div style="${styles.infoBox}; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
        <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: ${COLORS.ink};">${data.orderNumber}</p>
      </div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
        <thead>
          <tr style="background: ${COLORS.page};">
            <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Item</th>
            <th style="padding: 10px 8px; text-align: center; font-size: 11px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Qty</th>
            <th style="padding: 10px 8px; text-align: right; font-size: 11px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Price</th>
            <th style="padding: 10px 12px; text-align: right; font-size: 11px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div style="text-align: right; padding: 16px 12px; background: ${COLORS.warningTint}; border: 1px solid ${COLORS.warning}; border-radius: 8px; margin: 0 0 24px 0;">
        <span style="font-size: 13px; color: ${COLORS.warning}; text-transform: uppercase;">Amount due on delivery</span>
        <br>
        <span style="font-size: 24px; font-weight: 800; color: ${COLORS.ink};">${formatPrice(data.totalAmount)}</span>
      </div>

      <p style="${styles.p}">Please have the exact amount ready when your order arrives. You will get a receipt by email once payment has been received.</p>

      <hr style="${styles.divider}">

      <p style="margin: 0 0 8px 0; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Delivering To</p>
      <p style="margin: 0; font-size: 15px; color: ${COLORS.body}; line-height: 1.6;">
        <strong>${data.shippingAddress.fullName}</strong><br>
        ${data.shippingAddress.address}<br>
        ${data.shippingAddress.city}, ${data.shippingAddress.state}
      </p>
    `,
    ),
  };
}

/**
 * 4c. Admin order copy — the internal notification for a new order.
 *
 * Not the customer receipt. The one thing whoever reads this needs to know is
 * whether the money is already in: a pay-on-delivery order must say cash is
 * still owed, not "Total Paid". Sending the buyer's receipt to the admin got
 * that backwards for every COD order.
 */
export function adminOrderCopyTemplate(
  brand: EmailBrand,
  data: {
    buyerName: string;
    orderNumber: string;
    items: Array<{ itemName: string; quantity: number; unitPrice: number }>;
    totalAmount: number;
    shippingAddress: {
      fullName: string;
      address: string;
      city: string;
      state: string;
      phoneNumber?: string;
    };
    payOnDelivery?: boolean;
  },
): { subject: string; html: string } {
  const cod = data.payOnDelivery === true;

  const itemRows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 14px 12px; border-bottom: 1px solid ${COLORS.border}; font-size: 14px; color: ${COLORS.body};">${item.itemName}</td>
          <td style="padding: 14px 8px; border-bottom: 1px solid ${COLORS.border}; font-size: 14px; color: ${COLORS.muted}; text-align: center;">${item.quantity}</td>
          <td style="padding: 14px 8px; border-bottom: 1px solid ${COLORS.border}; font-size: 14px; color: ${COLORS.muted}; text-align: right;">${formatPrice(item.unitPrice)}</td>
          <td style="padding: 14px 12px; border-bottom: 1px solid ${COLORS.border}; font-size: 14px; color: ${COLORS.ink}; text-align: right; font-weight: 600;">${formatPrice(item.unitPrice * item.quantity)}</td>
        </tr>`,
    )
    .join('');

  const moneyBlock = cod
    ? `<div style="${styles.dueBox}">
         <span style="${styles.dueLabel}">Collect on delivery</span><br>
         <span style="${styles.dueValue}">${formatPrice(data.totalAmount)}</span>
       </div>`
    : `<div style="${styles.totalBox}">
         <span style="${styles.totalLabel}">Total paid</span><br>
         <span style="${styles.totalValue}">${formatPrice(data.totalAmount)}</span>
       </div>`;

  const phone = data.shippingAddress.phoneNumber
    ? `<br>${data.shippingAddress.phoneNumber}`
    : '';

  return {
    subject: cod
      ? `New order (pay on delivery) — ${data.orderNumber}`
      : `New order (paid) — ${data.orderNumber}`,
    html: baseLayout(
      brand,
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="${cod ? styles.badgeWarning : styles.badgeSuccess}">
          ${cod ? 'Payment due on delivery' : 'Payment received'}
        </span>
      </div>

      <h2 style="${styles.h2}; text-align: center;">New order from ${data.buyerName}</h2>
      <p style="${styles.p}; text-align: center;">${
        cod
          ? 'This order has <strong>not</strong> been paid for. Confirm it with the customer and collect payment on delivery.'
          : 'Payment has been received. This order is ready to be fulfilled.'
      }</p>

      <div style="${styles.infoBox}; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
        <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: ${COLORS.ink};">${data.orderNumber}</p>
      </div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
        <thead>
          <tr>
            <th style="${styles.tableHead}">Item</th>
            <th style="${styles.tableHead} text-align: center;">Qty</th>
            <th style="${styles.tableHead} text-align: right;">Price</th>
            <th style="${styles.tableHead} text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      ${moneyBlock}

      <hr style="${styles.divider}">

      <p style="margin: 0 0 8px 0; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Deliver To</p>
      <p style="margin: 0; font-size: 15px; color: ${COLORS.body}; line-height: 1.6;">
        <strong>${data.shippingAddress.fullName}</strong><br>
        ${data.shippingAddress.address}<br>
        ${data.shippingAddress.city}, ${data.shippingAddress.state}${phone}
      </p>
    `,
    ),
  };
}

/**
 * 5. New Order Alert — sent to SELLER when someone buys their item
 */
export function newOrderAlertTemplate(
  brand: EmailBrand,
  data: {
    sellerName: string;
    orderNumber: string;
    itemName: string;
    quantity: number;
    sellerPayout: number;
    buyerName: string;
  },
): { subject: string; html: string } {
  return {
    subject: `💰 New Sale — ${data.orderNumber}`,
    html: baseLayout(
      brand,
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; font-size: 48px;">💰</span>
      </div>

      <h2 style="${styles.h2}; text-align: center;">You made a sale!</h2>
      <p style="${styles.p}; text-align: center;">Hi ${data.sellerName}, someone just purchased your item.</p>

      <div style="${styles.infoBox}">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.muted};">Order</td>
            <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.ink}; font-weight: 600; text-align: right;">${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.muted};">Item</td>
            <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.ink}; font-weight: 600; text-align: right;">${data.itemName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.muted};">Quantity</td>
            <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.ink}; font-weight: 600; text-align: right;">${data.quantity}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.muted};">Buyer</td>
            <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.ink}; font-weight: 600; text-align: right;">${data.buyerName}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 12px 0 0 0; border-top: 1px solid ${COLORS.border};"></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 15px; color: ${COLORS.success}; font-weight: 600;">Your Payout</td>
            <td style="padding: 6px 0; font-size: 20px; color: ${COLORS.success}; font-weight: 800; text-align: right;">${formatPrice(data.sellerPayout)}</td>
          </tr>
        </table>
      </div>

      <p style="${styles.p}">We'll handle the fulfillment. You'll be notified when the order ships.</p>
    `,
    ),
  };
}

/**
 * 6. Order Status Update — sent to buyer when status changes
 */
export function orderStatusUpdateTemplate(
  brand: EmailBrand,
  data: {
    buyerName: string;
    orderNumber: string;
    status: string;
    trackingNumber?: string;
    carrier?: string;
  },
): { subject: string; html: string } {
  const statusConfig: Record<
    string,
    { emoji: string; message: string; color: string }
  > = {
    processing: {
      emoji: '⚙️',
      message: 'Your order is being prepared for shipping.',
      color: COLORS.warning,
    },
    shipped: {
      emoji: '🚚',
      message: `Your order has been shipped${data.carrier ? ` via ${data.carrier}` : ''}!`,
      color: COLORS.blue,
    },
    delivered: {
      emoji: '📦',
      message: 'Your order has been delivered. We hope you love it!',
      color: COLORS.success,
    },
    completed: {
      emoji: '✅',
      message: `Your order is complete. Thank you for shopping on ${brand.appName}!`,
      color: COLORS.success,
    },
    cancelled: {
      emoji: '❌',
      message:
        'Your order has been cancelled. If you were charged, a refund will be processed.',
      color: COLORS.danger,
    },
    refunded: {
      emoji: '💸',
      message:
        'Your refund has been processed. It may take 3-5 business days to appear.',
      color: COLORS.blue,
    },
  };

  const config = statusConfig[data.status] || {
    emoji: '📋',
    message: `Your order status has been updated to: ${data.status}`,
    color: COLORS.muted,
  };
  const statusLabel =
    data.status.charAt(0).toUpperCase() + data.status.slice(1);

  return {
    subject: `Order ${data.orderNumber} — ${statusLabel}`,
    html: baseLayout(
      brand,
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; font-size: 48px;">${config.emoji}</span>
      </div>

      <h2 style="${styles.h2}; text-align: center;">Order Update</h2>
      <p style="${styles.p}">Hi ${data.buyerName},</p>
      <p style="${styles.p}">${config.message}</p>

      <div style="${styles.infoBox}">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.muted};">Order</td>
            <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.ink}; font-weight: 600; text-align: right;">${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.muted};">Status</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 600; text-align: right; color: ${config.color};">${statusLabel}</td>
          </tr>
          ${
            data.trackingNumber
              ? `
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.muted};">Tracking</td>
            <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.ink}; font-weight: 600; text-align: right;">${data.trackingNumber}</td>
          </tr>`
              : ''
          }
          ${
            data.carrier
              ? `
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.muted};">Carrier</td>
            <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.ink}; font-weight: 600; text-align: right;">${data.carrier}</td>
          </tr>`
              : ''
          }
        </table>
      </div>
    `,
    ),
  };
}

/**
 * 7. Listing Approved — sent to seller when admin approves
 */
export function listingApprovedTemplate(
  brand: EmailBrand,
  data: { sellerName: string; itemName: string },
): { subject: string; html: string } {
  return {
    subject: `✅ Listing Approved — ${data.itemName}`,
    html: baseLayout(
      brand,
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="${styles.badge}">✓ Approved</span>
      </div>

      <h2 style="${styles.h2}; text-align: center;">Your listing is live!</h2>
      <p style="${styles.p}">Hi ${data.sellerName},</p>
      <p style="${styles.p}">Great news — <strong>${data.itemName}</strong> has been approved and is now visible on the ${brand.appName} marketplace.</p>

      <p style="text-align: center; margin: 28px 0 0 0;">
        <a href="${brand.frontendUrl}" style="${styles.button}">View on ${brand.appName}</a>
      </p>
    `,
    ),
  };
}

/**
 * 8. Listing Rejected — sent to seller when admin rejects
 */
export function listingRejectedTemplate(
  brand: EmailBrand,
  data: { sellerName: string; itemName: string; reason: string },
): { subject: string; html: string } {
  return {
    subject: `Listing Update — ${data.itemName}`,
    html: baseLayout(
      brand,
      `
      <h2 style="${styles.h2}">Listing Not Approved</h2>
      <p style="${styles.p}">Hi ${data.sellerName},</p>
      <p style="${styles.p}">Unfortunately, your listing <strong>${data.itemName}</strong> was not approved.</p>

      <div style="${styles.infoBox}">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Reason</p>
        <p style="margin: 0; font-size: 14px; color: ${COLORS.body}; line-height: 1.6;">${data.reason}</p>
      </div>

      <p style="${styles.p}">You can edit your listing and resubmit it for review. Common fixes include better product images, more detailed descriptions, or accurate pricing.</p>

      <p style="text-align: center; margin: 24px 0 0 0;">
        <a href="${brand.frontendUrl}" style="${styles.button}">Edit Listing</a>
      </p>
    `,
    ),
  };
}