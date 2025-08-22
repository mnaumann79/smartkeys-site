"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  pendingText?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
};

/**
 * A submit button that automatically reflects the server action's pending state.
 * Disables itself while pending and swaps label (and shows a spinner).
 */
export function FormSubmitButton({ children, pendingText = "Working…", variant, size, className }: Props) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2
            className="h-4 w-4 animate-spin"
            aria-hidden
          />
          <span>{pendingText}</span>
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
