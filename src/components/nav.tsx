"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useState } from "react";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`px-2 py-1 text-sm rounded-md ${active ? "bg-muted" : "hover:bg-muted/60"}`}
    >
      {children}
    </Link>
  );
}

export default function Nav() {
  const { setTheme } = useTheme();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <nav className="mx-auto max-w-6xl flex items-center justify-between p-3">
        <Link href="/" className="font-bold">SmartKeys</Link>

        <div className="flex items-center gap-2">
          <NavLink href="/pricing">Pricing</NavLink>
          <NavLink href="/download">Download</NavLink>
          <NavLink href="/dashboard">Dashboard</NavLink>

          <Button
            variant="outline"
            size="icon"
            aria-label="Toggle theme"
            onClick={() =>
              setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")
            }
          >
            {/* Always render both; CSS decides visibility. Identical markup on server/client. */}
            <Sun className="hidden dark:inline" size={16} aria-hidden />
            <Moon className="inline dark:hidden" size={16} aria-hidden />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button
            variant="ghost"
            onClick={async () => {
              setBusy(true);
              await supabase.auth.signOut();
              setBusy(false);
              router.push("/");
            }}
            disabled={busy}
          >
            Sign out
          </Button>
        </div>
      </nav>
    </header>
  );
}
