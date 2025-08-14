const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export function publicStorageUrl(path: string) {
  return `${base}/storage/v1/object/public/downloads/${path.replace(/^\/+/, "")}`;
}
