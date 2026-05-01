import "server-only";

type ClientAccessEmailMode = "onboarding" | "password_reset";

type BuildClientAccessEmailInput = {
  clientName: string;
  dashboardUrl: string;
  eventDate: string | null;
  eventTitle: string;
  eventType: string | null;
  loginEmail: string;
  mode: ClientAccessEmailMode;
  planLabel: string;
  recipientName?: string | null;
  replyToEmail?: string | null;
  roleLabel: string;
  supportEmail?: string | null;
  temporaryPassword: string;
};

type ClientAccessEmailContent = {
  html: string;
  subject: string;
  text: string;
};

export function buildClientAccessEmail(
  input: BuildClientAccessEmailInput,
): ClientAccessEmailContent {
  const recipientFirstName = getFirstName(input.recipientName ?? input.clientName);
  const greeting = getEventGreeting(input.eventType);
  const roleCopy = input.roleLabel || "Client owner";
  const supportEmail = input.supportEmail ?? input.replyToEmail ?? "WebSerbisyo RSVP";
  const eventDateLabel = input.eventDate ? formatDate(input.eventDate) : "To be announced";
  const ctaLabel = input.mode === "password_reset" ? "Open dashboard" : "Go to your dashboard";
  const subject =
    input.mode === "password_reset"
      ? "Your new WebSerbisyo RSVP temporary password"
      : "Your WebSerbisyo RSVP dashboard account is ready";
  const eyebrow = input.mode === "password_reset" ? "Account access reset" : "Dashboard ready";
  const intro =
    input.mode === "password_reset"
      ? "Your dashboard access was reset. Use the details below to sign in with a new temporary password."
      : "Your RSVP dashboard account is ready. Review your event details, website status, package, and next steps in one place.";
  const securityNote =
    input.mode === "password_reset"
      ? "This is a new temporary password. If you did not request this update, reply to this email right away."
      : "Use the details below to sign in. If you need a new password later, use Forgot password from the sign-in page or reply to this email for help.";

  const rows = [
    ["Login email", escapeHtml(input.loginEmail)],
    ["Temporary password", escapeHtml(input.temporaryPassword)],
    ["Package", escapeHtml(input.planLabel)],
    ["Role", escapeHtml(roleCopy)],
    ["Event", escapeHtml(input.eventTitle)],
    ["Event date", escapeHtml(eventDateLabel)],
  ]
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 0 0 10px; font-size: 12px; color: #7b6d63; text-transform: uppercase; letter-spacing: 0.08em;">${label}</td>
          <td style="padding: 0 0 10px; text-align: right; font-size: 14px; color: #1f2937; font-weight: 600;">${value}</td>
        </tr>
      `,
    )
    .join("");

  const nextSteps = [
    "Review your event summary and dashboard details.",
    "Check your website status, package coverage, and payment record.",
    "Use Forgot password anytime from the sign-in page if you need a new temporary password.",
  ]
    .map(
      (step, index) => `
        <tr>
          <td valign="top" style="padding: 0 10px 10px 0; color: #e86d52; font-weight: 700;">${index + 1}.</td>
          <td style="padding: 0 0 10px; color: #4b5563; font-size: 14px; line-height: 1.6;">${escapeHtml(step)}</td>
        </tr>
      `,
    )
    .join("");

  const html = `
    <div style="margin:0; padding:0; background:#f6efe6; font-family:Arial,Helvetica,sans-serif; color:#1f2937;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6efe6; padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; margin:0 auto;">
              <tr>
                <td style="padding:0 20px 18px; text-align:center;">
                  <div style="display:inline-flex; gap:8px;">
                    <span style="display:inline-block; width:8px; height:8px; border-radius:999px; background:#f0c987;"></span>
                    <span style="display:inline-block; width:8px; height:8px; border-radius:999px; background:#e86d52;"></span>
                    <span style="display:inline-block; width:8px; height:8px; border-radius:999px; background:#d7b56d;"></span>
                    <span style="display:inline-block; width:8px; height:8px; border-radius:999px; background:#f2d8b7;"></span>
                    <span style="display:inline-block; width:8px; height:8px; border-radius:999px; background:#e86d52;"></span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:0 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fffdf9; border:1px solid #eadfce; border-radius:24px; overflow:hidden;">
                    <tr>
                      <td style="padding:32px 28px 20px;">
                        <div style="font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:#a17345; font-weight:700;">${eyebrow}</div>
                        <h1 style="margin:14px 0 10px; font-size:30px; line-height:1.2; color:#201a17;">${escapeHtml(greeting)}, ${escapeHtml(recipientFirstName)}!</h1>
                        <p style="margin:0; font-size:15px; line-height:1.7; color:#4b5563;">${escapeHtml(intro)}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 28px 24px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f1e8; border:1px solid #ebdfcf; border-radius:18px; padding:18px;">
                          <tr>
                            <td style="padding:0 0 14px; font-size:13px; color:#8c6b4f; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">Account details</td>
                          </tr>
                          ${rows}
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 28px 12px;">
                        <div style="padding:16px 18px; background:#fff7ef; border:1px solid #f2d2c3; border-radius:18px;">
                          <div style="font-size:13px; color:#9a593f; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px;">Security note</div>
                          <div style="font-size:14px; line-height:1.7; color:#4b5563;">${escapeHtml(securityNote)}</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:12px 28px 28px;">
                        <a href="${escapeAttribute(input.dashboardUrl)}" style="display:inline-block; background:#e86d52; color:#fffdf9; text-decoration:none; font-weight:700; border-radius:999px; padding:14px 24px;">${ctaLabel}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 28px 24px;">
                        <div style="font-size:13px; color:#8c6b4f; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px;">Next steps</div>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          ${nextSteps}
                        </table>
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
    `${greeting}, ${recipientFirstName}!`,
    "",
    intro,
    "",
    `Login email: ${input.loginEmail}`,
    `Temporary password: ${input.temporaryPassword}`,
    `Package: ${input.planLabel}`,
    `Role: ${roleCopy}`,
    `Event: ${input.eventTitle}`,
    `Event date: ${eventDateLabel}`,
    "",
    `Dashboard: ${input.dashboardUrl}`,
    "",
    securityNote,
    "",
    "Next steps:",
    "1. Review your event summary and dashboard details.",
    "2. Check your website status, package coverage, and payment record.",
    "3. Use Forgot password from the sign-in page if you need a new temporary password.",
    "",
    `Need help? Reply to this email or contact ${supportEmail}.`,
  ].join("\n");

  return {
    html,
    subject,
    text,
  };
}

function getEventGreeting(eventType: string | null) {
  switch (eventType) {
    case "wedding":
      return "Happy Wedding Planning";
    case "debut":
      return "Happy Debut Celebration";
    case "birthday":
      return "Happy Birthday";
    case "baptism":
      return "Happy Baptism Celebration";
    case "anniversary":
      return "Happy Anniversary";
    case "reunion":
      return "Happy Reunion";
    case "corporate":
      return "Your Event Portal Is Ready";
    default:
      return "Your RSVP Website Is Ready";
  }
}

function getFirstName(value: string) {
  const trimmed = value.trim();

  return trimmed.split(/\s+/)[0] || "there";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T00:00:00.000Z`));
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
