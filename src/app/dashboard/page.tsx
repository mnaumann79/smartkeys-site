import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOut from "@/app/dashboard/signout";

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin?redirect=/dashboard");

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <p className="text-muted-foreground">Signed in as {user.email}</p>
      <SignOut />
    </main>
  );
}
