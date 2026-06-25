import { Button } from "@/components/ui/button";
import Link from "next/link";

export function GoogleSignInButton() {
  return (
    <Button
      asChild
      variant="outline"
      className="h-11 w-full rounded-xl border-[var(--ff-border)] bg-[var(--ff-glass-02)] text-[var(--ff-text-primary)] hover:border-[var(--ff-border-accent)] hover:bg-[var(--ff-glass-03)]"
    >
      <Link href="/auth/google/start">
        <span className="grid size-5 place-items-center rounded-full bg-white text-[13px] font-semibold text-[#1f1f1f]">
          G
        </span>
        Continue with Google
      </Link>
    </Button>
  );
}
