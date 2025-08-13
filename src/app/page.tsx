import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="px-6 py-16">
      <section className="mx-auto max-w-3xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">SmartKeys</h1>
        <p className="text-lg text-muted-foreground">
          Global autocorrect for Windows. Type faster. Fewer errors.
        </p>
        <div className="flex justify-center gap-3">
          <Button>Download</Button>
          <Button variant="outline">Sign in</Button>
        </div>
      </section>

      <section className="mx-auto max-w-3xl mt-12">
        <Card>
          <CardContent className="p-6 text-left">
            <div className="font-semibold">Install OK</div>
            <div className="text-sm text-muted-foreground">
              If you see styled buttons and this card, shadcn/tailwind/Next are wired.
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
