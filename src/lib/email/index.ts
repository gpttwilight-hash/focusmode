import "server-only";

import { devEmailProvider } from "./dev-provider";
import { createResendEmailProvider } from "./resend-provider";
import type { EmailProvider } from "./types";

export function getEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (apiKey && from) {
    return createResendEmailProvider(apiKey, from);
  }

  return devEmailProvider;
}
