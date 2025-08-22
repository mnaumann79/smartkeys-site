"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

type Props = {
  text: string;
  className?: string;
  /** Optional custom messages */
  copiedMessage?: string; // default: "Copied"
  label?: string;         // default: "Copy to clipboard"
  /** How long (ms) to show the “copied” state */
  durationMs?: number;    // default: 1500
};

export default function CopyButton({
  text,
  className,
  copiedMessage = "Copied",
  label = "Copy to clipboard",
  durationMs = 1500,
}: Props) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), durationMs);
    } catch {
      // Fallback for older browsers (very rare in your audience)
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), durationMs);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={handleCopy}
      aria-label={label}
      // Optional: prevent double clicks while “copied” is shown
      disabled={copied}
      aria-disabled={copied}
    >
      {copied ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <Copy className="h-4 w-4" aria-hidden />
      )}

      {/* Visually hidden static label so the button has a stable accessible name */}
      <span className="sr-only">{label}</span>

      {/* Live region: announces only when state changes to 'copied' */}
      <span role="status" className="sr-only">
        {copied ? copiedMessage : ""}
      </span>
    </Button>
  );
}
