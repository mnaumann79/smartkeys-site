import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import NavServer from "@/components/navbar/nav-server";

export const metadata: Metadata = {
  title: "SmartKeys — Global Autocorrect for Windows",
  description: "Type faster with fewer errors.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <NavServer />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
