"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import Image from "next/image";

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

  const [user, setUser] = useState<User | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUser(user);
    };
    fetchUser();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <nav className="mx-auto max-w-6xl flex items-center justify-between p-3">
        <Link
          href="/"
          className="font-bold"
        >
          SmartKeys
        </Link>

        <div className="flex items-center gap-2">
          <NavLink href="/pricing">Pricing</NavLink>
          <NavLink href="/download">Download</NavLink>
          <NavLink href="/dashboard">Dashboard</NavLink>

          <Button
            variant="outline"
            size="icon"
            aria-label="Toggle theme"
            className="cursor-pointer"
            onClick={() => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")}
          >
            {/* Always render both; CSS decides visibility. Identical markup on server/client. */}
            <Sun
              className="hidden dark:inline"
              size={16}
              aria-hidden
            />
            <Moon
              className="inline dark:hidden"
              size={16}
              aria-hidden
            />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {hasMounted &&
            (user ? (
              <Button
                variant="ghost"
                size={"icon"}
                className="cursor-pointer"
                onClick={async () => {
                  setBusy(true);
                  await supabase.auth.signOut();
                  setUser(null);
                  setBusy(false);
                  router.push("/");
                }}
                disabled={busy}
              >
                <Image
                  src={user?.user_metadata?.avatar_url} 
                  alt="Sign out"
                  className="rounded-full"
                  width={24}
                  height={24}
                />
              </Button>
            ) : (
              <Link
                href="/signin"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-transparent hover:bg-muted/60"
              >
                Sign in
              </Link>
            ))}
        </div>
      </nav>
    </header>
  );
}
