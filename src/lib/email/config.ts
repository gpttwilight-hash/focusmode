export type EmailProviderKind = "resend" | "brevo" | "dev";

type EmailEnv = {
  RESEND_API_KEY?: string;
  BREVO_API_KEY?: string;
  EMAIL_FROM?: string;
  [key: string]: string | undefined;
};

export function getEmailProviderKind(env: EmailEnv): EmailProviderKind {
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    return "resend";
  }

  if (env.BREVO_API_KEY && env.EMAIL_FROM) {
    return "brevo";
  }

  return "dev";
}
