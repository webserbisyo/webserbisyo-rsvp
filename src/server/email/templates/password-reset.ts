import "server-only";

type BuildPasswordResetEmailInput = {
  clientFirstName: string;
  resetUrl: string;
  supportEmail?: string | null;
};

export function buildPasswordResetEmail(input: BuildPasswordResetEmailInput) {
  const subject = "Reset your WebSerbisyo RSVP password";
  const supportEmail = input.supportEmail ?? "WebSerbisyo RSVP";

  const html = `
    <div style="margin:0; padding:0; background:#f6efe6; font-family:Arial,Helvetica,sans-serif; color:#1f2937;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6efe6; padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px; margin:0 auto;">
              <tr>
                <td style="padding:0 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fffdf9; border:1px solid #eadfce; border-radius:24px;">
                    <tr>
                      <td style="padding:32px 28px 18px;">
                        <div style="font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:#a17345; font-weight:700;">Password reset</div>
                        <h1 style="margin:14px 0 10px; font-size:30px; line-height:1.2; color:#201a17;">Need a new password, ${escapeHtml(input.clientFirstName)}?</h1>
                        <p style="margin:0; font-size:15px; line-height:1.7; color:#4b5563;">
                          We received a request to reset your WebSerbisyo RSVP dashboard password.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 28px 24px;">
                        <a href="${escapeAttribute(input.resetUrl)}" style="display:inline-block; background:#e86d52; color:#fffdf9; text-decoration:none; font-weight:700; border-radius:999px; padding:14px 24px;">Reset password</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 28px 28px;">
                        <div style="padding:16px 18px; background:#fff7ef; border:1px solid #f2d2c3; border-radius:18px; font-size:14px; line-height:1.7; color:#4b5563;">
                          This link is time-limited. If you did not request this password reset, you can safely ignore this email.
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 28px 30px;">
                        <p style="margin:0; font-size:13px; line-height:1.7; color:#6b7280;">
                          Need help? Reply to this email or contact ${escapeHtml(supportEmail)}.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = [
    `Need a new password, ${input.clientFirstName}?`,
    "",
    "We received a request to reset your WebSerbisyo RSVP dashboard password.",
    "",
    `Reset password: ${input.resetUrl}`,
    "",
    "This link is time-limited. If you did not request this password reset, you can safely ignore this email.",
    "",
    `Need help? Reply to this email or contact ${supportEmail}.`,
  ].join("\n");

  return { html, subject, text };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value);
}
