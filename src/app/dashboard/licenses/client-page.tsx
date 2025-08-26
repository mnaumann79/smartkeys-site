"use client";

// Client-side licenses page with React Query optimization
// Importance: Provides optimized data fetching, caching, and real-time updates

import { Card, CardContent } from "@/components/ui/card";
import CopyButton from "@/components/buttons/copy-button";
import { LoadingSpinner, LicenseCardSkeleton } from "@/components/ui/loading-spinner";
import {
  useLicenses,
  useCreateTestLicense,
  useRevokeLicense,
  useUnbindDevice,
  useDeleteLicense,
} from "@/lib/hooks/use-licenses";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LicenseWithActivationData } from "./page";

// License card component
function LicenseCard({ license }: { license: LicenseWithActivationData }) {
  const revokeMutation = useRevokeLicense();
  const unbindMutation = useUnbindDevice();
  const deleteMutation = useDeleteLicense();
  const a = license.activation;

  const handleRevoke = () => {
    revokeMutation.mutate(license.id);
  };

  const handleUnbind = () => {
    unbindMutation.mutate(license.id);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this license? This action cannot be undone.")) {
      deleteMutation.mutate(license.id);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-sm">Key · {license.source}</div>
          <div className="flex items-center gap-2">
            <code className="text-xs">{license.license_key}</code>
            <CopyButton text={license.license_key} />
          </div>

          <div className="text-xs text-muted-foreground mt-1">
            {new Date(license.created_at).toLocaleString()} · {license.status}
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
          {license.status === "active" && license.activation && (
            <Button
              onClick={handleUnbind}
              variant="outline"
              size="sm"
              disabled={unbindMutation.isPending}
              className="min-w-[8.5rem]"
            >
              {unbindMutation.isPending ? (
                <LoadingSpinner
                  size="sm"
                  text="Unbinding..."
                />
              ) : (
                "Unbind device"
              )}
            </Button>
          )}
          {license.status === "active" && (
            <Button
              onClick={handleRevoke}
              variant="outline"
              size="sm"
              disabled={revokeMutation.isPending}
              className="min-w-[8.5rem]"
            >
              {revokeMutation.isPending ? (
                <LoadingSpinner
                  size="sm"
                  text="Revoking..."
                />
              ) : (
                "Revoke"
              )}
            </Button>
          )}
          {/* Delete button - only for test licenses in development */}
          {process.env.NODE_ENV === "development" && license.source === "test" && (
            <Button
              onClick={handleDelete}
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              className="min-w-[8.5rem]"
            >
              {deleteMutation.isPending ? (
                <LoadingSpinner
                  size="sm"
                  text="Deleting..."
                />
              ) : (
                "Delete"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Error state component
function ErrorState({ error, refetch }: { error: Error; refetch: () => void }) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load licenses</h3>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <Button
          onClick={refetch}
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

// Main licenses page component
export default function LicensesClientPage() {
  const { data: licenses, isLoading, isError, error, refetch } = useLicenses();

  const createTestLicense = useCreateTestLicense();

  const handleCreateTestLicense = () => {
    createTestLicense.mutate();
  };

  // Debug logging
  console.log("Licenses state:", { licenses, isLoading, isError, error });

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Your Licenses</h1>

      <Card>
        <CardContent className="p-4 space-y-3">
          <Button
            onClick={handleCreateTestLicense}
            disabled={createTestLicense.isPending}
            className="min-w-[11rem]"
          >
            {createTestLicense.isPending ? (
              <LoadingSpinner
                size="sm"
                text="Creating..."
              />
            ) : (
              "Create test license (dev only)"
            )}
          </Button>

          <div className="text-sm text-muted-foreground">
            Use for local testing. We&apos;ll wire real issuing via Stripe later.
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading && (
          <>
            <LicenseCardSkeleton />
            <LicenseCardSkeleton />
            <LicenseCardSkeleton />
          </>
        )}

        {isError && (
          <ErrorState
            error={error}
            refetch={refetch}
          />
        )}

        {licenses && licenses.length > 0 && (
          <>
            <div className="text-sm text-muted-foreground mb-2">Found {licenses.length} license(s)</div>
            {licenses.map(license => (
              <LicenseCard
                key={license.id}
                license={license}
              />
            ))}
          </>
        )}

        {licenses && licenses.length === 0 && !isLoading && (
          <div className="text-sm text-muted-foreground text-center py-8">No licenses yet.</div>
        )}

        {!licenses && !isLoading && !isError && (
          <div className="text-sm text-muted-foreground text-center py-8">No data available</div>
        )}
      </div>
    </main>
  );
}
