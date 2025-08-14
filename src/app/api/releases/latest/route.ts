import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/storage/public-url";

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("releases")
    .select("id, version, notes, file_path, sha256, published_at")
    .eq("is_latest", true)
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ...data,
    url: publicStorageUrl(data.file_path),
  });
}
