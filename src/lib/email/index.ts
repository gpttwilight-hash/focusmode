import "server-only";

import { getEmailProviderKind } from "./config";
import { devEmailProvider } from "./dev-provider";
import { createResendEmailProvider } from "./resend-provider";
import type { EmailProvider } from "./types";

export function getEmailProvider(): EmailProvider {
  const kind = getEmailProviderKind(process.env);

  if (kind === "resend") {
    return createResendEmailProvider(process.env.RESEND_API_KEY!, process.env.EMAIL_FROM!);
  }

  if (kind === "brevo") {
    return {
      async sendVerificationCode(input) {
        const { createBrevoEmailProvider } = await import("./brevo-provider");
        const provider = createBrevoEmailProvider({
          apiKey: process.env.BREVO_API_KEY!,
          from: process.env.EMAIL_FROM!,
        });

        await provider.sendVerificationCode(input);
      },
    };
  }

  return devEmailProvider;
}
