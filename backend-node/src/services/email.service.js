import nodemailer from 'nodemailer';
import { logger } from '../config/logger.js';

export class EmailService {
    static transporter;

    /**
     * Initialize email service
     */
    static initialize() {
        if (!process.env.EMAIL_HOST) {
            logger.warn('Email service not configured - EMAIL_HOST not set');
            return;
        }

        try {
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT || '465', 10),
                secure: process.env.EMAIL_SECURE !== 'false',
                auth: process.env.EMAIL_USER ? {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                } : undefined,
            });

            logger.info('Email service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize email service:', error);
        }
    }

    /**
     * Send OTP verification email
     */
    /**
   * @param {string} email
   * @param {string} otp
   * @param {string} [firstName]
   */
    static async sendOTPEmail(email, otp, firstName) {
        if (!this.transporter) {
            logger.error('Email service not initialized');
            return false;
        }

        const displayName = firstName ? ` ${firstName}` : '';
        const siteName = process.env.SITE_NAME || 'MyCrewManager';

        const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
          <div style="max-width:600px;margin:auto;background:white;border-radius:10px;overflow:hidden;">
            
            <div style="background:#1e293b;color:white;padding:20px;text-align:center;">
              <h1>${siteName}</h1>
              <p>Secure Your Account</p>
            </div>

            <div style="padding:30px;">
              <h2>Hello${displayName} 👋</h2>
              <p>You're one step away from accessing your workspace in <strong>${siteName}</strong>.</p>

              <p>Use the verification code below to activate your account:</p>

              <div style="text-align:center;margin:25px 0;">
                <div style="font-size:34px;font-weight:bold;letter-spacing:8px;color:#2563eb;">
                  ${otp}
                </div>
                <p style="color:#6b7280;">Expires in 10 minutes</p>
              </div>

              <p>
                Once verified, you'll be able to:
                <ul>
                  <li>Create and manage projects</li>
                  <li>Collaborate with your team in real-time chat</li>
                  <li>Generate sprint plans using AI Sprint Architect</li>
                </ul>
              </p>

              <div style="background:#fef3c7;padding:15px;border-radius:6px;">
                ⚠️ Never share this code with anyone.
              </div>

              <p>If you didn’t request this, you can safely ignore this email.</p>
            </div>

            <div style="text-align:center;padding:15px;font-size:13px;color:#6b7280;">
              © 2025 ${siteName} • Built for smarter agile teams
            </div>
          </div>
        </body>
      </html>
    `;

        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || `"${siteName}" <mycrewmanager.ml@gmail.com>`,
                to: email,
                subject: `Verify your account - ${siteName}`,
                html: htmlContent
            });

            logger.info(`OTP email sent to: ${email}`);
            return true;
        } catch (error) {
            logger.error(`Failed to send OTP email to ${email}:`, error);
            return false;
        }
    }

    /**
     * Send welcome email
     */
    static async sendWelcomeEmail(email, firstName) {
        if (!this.transporter) {
            logger.error('Email service not initialized');
            return false;
        }

        const siteName = process.env.SITE_NAME || 'MyCrewManager';
        const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

        const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
          <div style="max-width:600px;margin:auto;background:white;border-radius:10px;overflow:hidden;">
            
            <div style="background:#10b981;color:white;padding:20px;text-align:center;">
              <h1>🚀 Welcome to ${siteName}</h1>
            </div>

            <div style="padding:30px;">
              <h2>Hello ${firstName || 'there'}!</h2>

              <p>Your account is now fully verified and ready to go 🎉</p>

              <p>Inside ${siteName}, you can:</p>
              <ul>
                <li>📌 Manage projects and backlogs</li>
                <li>⚡ Generate sprint plans using AI Sprint Architect</li>
                <li>💬 Collaborate with your team via real-time chat</li>
                <li>👥 Organize teams and roles efficiently</li>
              </ul>

              <div style="text-align:center;margin:30px 0;">
                <a href="${siteUrl}" 
                   style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">
                  Go to Dashboard
                </a>
              </div>

              <p>Start building smarter workflows today.</p>
            </div>

            <div style="text-align:center;padding:15px;font-size:13px;color:#6b7280;">
              © 2025 ${siteName} • Empowering agile development teams
            </div>
          </div>
        </body>
      </html>
    `;

        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || `"${siteName}" <mycrewmanager.ml@gmail.com>`,
                to: email,
                subject: `Welcome to ${siteName}!`,
                html: htmlContent
            });

            logger.info(`Welcome email sent to: ${email}`);
            return true;
        } catch (error) {
            logger.error(`Failed to send welcome email to ${email}:`, error);
            return false;
        }
    }
}

// Create and export singleton instance
const emailService = new EmailService();
export { emailService };
