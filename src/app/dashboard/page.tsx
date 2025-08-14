import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?redirect=/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
        {JSON.stringify({ user: { id: user.id, email: user.email }, profile }, null, 2)}
      </pre>
      <div className="mt-4">
        <Link href="/dashboard/licenses">
          <Button variant="outline">Manage licenses</Button>
        </Link>
      </div>
    </main>
  );
}
