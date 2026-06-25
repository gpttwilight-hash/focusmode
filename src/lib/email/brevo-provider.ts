import "server-only";

import type { EmailProvider } from "./types";

type BrevoEmailProviderInput = {
  apiKey: string;
  from: string;
};

type Sender = {
  email: string;
  name?: string;
};

export function createBrevoEmailProvider(input: BrevoEmailProviderInput): EmailProvider {
  return {
    async sendVerificationCode(message) {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": input.apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: parseSender(input.from),
          to: [{ email: message.to }],
          subject: "Your FocusFlow verification code",
          htmlContent: renderVerificationEmail(message.code),
          textContent: `Your FocusFlow verification code is ${message.code}. This code expires in 10 minutes.`,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Brevo email failed with ${response.status}: ${body}`);
      }
    },
  };
}

function parseSender(value: string): Sender {
  const match = value.match(/^(.*)<(.+)>$/);

  if (!match) {
    return { email: value.trim() };
  }

  return {
    name: match[1].trim().replace(/^"|"$/g, ""),
    email: match[2].trim(),
  };
}

function renderVerificationEmail(code: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#080f0e;color:rgba(255,255,255,0.92);font-family:Inter,Arial,sans-serif;">
    <div style="padding:32px 16px;">
      <div style="max-width:440px;margin:0 auto;background:rgba(8,26,22,0.88);border:1px solid rgba(16,185,129,0.25);border-radius:18px;padding:28px;box-shadow:0 18px 60px rgba(0,0,0,0.35);">
        <div style="font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#10b981;margin-bottom:18px;">FocusFlow</div>
        <h1 style="font-size:24px;line-height:1.2;margin:0 0 10px;">Verify your email</h1>
        <p style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.62);margin:0 0 24px;">Use this code to finish creating your FocusFlow account.</p>
        <div style="font-family:'JetBrains Mono','SFMono-Regular',Consolas,monospace;font-size:34px;letter-spacing:0.18em;color:#34d399;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.22);border-radius:14px;padding:18px;text-align:center;">${code}</div>
        <p style="font-size:12px;line-height:1.6;color:rgba(255,255,255,0.38);margin:22px 0 0;">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
      </div>
    </div>
  </body>
</html>`;
}
