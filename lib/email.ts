import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? "AIKO Board <contact@aikoboard.com>";

function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface SendConfirmationInput {
  to: string;
  participantName: string;
  eventName: string;
  eventDate: string;
  eventLieu: string;
  reference: string;
  ticketNumber: number;
  type: "badge" | "ticket";
  amount?: number;
}

export async function sendConfirmationEmail(input: SendConfirmationInput) {
  const resend = getResend();
  if (!resend) {
    console.log("[email] RESEND_API_KEY not set, skipping email");
    return null;
  }

  const ticketLabel = input.type === "ticket" ? "Ticket" : "Badge";
  const ticketNum = String(input.ticketNumber).padStart(4, "0");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#F3F2EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px">
    <!-- Header -->
    <div style="background:#0A0A0A;border-radius:16px 16px 0 0;padding:32px 32px 24px">
      <table width="100%"><tr>
        <td><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C8A951;letter-spacing:0.04em">AIKO</span></td>
        <td align="right"><span style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.4)">${ticketLabel}</span></td>
      </tr></table>
    </div>

    <!-- Body -->
    <div style="background:#FFFFFF;padding:32px;border-left:1px solid #E8E6E1;border-right:1px solid #E8E6E1">
      <p style="font-family:Georgia,serif;font-size:22px;color:#0A0A0A;margin:0 0 8px;line-height:1.3">
        Inscription confirmee !
      </p>
      <p style="font-size:14px;color:#8A8680;margin:0 0 24px;line-height:1.5">
        ${esc(input.participantName)}, votre inscription pour <strong style="color:#0A0A0A">${esc(input.eventName)}</strong> est confirmee.
      </p>

      <!-- Info card -->
      <div style="background:#F3F2EE;border-radius:12px;padding:20px;margin-bottom:24px">
        <table width="100%" style="font-size:13px;color:#0A0A0A">
          <tr>
            <td style="padding:4px 0;color:#8A8680;width:100px">Evenement</td>
            <td style="padding:4px 0;font-weight:600">${esc(String(input.eventName))}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#8A8680">Date</td>
            <td style="padding:4px 0">${esc(String(input.eventDate))}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#8A8680">Lieu</td>
            <td style="padding:4px 0">${esc(input.eventLieu)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#8A8680">Reference</td>
            <td style="padding:4px 0;font-family:monospace;color:#C8A951;font-weight:600">${esc(input.reference)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#8A8680">${ticketLabel} N°</td>
            <td style="padding:4px 0;font-family:monospace;font-weight:700;font-size:16px">${ticketNum}</td>
          </tr>
          ${input.amount && input.amount > 0 ? `
          <tr>
            <td style="padding:4px 0;color:#8A8680">Montant</td>
            <td style="padding:4px 0;font-weight:600">${new Intl.NumberFormat("fr-FR").format(input.amount)} XOF</td>
          </tr>` : ""}
        </table>
      </div>

      <p style="font-size:13px;color:#8A8680;margin:0 0 8px;line-height:1.5">
        Presentez ce QR code a l'entree pour recevoir votre badge imprime.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#0A0A0A;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center">
      <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.3);margin:0">
        AIKO Board · aikoboard.com
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: `Inscription confirmee — ${input.eventName} (${input.reference})`,
      html,
    });
    console.log(`[email] Confirmation sent to ${input.to}: ${result.data?.id}`);
    return result;
  } catch (err) {
    console.error("[email] send error:", err);
    return null;
  }
}

interface SendReminderInput {
  to: string;
  participantName: string;
  eventName: string;
  eventDate: string;
  eventLieu: string;
  reference: string;
}

export async function sendReminderEmail(input: SendReminderInput) {
  const resend = getResend();
  if (!resend) {
    console.log("[email] RESEND_API_KEY not set, skipping reminder");
    return null;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#F3F2EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px">
    <div style="background:#0A0A0A;border-radius:16px 16px 0 0;padding:32px 32px 24px">
      <table width="100%"><tr>
        <td><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C8A951;letter-spacing:0.04em">AIKO</span></td>
        <td align="right"><span style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.4)">Rappel</span></td>
      </tr></table>
    </div>

    <div style="background:#FFFFFF;padding:32px;border-left:1px solid #E8E6E1;border-right:1px solid #E8E6E1">
      <p style="font-family:Georgia,serif;font-size:22px;color:#0A0A0A;margin:0 0 8px;line-height:1.3">
        C'est demain !
      </p>
      <p style="font-size:14px;color:#8A8680;margin:0 0 24px;line-height:1.5">
        ${esc(input.participantName)}, <strong style="color:#0A0A0A">${esc(input.eventName)}</strong> commence demain.
      </p>

      <div style="background:#F3F2EE;border-radius:12px;padding:20px;margin-bottom:24px">
        <table width="100%" style="font-size:13px;color:#0A0A0A">
          <tr>
            <td style="padding:4px 0;color:#8A8680;width:100px">Date</td>
            <td style="padding:4px 0;font-weight:600">${esc(String(input.eventDate))}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#8A8680">Lieu</td>
            <td style="padding:4px 0">${esc(input.eventLieu)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#8A8680">Reference</td>
            <td style="padding:4px 0;font-family:monospace;color:#C8A951;font-weight:600">${esc(input.reference)}</td>
          </tr>
        </table>
      </div>

      <p style="font-size:13px;color:#8A8680;margin:0;line-height:1.5">
        N'oubliez pas votre QR code (imprime ou sur telephone) pour recevoir votre badge a l'entree. A demain !
      </p>
    </div>

    <div style="background:#0A0A0A;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center">
      <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.3);margin:0">
        AIKO Board · aikoboard.com
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: `Rappel — ${input.eventName} commence demain`,
      html,
    });
    console.log(`[email] Reminder sent to ${input.to}: ${result.data?.id}`);
    return result;
  } catch (err) {
    console.error("[email] reminder error:", err);
    return null;
  }
}

interface SendPasswordResetInput {
  to: string;
  name: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail(input: SendPasswordResetInput) {
  const resend = getResend();
  if (!resend) {
    console.log("[email] RESEND_API_KEY not set, skipping reset email");
    return null;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#F3F2EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px">
    <div style="background:#0A0A0A;border-radius:16px 16px 0 0;padding:32px 32px 24px">
      <table width="100%"><tr>
        <td><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C8A951;letter-spacing:0.04em">AIKO</span></td>
        <td align="right"><span style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.4)">Securite</span></td>
      </tr></table>
    </div>
    <div style="background:#FFFFFF;padding:32px;border-left:1px solid #E8E6E1;border-right:1px solid #E8E6E1">
      <p style="font-family:Georgia,serif;font-size:22px;color:#0A0A0A;margin:0 0 8px;line-height:1.3">
        Reinitialisation du mot de passe
      </p>
      <p style="font-size:14px;color:#8A8680;margin:0 0 24px;line-height:1.5">
        ${esc(input.name)}, vous avez demande la reinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${input.resetUrl}" style="display:inline-block;background:#C8A951;color:#0A0A0A;font-weight:600;font-size:14px;padding:14px 32px;border-radius:999px;text-decoration:none">
          Reinitialiser mon mot de passe
        </a>
      </div>
      <p style="font-size:12px;color:#8A8680;margin:0;line-height:1.5">
        Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
      </p>
    </div>
    <div style="background:#0A0A0A;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center">
      <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.3);margin:0">
        AIKO Board · aikoboard.com
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: "Reinitialisation de votre mot de passe — AIKO Board",
      html,
    });
    console.log(`[email] Password reset sent to ${input.to}: ${result.data?.id}`);
    return result;
  } catch (err) {
    console.error("[email] reset email error:", err);
    return null;
  }
}

interface SendWelcomeInput {
  to: string;
  name: string;
  role: string;
  loginUrl: string;
}

export async function sendWelcomeEmail(input: SendWelcomeInput) {
  const resend = getResend();
  if (!resend) {
    console.log("[email] RESEND_API_KEY not set, skipping welcome email");
    return null;
  }

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrateur",
    SUPERVISEUR: "Superviseur",
    CONCIERGE: "Concierge",
    AGENT_INSTITUTIONNEL: "Agent Institutionnel",
    SCANNER: "Scanner",
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#F3F2EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px">
    <div style="background:#0A0A0A;border-radius:16px 16px 0 0;padding:32px 32px 24px">
      <table width="100%"><tr>
        <td><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C8A951;letter-spacing:0.04em">AIKO</span></td>
        <td align="right"><span style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.4)">Bienvenue</span></td>
      </tr></table>
    </div>
    <div style="background:#FFFFFF;padding:32px;border-left:1px solid #E8E6E1;border-right:1px solid #E8E6E1">
      <p style="font-family:Georgia,serif;font-size:22px;color:#0A0A0A;margin:0 0 8px;line-height:1.3">
        Bienvenue sur AIKO Board
      </p>
      <p style="font-size:14px;color:#8A8680;margin:0 0 24px;line-height:1.5">
        ${esc(input.name)}, votre compte <strong style="color:#0A0A0A">${esc(roleLabels[input.role] || input.role)}</strong> a ete cree avec succes.
      </p>
      <div style="background:#F3F2EE;border-radius:12px;padding:20px;margin-bottom:24px">
        <table width="100%" style="font-size:13px;color:#0A0A0A">
          <tr>
            <td style="padding:4px 0;color:#8A8680;width:100px">Email</td>
            <td style="padding:4px 0;font-weight:600">${input.to}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#8A8680">Role</td>
            <td style="padding:4px 0;font-weight:600">${roleLabels[input.role] || input.role}</td>
          </tr>
        </table>
      </div>
      <div style="text-align:center;margin:24px 0">
        <a href="${input.loginUrl}" style="display:inline-block;background:#C8A951;color:#0A0A0A;font-weight:600;font-size:14px;padding:14px 32px;border-radius:999px;text-decoration:none">
          Se connecter
        </a>
      </div>
      <p style="font-size:12px;color:#8A8680;margin:0;line-height:1.5">
        Connectez-vous avec l'email et le mot de passe qui vous ont ete communiques.
      </p>
    </div>
    <div style="background:#0A0A0A;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center">
      <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.3);margin:0">
        AIKO Board · aikoboard.com
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: "Bienvenue sur AIKO Board — Votre compte est pret",
      html,
    });
    console.log(`[email] Welcome sent to ${input.to}: ${result.data?.id}`);
    return result;
  } catch (err) {
    console.error("[email] welcome error:", err);
    return null;
  }
}

interface SendAdminNotificationInput {
  type: "new_registration" | "payment_received";
  eventName: string;
  participantName: string;
  reference: string;
  amount?: number;
}

export async function sendAdminNotificationEmail(input: SendAdminNotificationInput) {
  const resend = getResend();
  if (!resend) return null;

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@aiko.com";
  const isPayment = input.type === "payment_received";

  const subject = isPayment
    ? `Paiement recu — ${input.eventName} (${new Intl.NumberFormat("fr-FR").format(input.amount || 0)} XOF)`
    : `Nouvelle inscription — ${input.eventName}`;

  const title = isPayment ? "Paiement recu" : "Nouvelle inscription";
  const badge = isPayment ? "Paiement" : "Inscription";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#F3F2EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px">
    <div style="background:#0A0A0A;border-radius:16px 16px 0 0;padding:32px 32px 24px">
      <table width="100%"><tr>
        <td><span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#C8A951;letter-spacing:0.04em">AIKO</span></td>
        <td align="right"><span style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.4)">${badge}</span></td>
      </tr></table>
    </div>
    <div style="background:#FFFFFF;padding:32px;border-left:1px solid #E8E6E1;border-right:1px solid #E8E6E1">
      <p style="font-family:Georgia,serif;font-size:22px;color:#0A0A0A;margin:0 0 8px;line-height:1.3">
        ${title}
      </p>
      <div style="background:#F3F2EE;border-radius:12px;padding:20px;margin-bottom:24px">
        <table width="100%" style="font-size:13px;color:#0A0A0A">
          <tr>
            <td style="padding:4px 0;color:#8A8680;width:110px">Evenement</td>
            <td style="padding:4px 0;font-weight:600">${esc(String(input.eventName))}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#8A8680">Participant</td>
            <td style="padding:4px 0">${esc(input.participantName)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#8A8680">Reference</td>
            <td style="padding:4px 0;font-family:monospace;color:#C8A951;font-weight:600">${esc(input.reference)}</td>
          </tr>
          ${input.amount && input.amount > 0 ? `
          <tr>
            <td style="padding:4px 0;color:#8A8680">Montant</td>
            <td style="padding:4px 0;font-weight:700;font-size:16px">${new Intl.NumberFormat("fr-FR").format(input.amount)} XOF</td>
          </tr>` : ""}
        </table>
      </div>
    </div>
    <div style="background:#0A0A0A;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center">
      <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.3);margin:0">
        AIKO Board · aikoboard.com
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: adminEmail,
      subject,
      html,
    });
    console.log(`[email] Admin notification sent: ${result.data?.id}`);
    return result;
  } catch (err) {
    console.error("[email] admin notification error:", err);
    return null;
  }
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
