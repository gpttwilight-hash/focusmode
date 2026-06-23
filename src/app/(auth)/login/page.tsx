"use client";

import { Button } from "@/components/ui/button";
import { loginAction } from "@/lib/auth/actions";
import Link from "next/link";
import { useActionState } from "react";

const initialState = { ok: false, message: "" };

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="glass-heavy w-full max-w-sm p-7">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ff-emerald)]">
        FocusFlow
      </p>
      <h1 className="mb-2 text-2xl font-semibold text-[var(--ff-text-primary)]">
        Welcome back
      </h1>
      <p className="mb-6 text-sm leading-6 text-[var(--ff-text-secondary)]">
        Sign in to your focus workspace.
      </p>
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
          required
          className="h-11 w-full rounded-xl border border-[var(--ff-border)] bg-[var(--ff-glass-02)] px-3 text-sm outline-none focus:border-[var(--ff-border-accent)]"
        />
      </label>
      {state.message && <p className="mb-4 text-sm text-[var(--ff-error)]">{state.message}</p>}
      <Button className="h-11 w-full rounded-xl" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
      <p className="mt-5 text-center text-sm text-[var(--ff-text-secondary)]">
        New here?{" "}
        <Link className="text-[var(--ff-emerald)]" href="/register">
          Create account
        </Link>
      </p>
    </form>
  );
}
