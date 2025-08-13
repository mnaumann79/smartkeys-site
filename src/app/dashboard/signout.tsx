"use client";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SignOut() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/");
      }}
    >
      Sign out
    </Button>
  );
}
