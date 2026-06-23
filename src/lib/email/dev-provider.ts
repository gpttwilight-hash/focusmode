import type { EmailProvider } from "./types";

export const devEmailProvider: EmailProvider = {
  async sendVerificationCode(input) {
    console.info("[FocusFlow email:dev] Verification email");
    console.info(`To: ${input.to}`);
    console.info("Subject: Your FocusFlow verification code");
    console.info(`Code: ${input.code}`);
    console.info("This code expires in 10 minutes.");
  },
};
