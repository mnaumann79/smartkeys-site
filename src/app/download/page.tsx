import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CopyButton from "@/components/copy-button";
import { publicStorageUrl } from "@/lib/storage/public-url";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Download — SmartKeys" };

const fmt = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" });

export default async function DownloadPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("releases")
    .select("version, file_path, sha256, published_at, notes")
    .eq("is_latest", true)
    .single();

  if (!data) {
    return (
      <main className="px-6 py-16 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold">Download</h1>
        <p className="text-muted-foreground mt-2">No release found.</p>
      </main>
    );
  }

  const url = publicStorageUrl(data.file_path);

  return (
    <main className="px-6 py-16 max-w-3xl mx-auto space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Download SmartKeys</h1>
        <p className="text-muted-foreground">
          Version {data.version} · Released {fmt.format(new Date(data.published_at))}
        </p>
      </header>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="font-medium">Windows Installer (.exe)</div>
              <div className="text-sm text-muted-foreground">{data.file_path.split("/").pop()}</div>
            </div>
            <a href={url} download>
              <Button size="lg">Download</Button>
            </a>
          </div>

          <div className="text-sm">
            <div className="font-medium">SHA-256</div>
            <div className="mt-1 flex items-center gap-2">
              <code className="text-xs break-all">{data.sha256}</code>
              <CopyButton text={data.sha256} />
            </div>
          </div>

          {data.notes && (
            <div className="text-sm">
              <div className="font-medium mb-1">Notes</div>
              <p className="text-muted-foreground whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        SmartKeys supports Windows 7 and newer. If your browser warns about unknown publisher, click “More info → Run anyway”.
      </p>
    </main>
  );
}
