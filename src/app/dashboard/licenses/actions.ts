"use server";

import { createClient } from "@/lib/supabase/server";
import { generateLicenseKey } from "@/lib/licenses/key";
import { revalidatePath } from "next/cache";

export async function issueTestLicense() {
  if (process.env.NODE_ENV !== "development") throw new Error("dev-only");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("auth");
  const key = generateLicenseKey();
  const { error } = await supabase.from("licenses").insert({
    user_id: user.id,
    license_key: key,
    status: "active",
    source: "dev"
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/licenses");
}

export async function revokeLicense(id: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("auth");
  const { error } = await supabase.from("licenses").update({ status: "revoked" }).eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/licenses");
}
