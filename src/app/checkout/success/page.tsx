export default function Success() {
  return (
    <main className="px-6 py-16 text-center">
      <h1 className="text-3xl font-bold">Thanks!</h1>
      <p className="text-muted-foreground mt-2">
        Your license has been issued. Check it in{" "}
        <a
          className="underline"
          href="/dashboard/licenses"
        >
          Licenses
        </a>
        .
      </p>
    </main>
  );
}
