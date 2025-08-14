import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import Nav from "@/components/nav";

export const metadata: Metadata = {
  title: "SmartKeys — Global Autocorrect for Windows",
  description: "Type faster with fewer errors.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Nav />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
