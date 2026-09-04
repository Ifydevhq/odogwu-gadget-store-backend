"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
const nodemailer = require("nodemailer");
const dns = require("dns");
const axios_1 = require("axios");
const email_templates_1 = require("./templates/email-templates");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(NotificationsService_1.name);
        this.resend = null;
        this.transporter = null;
        const appName = this.configService.get('app.name') || 'Odogwu Gadget Store';
        const logoUrl = this.configService.get('app.logoUrl') || null;
        const frontendUrl = this.configService.get('app.frontendUrl') ||
            'http://localhost:3000';
        this.brand = { appName, logoUrl, frontendUrl };
        const resendApiKey = this.configService.get('app.resendApiKey');
        const host = this.configService.get('app.mail.host');
        const port = this.configService.get('app.mail.port');
        const user = this.configService.get('app.mail.user');
        const password = this.configService.get('app.mail.password');
        this.fromAddress =
            this.configService.get('app.mail.from') ||
                `${appName} <noreply@kraft.ng>`;
        this.adminEmail = this.configService.get('app.adminEmail') || null;
        if (resendApiKey) {
            this.provider = 'resend';
            this.isConfigured = true;
            this.resend = new resend_1.Resend(resendApiKey);
            this.logger.log('══════════════════════════════════════════');
            this.logger.log('✅ MAIL: Resend (HTTP API) configured');
            this.logger.log(`   From: ${this.fromAddress}`);
            this.logger.log(`   Admin email: ${this.adminEmail || 'NOT SET — add ADMIN_EMAIL to .env'}`);
            this.logger.log('══════════════════════════════════════════');
        }
        else if (host && user && password) {
            this.provider = 'nodemailer';
            this.isConfigured = true;
            (async () => {
                let resolvedHost = host;
                try {
                    const addresses = await dns.promises.resolve4(host);
                    if (addresses?.length) {
                        resolvedHost = addresses[0];
                        this.logger.log(`Resolved ${host} → ${resolvedHost} (IPv4)`);
                    }
                }
                catch {
                    this.logger.warn(`Could not resolve ${host} to IPv4, using hostname directly`);
                }
                this.transporter = nodemailer.createTransport({
                    host: resolvedHost,
                    port: port || 587,
                    secure: port === 465,
                    auth: { user, pass: password },
                    tls: { servername: host },
                });
                this.transporter
                    .verify()
                    .then(() => {
                    this.logger.log('══════════════════════════════════════════');
                    this.logger.log('✅ MAIL: SMTP connected and ready to send');
                    this.logger.log(`   Host: ${resolvedHost}:${port || 587}`);
                    this.logger.log(`   From: ${this.fromAddress}`);
                    this.logger.log(`   Admin email: ${this.adminEmail || 'NOT SET — add ADMIN_EMAIL to .env'}`);
                    this.logger.log('══════════════════════════════════════════');
                })
                    .catch((err) => {
                    this.logger.error('══════════════════════════════════════════');
                    this.logger.error(`❌ MAIL: SMTP connection FAILED — ${err.message}`);
                    this.logger.error('    order receipts will NOT be sent!');
                    this.logger.error(`   Check MAIL_HOST, MAIL_USER, MAIL_PASSWORD in .env`);
                    this.logger.error('══════════════════════════════════════════');
                });
            })();
        }
        else {
            this.provider = 'none';
            this.isConfigured = false;
            this.logger.warn('══════════════════════════════════════════');
            this.logger.warn('⚠️  MAIL: NOT CONFIGURED — emails will only log to console');
            this.logger.warn('    order receipts will NOT be sent!');
            this.logger.warn('   To fix: set RESEND_API_KEY (recommended) or MAIL_HOST/MAIL_USER/MAIL_PASSWORD in .env');
            this.logger.warn(`   Admin email: ${this.adminEmail || 'NOT SET'}`);
            this.logger.warn('══════════════════════════════════════════');
        }
        this.ownerWhatsapp =
            this.configService.get('app.whatsapp.ownerNumber') ||
                '+2348109362830';
        this.whatsappCloudToken =
            this.configService.get('app.whatsapp.cloudToken') || null;
        this.whatsappPhoneNumberId =
            this.configService.get('app.whatsapp.phoneNumberId') || null;
        this.whatsappApiVersion =
            this.configService.get('app.whatsapp.apiVersion') || 'v21.0';
        this.callmebotApiKey =
            this.configService.get('app.whatsapp.callmebotApiKey') || null;
        if (this.whatsappCloudToken && this.whatsappPhoneNumberId) {
            this.whatsappProvider = 'cloud';
        }
        else if (this.callmebotApiKey) {
            this.whatsappProvider = 'callmebot';
        }
        else {
            this.whatsappProvider = 'none';
        }
        this.logger.log(`📱 WhatsApp order alerts → ${this.ownerWhatsapp} (provider: ${this.whatsappProvider})` +
            (this.whatsappProvider === 'none'
                ? ' — set WHATSAPP_CLOUD_TOKEN+WHATSAPP_PHONE_NUMBER_ID or CALLMEBOT_API_KEY to deliver'
                : ''));
    }
    normaliseWhatsappNumber(num) {
        return (num || '').replace(/[^\d]/g, '');
    }
    async sendWhatsappText(to, message) {
        const number = this.normaliseWhatsappNumber(to);
        if (this.whatsappProvider === 'none' || !number) {
            this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            this.logger.warn('📱 WHATSAPP NOT SENT (no provider configured)');
            this.logger.warn(`   To: ${to}`);
            this.logger.warn(`   Message:\n${message}`);
            this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return;
        }
        try {
            if (this.whatsappProvider === 'cloud') {
                await axios_1.default.post(`https://graph.facebook.com/${this.whatsappApiVersion}/${this.whatsappPhoneNumberId}/messages`, {
                    messaging_product: 'whatsapp',
                    to: number,
                    type: 'text',
                    text: { preview_url: false, body: message },
                }, {
                    headers: {
                        Authorization: `Bearer ${this.whatsappCloudToken}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 15000,
                });
                this.logger.log(`📱 WhatsApp order alert sent to ${to} via Cloud API`);
            }
            else if (this.whatsappProvider === 'callmebot') {
                await axios_1.default.get('https://api.callmebot.com/whatsapp.php', {
                    params: {
                        phone: number,
                        text: message,
                        apikey: this.callmebotApiKey,
                    },
                    timeout: 15000,
                });
                this.logger.log(`📱 WhatsApp order alert sent to ${to} via CallMeBot`);
            }
        }
        catch (error) {
            this.logger.error(`❌ Failed to send WhatsApp alert to ${to}: ${error?.response?.data?.error?.message || error.message}`);
        }
    }
    async sendOwnerOrderWhatsapp(data) {
        const naira = (kobo) => `₦${((kobo || 0) / 100).toLocaleString('en-NG')}`;
        const itemLines = data.items
            .map((i) => `• ${i.quantity} × ${i.itemName} — ${naira(i.unitPrice)}`)
            .join('\n');
        const addr = data.shippingAddress;
        const addressLine = addr
            ? [addr.address, addr.city, addr.state, addr.country]
                .filter(Boolean)
                .join(', ')
            : '';
        const message = [
            `🛒 *New Order — ${this.brand.appName}*`,
            `Order: *${data.orderNumber}*`,
            `Payment: ${data.paymentLabel}`,
            `Total: *${naira(data.totalAmount)}*`,
            '',
            '*Items:*',
            itemLines,
            '',
            `Customer: ${data.buyerName}`,
            data.phoneNumber ? `Phone: ${data.phoneNumber}` : '',
            addressLine ? `Deliver to: ${addressLine}` : '',
            data.buyerNote ? `Note: ${data.buyerNote}` : '',
        ]
            .filter((line) => line !== '')
            .join('\n');
        await this.sendWhatsappText(this.ownerWhatsapp, message);
    }
    async send(to, subject, html, options) {
        if (!this.isConfigured) {
            this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            this.logger.warn(`📧 EMAIL NOT SENT (not configured)`);
            this.logger.warn(`   To: ${to}`);
            this.logger.warn(`   Subject: ${subject}`);
            this.logger.warn('   ⚠️  Set RESEND_API_KEY or MAIL_HOST/MAIL_USER/MAIL_PASSWORD in .env');
            this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return;
        }
        try {
            if (this.provider === 'resend' && this.resend) {
                const payload = {
                    from: this.fromAddress,
                    to: [to],
                    subject,
                    html,
                };
                if (options?.bccAdmin && this.adminEmail) {
                    payload.bcc = [this.adminEmail];
                }
                const { error } = await this.resend.emails.send(payload);
                if (error) {
                    throw new Error(error.message);
                }
                this.logger.log(`📧 Email sent to ${to} via Resend`);
            }
            else if (this.provider === 'nodemailer' && this.transporter) {
                const mailOptions = {
                    from: this.fromAddress,
                    to,
                    subject,
                    html,
                };
                if (options?.bccAdmin && this.adminEmail) {
                    mailOptions.bcc = this.adminEmail;
                }
                const info = await this.transporter.sendMail(mailOptions);
                this.logger.log(`📧 Email sent to ${to} — MessageId: ${info.messageId}`);
            }
            else {
                this.logger.warn(`📧 Email provider not ready yet, retrying in 3s...`);
                await new Promise((r) => setTimeout(r, 3000));
                if (this.transporter) {
                    const info = await this.transporter.sendMail({
                        from: this.fromAddress,
                        to,
                        subject,
                        html,
                    });
                    this.logger.log(`📧 Email sent to ${to} (retry) — MessageId: ${info.messageId}`);
                }
            }
        }
        catch (error) {
            this.logger.error(`❌ Failed to send email to ${to}: ${error.message}`);
        }
    }
    async sendRawEmail(to, subject, html) {
        await this.send(to, subject, html);
    }
    async sendVerificationOtp(email, firstName, otp) {
        const { subject, html } = (0, email_templates_1.verificationOtpTemplate)(this.brand, {
            firstName,
            otp,
        });
        await this.send(email, subject, html);
    }
    async sendWelcome(email, firstName) {
        const { subject, html } = (0, email_templates_1.welcomeTemplate)(this.brand, { firstName });
        await this.send(email, subject, html);
    }
    async sendPasswordReset(email, firstName, resetToken) {
        const frontendUrl = this.configService.get('app.frontendUrl') ||
            'http://localhost:3000';
        const { subject, html } = (0, email_templates_1.passwordResetTemplate)(this.brand, {
            firstName,
            resetToken,
            frontendUrl,
        });
        await this.send(email, subject, html);
    }
    async sendOrderConfirmation(buyerEmail, data) {
        const { subject, html } = (0, email_templates_1.orderConfirmationTemplate)(this.brand, data);
        await this.send(buyerEmail, subject, html);
    }
    async sendOrderPlacedOnDelivery(buyerEmail, data) {
        const { subject, html } = (0, email_templates_1.orderPlacedOnDeliveryTemplate)(this.brand, data);
        await this.send(buyerEmail, subject, html);
    }
    async sendAdminOrderCopy(data) {
        if (!this.adminEmail)
            return;
        const { subject, html } = (0, email_templates_1.adminOrderCopyTemplate)(this.brand, data);
        await this.send(this.adminEmail, `[Admin] ${subject}`, html);
    }
    async sendNewOrderAlert(sellerEmail, data) {
        const { subject, html } = (0, email_templates_1.newOrderAlertTemplate)(this.brand, data);
        await this.send(sellerEmail, subject, html);
    }
    async sendOrderStatusUpdate(buyerEmail, data) {
        const { subject, html } = (0, email_templates_1.orderStatusUpdateTemplate)(this.brand, data);
        await this.send(buyerEmail, subject, html);
    }
    async sendListingApproved(sellerEmail, sellerName, itemName) {
        const { subject, html } = (0, email_templates_1.listingApprovedTemplate)(this.brand, {
            sellerName,
            itemName,
        });
        await this.send(sellerEmail, subject, html);
    }
    async sendListingRejected(sellerEmail, sellerName, itemName, reason) {
        const { subject, html } = (0, email_templates_1.listingRejectedTemplate)(this.brand, {
            sellerName,
            itemName,
            reason,
        });
        await this.send(sellerEmail, subject, html);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map