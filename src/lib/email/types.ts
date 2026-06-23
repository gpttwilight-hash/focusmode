export type SendVerificationCodeInput = {
  to: string;
  code: string;
};

export type EmailProvider = {
  sendVerificationCode(input: SendVerificationCodeInput): Promise<void>;
};
