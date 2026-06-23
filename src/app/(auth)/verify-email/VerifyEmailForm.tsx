"use client";

import { Button } from "@/components/ui/button";
import { resendVerificationAction, verifyEmailAction } from "@/lib/auth/actions";
import { useActionState } from "react";

const initialState = { ok: false, message: "" };

type Props = {
  email: string;
};

export function VerifyEmailForm({ email }: Props) {
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyEmailAction,
    initialState
  );
  const [resendState, resendAction, resendPending] = useActionState(
    resendVerificationAction,
    initialState
  );

  return (
    <div className="glass-heavy w-full max-w-sm p-7">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ff-emerald)]">
        FocusFlow
      </p>
      <h1 className="mb-2 text-2xl font-semibold text-[var(--ff-text-primary)]">
        Verify email
      </h1>
      <p className="mb-6 text-sm leading-6 text-[var(--ff-text-secondary)]">
        Enter the 6-digit code sent to {email || "your email"}.
      </p>
      <form action={verifyAction}>
        <input name="email" type="hidden" value={email} />
        <label className="mb-4 block">
          <span className="mb-2 block text-sm text-[var(--ff-text-secondary)]">Code</span>
          <input
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            className="h-12 w-full rounded-xl border border-[var(--ff-border)] bg-[var(--ff-glass-02)] px-3 text-center font-mono text-xl tracking-[0.2em] outline-none focus:border-[var(--ff-border-accent)]"
          />
        </label>
        {verifyState.message && (
          <p className="mb-4 text-sm text-[var(--ff-error)]">{verifyState.message}</p>
        )}
        <Button className="h-11 w-full rounded-xl" disabled={verifyPending}>
          {verifyPending ? "Checking..." : "Verify"}
        </Button>
      </form>
      <form action={resendAction} className="mt-3">
        <input name="email" type="hidden" value={email} />
        <button
          className="w-full text-sm text-[var(--ff-text-secondary)] hover:text-[var(--ff-emerald)]"
          disabled={resendPending}
        >
          {resendPending ? "Sending..." : "Send a new code"}
        </button>
        {resendState.message && (
          <p className="mt-3 text-center text-sm text-[var(--ff-text-secondary)]">
            {resendState.message}
          </p>
        )}
      </form>
    </div>
  );
}
