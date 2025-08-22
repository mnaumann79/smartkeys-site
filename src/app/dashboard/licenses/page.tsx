import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import CopyButton from "@/components/buttons/copy-button";
import { issueTestLicense, revokeLicense, unbindDevice } from "./actions";
import { FormSubmitButton } from "@/components/buttons/form-submit-button";

type Activation = { device_id: string; device_name: string; activated_at: string };
type License = {
  id: string;
  license_key: string;
  status: string;
  source: string;
  created_at: string;
  activation: Activation | null;
};

export default async function LicensesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <p className="text-sm text-muted-foreground">
          You’re not signed in.{" "}
          <a
            className="underline"
            href="/signin?redirect=/dashboard/licenses"
          >
            Sign in
          </a>
        </p>
      </main>
    );
  }

  const { data: raw } = await supabase
    .from("licenses")
    .select(
      `
        id,
        license_key,
        status,
        source,
        created_at,
        activation:activations!activations_license_id_fkey(
          device_id, 
          device_name, 
          activated_at
        )
      `
    )
    .order("created_at", { ascending: false });

  const licenses: License[] = (raw ?? []).map(r => ({
    id: r.id,
    license_key: r.license_key,
    status: r.status,
    source: r.source,
    created_at: r.created_at,
    activation: Array.isArray(r.activation) ? r.activation[0] ?? null : r.activation ?? null,
  }));

  async function createDevLicense() {
    "use server";
    await issueTestLicense();
  }

  async function revoke(id: string) {
    "use server";
    await revokeLicense(id);
  }

  async function unbind(id: string) {
    "use server";
    await unbindDevice(id);
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Your Licenses</h1>

      <Card>
        <CardContent className="p-4 space-y-3">
          <form action={createDevLicense}>
            <FormSubmitButton
              pendingText="Creating…"
              variant="default"
              className="min-w-[11rem]"
            >
              Create test license (dev only)
            </FormSubmitButton>
          </form>

          <div className="text-sm text-muted-foreground">
            Use for local testing. We’ll wire real issuing via Stripe later.
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {(licenses ?? []).map(l => {
          const a = l.activation;
          return (
            <Card key={l.id}>
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-sm">Key · {l.source}</div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs">{l.license_key}</code>
                    <CopyButton text={l.license_key} />
                  </div>

                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(l.created_at).toLocaleString()} · {l.status}
                  </div>

                  <div className="text-xs mt-1">
                    {a ? (
                      <>
                        <span className="font-medium">Activated:</span> {a.device_name ?? a.device_id} ·{" "}
                        {new Date(a.activated_at).toLocaleString()}
                      </>
                    ) : (
                      <span className="text-muted-foreground">Not activated yet</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-row gap-2">
                  {l.status === "active" && l.activation && (
                    <form action={unbind.bind(null, l.id)}>
                      <FormSubmitButton
                        variant="outline"
                        pendingText="Unbinding…"
                        className="min-w-[8.5rem]"
                      >
                        Unbind device
                      </FormSubmitButton>
                    </form>
                  )}
                  {l.status === "active" && (
                    <form action={revoke.bind(null, l.id)}>
                      <FormSubmitButton
                        variant="outline"
                        pendingText=""
                        className="min-w-[8.5rem]"
                      >
                        Revoke
                      </FormSubmitButton>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}{" "}
        {(!licenses || licenses.length === 0) && <div className="text-sm text-muted-foreground">No licenses yet.</div>}
      </div>
    </main>
  );
}
