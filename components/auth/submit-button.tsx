"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { BrandLoader } from "@/components/ui/brand-loader";

type AuthSubmitButtonProps = {
  className?: string;
  disabled?: boolean;
  idleLabel: string;
  pendingLabel: string;
};

export function AuthSubmitButton({
  className,
  disabled = false,
  idleLabel,
  pendingLabel,
}: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-shell transition hover:bg-ink/92 disabled:cursor-not-allowed disabled:bg-ink/45",
        className,
      )}
    >
      {pending ? <BrandLoader compact /> : null}
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
