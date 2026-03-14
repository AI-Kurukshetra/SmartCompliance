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
      aria-busy={pending}
      className={cn(
        "btn-primary rounded-2xl px-5 py-3 text-[11px]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {pending ? <BrandLoader compact /> : null}
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
