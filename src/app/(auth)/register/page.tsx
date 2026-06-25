"use client";

import { Button } from "@/components/ui/button";
import { registerAction } from "@/lib/auth/actions";
import Link from "next/link";
import { useActionState } from "react";
import { GoogleSignInButton } from "../GoogleSignInButton";

const initialState = { ok: false, message: "" };

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, initialState);

  return (
    <form action={action} className="glass-heavy w-full max-w-sm p-7">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ff-emerald)]">
        FocusFlow
      </p>
      <h1 className="mb-2 text-2xl font-semibold text-[var(--ff-text-primary)]">
        Create account
      </h1>
      <p className="mb-6 text-sm leading-6 text-[var(--ff-text-secondary)]">
        Save your focus history, music, and activity stats.
      </p>
      <div className="mb-5">
        <GoogleSignInButton />
      </div>
      <div className="mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--ff-border)]" />
        <span className="text-xs uppercase tracking-[0.16em] text-[var(--ff-text-tertiary)]">
          or
        </span>
        <div className="h-px flex-1 bg-[var(--ff-border)]" />
      </div>
      <label className="mb-4 block">
        <span className="mb-2 block text-sm text-[var(--ff-text-secondary)]">Email</span>
        <input
          name="email"
          type="email"
          required
          className="h-11 w-full rounded-xl border border-[var(--ff-border)] bg-[var(--ff-glass-02)] px-3 text-sm outline-none focus:border-[var(--ff-border-accent)]"
        />
      </label>
      <label className="mb-4 block">
        <span className="mb-2 block text-sm text-[var(--ff-text-secondary)]">Password</span>
        <input
          name="password"
          type="password"
          minLength={8}
          required
          className="h-11 w-full rounded-xl border border-[var(--ff-border)] bg-[var(--ff-glass-02)] px-3 text-sm outline-none focus:border-[var(--ff-border-accent)]"
        />
      </label>
      {state.message && <p className="mb-4 text-sm text-[var(--ff-error)]">{state.message}</p>}
      <Button className="h-11 w-full rounded-xl" disabled={pending}>
        {pending ? "Creating..." : "Create account"}
      </Button>
      <p className="mt-5 text-center text-sm text-[var(--ff-text-secondary)]">
        Already have an account?{" "}
        <Link className="text-[var(--ff-emerald)]" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
